'use client';

import React, { useState, useRef, FormEvent, KeyboardEvent, useEffect } from 'react';
import { Message, Conversation, sendMessage, sendMessageStream, Model, getModels } from '../lib/utils/deepseek-api';
import { DeepSeekConfig, defaultConfig, getConfig } from '../lib/config/deepseek';
import { loadConversationsFromLocalStorage, saveConversationsToLocalStorage } from '../lib/utils/localStorage';
import MessageItem from './MessageItem';
import ConfigPanel from './ConfigPanel';
import ConversationSidebar from './ConversationSidebar';
import { v4 as uuidv4 } from 'uuid';

// 扩展 Message 类型以包含 createdAt
// 这样做是因为我们需要跟踪消息的创建时间，但DeepSeek API的Message类型中不包含此字段
interface ExtendedMessage extends Message {
  createdAt?: Date;
}

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<DeepSeekConfig>(defaultConfig);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // 获取当前对话
  const currentConversation = currentConversationId 
    ? conversations.find(c => c.id === currentConversationId) 
    : null;
  
  // 当前对话的消息
  const messages = currentConversation?.messages || [];

  useEffect(() => {
    setIsMounted(true);
    setConfig(getConfig());
    setIsOnline(navigator.onLine);
    
    // 从localStorage加载对话
    const savedConversations = loadConversationsFromLocalStorage();
    if (savedConversations.length > 0) {
      setConversations(savedConversations);
      
      // 设置最近的对话为当前对话
      const sorted = [...savedConversations].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
      );
      setCurrentConversationId(sorted[0].id);
    }

    const handleOnline = () => {
      setIsOnline(true);
      setError(null);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setError('You are currently offline. Please check your internet connection.');
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 保存对话到localStorage
  useEffect(() => {
    if (isMounted && conversations.length > 0) {
      saveConversationsToLocalStorage(conversations);
    }
  }, [conversations, isMounted]);

  useEffect(() => {
    if (isMounted && config.apiKey && config.baseUrl) {
      fetchModels();
    }
  }, [isMounted, config.apiKey, config.baseUrl]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchModels = async () => {
    try {
      const modelList = await getModels(config);
      setModels(modelList);
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const handleModelChange = (modelId: string) => {
    const updatedConfig = { ...config, model: modelId };
    setConfig(updatedConfig);
    saveConfig(updatedConfig);
    setIsModelDropdownOpen(false);
  };

  const saveConfig = (config: DeepSeekConfig) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('deepseekConfig', JSON.stringify(config));
      } catch (e) {
        console.error('Failed to save config', e);
      }
    }
  };

  const isConfigValid = Boolean(config.apiKey && config.baseUrl && config.model);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isMounted) {
      scrollToBottom();
    }
  }, [messages, isMounted]);

  const getCurrentModelName = () => {
    if (!isMounted) return config.model;
    const selectedModel = models.find(model => model.id === config.model);
    return selectedModel ? selectedModel.name : config.model;
  };

  // 更新对话标题
  const updateConversationTitle = (id: string, title: string) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id 
          ? { ...conv, title, updatedAt: new Date() } 
          : conv
      )
    );
  };

  // 更新对话
  const updateConversation = (id: string, messages: ExtendedMessage[]) => {
    setConversations(prev => {
      return prev.map(conv => {
        if (conv.id === id) {
          // 如果是第一条消息，使用消息内容前20个字符作为标题
          let title = conv.title;
          if (conv.title === '新对话' && messages.length > 0 && messages[0].role === 'user') {
            title = messages[0].content.slice(0, 20) + (messages[0].content.length > 20 ? '...' : '');
          }
          return { 
            ...conv, 
            messages, 
            title,
            updatedAt: new Date() 
          };
        }
        return conv;
      });
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() === '' || isLoading) return;
    
    setError(null);
    
    if (!isConfigValid) {
      setError('请先配置DeepSeek API设置');
      setIsConfigOpen(true);
      return;
    }
    
    if (!isOnline) {
      setError('您当前离线，请检查网络连接');
      return;
    }

    // 如果没有当前对话，创建一个新的
    if (!currentConversationId) {
      const newId = uuidv4();
      const newConversation: Conversation = {
        id: newId,
        title: '新对话',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setConversations(prev => [...prev, newConversation]);
      setCurrentConversationId(newId);
    }

    const userMessage: ExtendedMessage = { 
      role: 'user', 
      content: input,
      createdAt: new Date()
    };
    
    const newMessages = [...messages, userMessage];
    updateConversation(currentConversationId || '', newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const assistantMessage: ExtendedMessage = { 
        role: 'assistant', 
        content: '',
        createdAt: new Date()
      };
      updateConversation(currentConversationId || '', [...newMessages, assistantMessage]);
      
      if (config.stream) {
        let currentContent = '';
        await sendMessageStream(
          newMessages,
          config,
          (chunk: string) => {
            currentContent += chunk;
            updateConversation(currentConversationId || '', [
              ...newMessages,
              { 
                role: 'assistant', 
                content: currentContent,
                createdAt: new Date()
              }
            ]);
          },
          () => {
            setIsLoading(false);
          }
        );
      } else {
        const response = await sendMessage(newMessages, config);
        updateConversation(currentConversationId || '', [
          ...newMessages,
          { 
            role: 'assistant', 
            content: response,
            createdAt: new Date()
          }
        ]);
        setIsLoading(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setError(errorMessage);
      
      updateConversation(currentConversationId || '', [
        ...newMessages,
        { 
          role: 'assistant', 
          content: `错误: ${errorMessage}`,
          createdAt: new Date()
        }
      ]);
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    if (isLoading) {
      setError('请等待当前对话完成');
      return;
    }
    
    const newId = uuidv4();
    const newConversation: Conversation = {
      id: newId,
      title: '新对话',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setConversations(prev => [...prev, newConversation]);
    setCurrentConversationId(newId);
    setInput('');
    setError(null);
    
    if (!isConfigValid) {
      setTimeout(() => {
        setError('请先配置DeepSeek API设置');
        setIsConfigOpen(true);
      }, 300);
    }
  };

  const handleSelectConversation = (id: string) => {
    if (isLoading) {
      setError('请等待当前对话完成');
      return;
    }
    setCurrentConversationId(id);
    setError(null);
  };

  const handleDeleteConversation = (id: string) => {
    if (isLoading && currentConversationId === id) {
      setError('请等待当前对话完成后再删除');
      return;
    }
    
    setConversations(prev => prev.filter(conv => conv.id !== id));
    
    // 如果删除的是当前对话，选择最新的对话作为当前对话
    if (currentConversationId === id) {
      const remainingConversations = conversations.filter(conv => conv.id !== id);
      if (remainingConversations.length > 0) {
        const sorted = [...remainingConversations].sort(
          (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
        );
        setCurrentConversationId(sorted[0].id);
      } else {
        setCurrentConversationId(null);
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) form.requestSubmit();
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      <nav className="w-[260px] bg-gray-50 dark:bg-gray-800 h-full hidden md:block p-3 border-r border-gray-200 dark:border-gray-700">
        <ConversationSidebar 
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onCreateNewChat={handleNewChat}
          onDeleteConversation={handleDeleteConversation}
        />
      </nav>

      <div className="flex-1 flex flex-col h-full">
        <div className="hidden md:flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center space-x-2 relative" ref={modelDropdownRef}>
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <span>模型: {getCurrentModelName()}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {isModelDropdownOpen && models.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700 py-1">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={`w-full text-left px-4 py-2 text-sm ${
                      model.id === config.model 
                        ? 'bg-gray-100 dark:bg-gray-700 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium">{model.name}</div>
                    {model.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {model.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button 
            className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            onClick={() => setIsConfigOpen(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        <div className="md:hidden flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <button
            onClick={handleNewChat}
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white py-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新对话</span>
          </button>
          
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.36 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {error && isMounted && (
          <div className="bg-red-50 dark:bg-red-900/20 p-2 border-b border-red-200 dark:border-red-800">
            <div className="max-w-4xl mx-auto flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800 dark:text-red-200">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-600 dark:text-red-400"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {!isConfigValid && !isConfigOpen && isMounted && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 border-b border-yellow-200 dark:border-yellow-800">
            <div className="max-w-4xl mx-auto flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  请先配置你的DeepSeek API设置
                  <button 
                    onClick={() => setIsConfigOpen(true)}
                    className="ml-2 text-sm font-medium text-yellow-700 underline hover:text-yellow-600 dark:text-yellow-200"
                  >
                    立即配置
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 pb-32">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3 mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  DeepSeek AI Chat
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
                  通过DeepSeek API与强大的人工智能模型对话。请在右上角配置您的API设置以开始对话。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                  {[
                    "介绍一下DeepSeek大模型的主要特点",
                    "用Python写一个简单的聊天机器人",
                    "现代前端框架的发展趋势是什么？",
                    "如何通过晚间习惯改善睡眠质量？"
                  ].map((example, index) => (
                    <button
                      key={index}
                      className="p-3 text-sm text-left border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                      onClick={() => {
                        setInput(example);
                      }}
                    >
                      <div className="flex items-start">
                        <svg className="h-5 w-5 text-gray-400 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                        </svg>
                        {example}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 space-y-6">
                {messages.map((message: ExtendedMessage, index: number) => (
                  <MessageItem key={index} message={message} />
                ))}
                {isLoading && (
                  <div className="flex justify-center py-6">
                    <div className="animate-pulse flex space-x-2">
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                      <div className="h-2 w-2 bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full py-4 px-4 md:px-8 bg-gradient-to-t from-white via-white dark:from-gray-900 dark:via-gray-900">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="发送消息..."
                rows={1}
                className="w-full py-3 px-4 pr-14 resize-none overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white placeholder-gray-400"
                style={{ maxHeight: '200px', minHeight: '56px' }}
                disabled={isLoading || !isOnline || !isConfigValid}
              />
              <button
                type="submit"
                className="absolute right-3 bottom-2.5 text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || input.trim() === '' || !isOnline || !isConfigValid}
              >
                <svg
                  className={`h-6 w-6 ${isLoading ? 'animate-pulse' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    transform={isLoading ? 'rotate(90 12 12)' : ''}
                  />
                </svg>
              </button>
            </form>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400 px-1">
              <div>
                {isMounted && config.stream ? '流式输出已启用' : '阻塞式输出已启用'}
              </div>
              <div>
                按Enter键发送，Shift+Enter换行
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfigPanel
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConfigChange={(newConfig) => {
          setConfig(newConfig);
          setError(null);
        }}
      />
    </div>
  );
} 