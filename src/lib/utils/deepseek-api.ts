import axios from 'axios';
import { DeepSeekConfig } from '../config/deepseek';
import { Conversation } from '../../types/chat';

// Only import the Message type, since we're defining it here
import type { Message as ChatMessage } from '../../types/chat';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string | null;
  }[];
}

interface DeepSeekStreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
}

export interface Model {
  id: string;
  name: string;
  description?: string;
  created?: number;
  owned_by?: string;
}

// Check if network is available
function isOnline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

// Validate API configuration
function validateConfig(config: DeepSeekConfig): boolean {
  return Boolean(config.apiKey && config.baseUrl && config.model);
}

// 获取DeepSeek可用的模型列表
export async function getModels(config: DeepSeekConfig): Promise<Model[]> {
  // 检查网络状态
  if (!isOnline()) {
    throw new Error('No internet connection. Please check your network.');
  }

  // 验证配置
  if (!config.apiKey || !config.baseUrl) {
    throw new Error('Invalid API configuration. Please check your API key and base URL.');
  }

  try {
    const response = await axios.get(
      `${config.baseUrl}/models`,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        },
        timeout: 10000, // 10 seconds timeout
      }
    );

    // 如果API返回不包含data或data.data，则返回一些默认模型
    if (!response.data || !response.data.data) {
      return getDefaultModels();
    }

    return response.data.data.map((model: any) => ({
      id: model.id,
      name: model.id.split('/').pop() || model.id,
      description: model.description || '',
      created: model.created,
      owned_by: model.owned_by || 'DeepSeek'
    }));
  } catch (error) {
    console.error('Error fetching DeepSeek models:', error);
    
    // 如果API调用失败，返回一些默认模型
    return getDefaultModels();
  }
}

// 提供一些默认的DeepSeek模型，以防API调用失败
function getDefaultModels(): Model[] {
  return [
    {
      id: 'deepseek-chat',
      name: 'DeepSeek Chat',
      description: 'General purpose chat model',
      owned_by: 'DeepSeek'
    },
    {
      id: 'deepseek-coder',
      name: 'DeepSeek Coder',
      description: 'Specialized for coding tasks',
      owned_by: 'DeepSeek'
    },
    {
      id: 'deepseek-llm-67b-chat',
      name: 'DeepSeek LLM 67B Chat',
      description: '67B parameter chat model',
      owned_by: 'DeepSeek'
    },
    {
      id: 'deepseek-math',
      name: 'DeepSeek Math',
      description: 'Specialized for mathematical tasks',
      owned_by: 'DeepSeek'
    }
  ];
}

// Function to send a non-streaming request to DeepSeek API
export async function sendMessage(
  messages: Message[],
  config: DeepSeekConfig
): Promise<string> {
  // Check network status first
  if (!isOnline()) {
    throw new Error('No internet connection. Please check your network.');
  }

  // Validate config
  if (!validateConfig(config)) {
    throw new Error('Invalid API configuration. Please check your settings.');
  }

  try {
    const response = await axios.post<DeepSeekResponse>(
      `${config.baseUrl}/chat/completions`,
      {
        model: config.model,
        messages,
        stream: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        timeout: 30000, // 30 seconds timeout
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error sending message to DeepSeek API:', error);
    
    // Provide more specific error messages based on error type
    if (axios.isAxiosError(error)) {
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Authentication failed. Please check your API key.');
        } else if (error.response.status === 404) {
          throw new Error('API endpoint not found. Please check the base URL.');
        } else {
          throw new Error(`API error: ${error.response.status} - ${error.response.statusText}`);
        }
      } else if (error.request) {
        throw new Error('No response from server. Please try again later.');
      } else {
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
    
    throw new Error('Failed to get response from DeepSeek API');
  }
}

// Function to send a streaming request to DeepSeek API
export async function sendMessageStream(
  messages: Message[],
  config: DeepSeekConfig,
  onChunk: (chunk: string) => void,
  onDone: () => void
): Promise<void> {
  // Check network status first
  if (!isOnline()) {
    throw new Error('No internet connection. Please check your network.');
  }

  // Validate config
  if (!validateConfig(config)) {
    throw new Error('Invalid API configuration. Please check your settings.');
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        stream: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        onDone();
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        // Skip empty lines and "[DONE]" messages
        if (line === '' || line === 'data: [DONE]') continue;
        
        // Remove the "data: " prefix
        const jsonStr = line.replace(/^data: /, '');
        
        try {
          const json = JSON.parse(jsonStr) as DeepSeekStreamChunk;
          const content = json.choices[0].delta.content || '';
          if (content) {
            onChunk(content);
          }
        } catch (e) {
          console.error('Error parsing chunk:', e, jsonStr);
        }
      }
    }
  } catch (error) {
    console.error('Error streaming message from DeepSeek API:', error);
    
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again later.');
    }
    
    throw new Error(error instanceof Error ? error.message : 'Failed to stream response from DeepSeek API');
  }
}

// Re-export the Conversation type
export type { Conversation }; 