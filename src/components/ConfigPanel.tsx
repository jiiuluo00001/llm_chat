'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { DeepSeekConfig, defaultConfig, saveConfig, getConfig } from '../lib/config/deepseek';
import { Model, getModels } from '../lib/utils/deepseek-api';

interface ConfigPanelProps {
  onConfigChange: (config: DeepSeekConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfigPanel({ onConfigChange, isOpen, onClose }: ConfigPanelProps) {
  const [config, setConfig] = useState<DeepSeekConfig>(defaultConfig);
  const [isMounted, setIsMounted] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 客户端挂载后才加载配置
    setIsMounted(true);
    setConfig(getConfig());
  }, []);

  // 当API配置改变且已挂载时，尝试获取模型列表
  useEffect(() => {
    if (isMounted && config.apiKey && config.baseUrl) {
      fetchModels();
    }
  }, [isMounted, config.apiKey, config.baseUrl]);

  const fetchModels = async () => {
    // 如果没有API密钥或Base URL，不执行请求
    if (!config.apiKey || !config.baseUrl) return;

    setIsLoading(true);
    setError(null);

    try {
      const modelList = await getModels(config);
      setModels(modelList);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch models');
      console.error('Error fetching models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    // Update the config with the new value
    const updatedConfig = {
      ...config,
      [name]: type === 'checkbox' ? checked : value,
    };
    
    setConfig(updatedConfig);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveConfig(config);
    onConfigChange(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div onClick={onClose} className="absolute inset-0"></div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 z-10">
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">DeepSeek API Settings</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  name="apiKey"
                  value={isMounted ? config.apiKey : defaultConfig.apiKey}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400"
                  placeholder="sk-..."
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Your DeepSeek API key from the DeepSeek dashboard.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Base URL
                </label>
                <input
                  type="text"
                  name="baseUrl"
                  value={isMounted ? config.baseUrl : defaultConfig.baseUrl}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400"
                  placeholder="https://api.deepseek.com/v1"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  The base URL for DeepSeek API requests.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model
                </label>
                {models.length > 0 ? (
                  <select
                    name="model"
                    value={isMounted ? config.model : defaultConfig.model}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      name="model"
                      value={isMounted ? config.model : defaultConfig.model}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white placeholder-gray-400"
                      placeholder="deepseek-chat"
                      required
                    />
                    {isLoading && (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    )}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {isLoading 
                    ? 'Loading available models...' 
                    : models.length > 0 
                      ? 'Select a model from the available options.' 
                      : 'Enter the model ID to use for chat completions.'}
                </p>
              </div>
              
              <div className="flex items-center">
                <input
                  id="stream"
                  type="checkbox"
                  name="stream"
                  checked={isMounted ? config.stream : defaultConfig.stream}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="stream" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Enable streaming responses
                </label>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!config.apiKey || !config.baseUrl || !config.model}
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 