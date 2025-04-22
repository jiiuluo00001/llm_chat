// DeepSeek LLM API configuration
export interface DeepSeekConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  stream: boolean;
}

// Default configuration, can be overridden in the UI
export const defaultConfig: DeepSeekConfig = {
  apiKey: "sk-***",
  baseUrl: "https://api.deepseek.com/v1",
  model: "deepseek-chat",
  stream: true,
};

// Get configuration from localStorage if available
export function getConfig(): DeepSeekConfig {
  if (typeof window === 'undefined') {
    return defaultConfig;
  }

  const savedConfig = localStorage.getItem('deepseekConfig');
  if (savedConfig) {
    try {
      return JSON.parse(savedConfig);
    } catch (e) {
      console.error('Failed to parse saved config', e);
    }
  }
  return defaultConfig;
}

// Save configuration to localStorage
export function saveConfig(config: DeepSeekConfig): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem('deepseekConfig', JSON.stringify(config));
}
