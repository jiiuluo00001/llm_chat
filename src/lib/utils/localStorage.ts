'use client';

import { Conversation } from '../../types/chat';

/**
 * 从localStorage加载对话数据
 * @returns 对话数组或空数组
 */
export function loadConversationsFromLocalStorage(): Conversation[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const savedConversations = localStorage.getItem('conversations');
    if (!savedConversations) {
      return [];
    }

    const parsed = JSON.parse(savedConversations);
    // 转换日期字符串为Date对象
    return parsed.map((conv: any) => ({
      ...conv,
      createdAt: new Date(conv.createdAt),
      updatedAt: new Date(conv.updatedAt),
      messages: conv.messages.map((msg: any) => ({
        ...msg,
        createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined
      }))
    }));
  } catch (err) {
    console.error('Failed to load conversations:', err);
    return [];
  }
}

/**
 * 保存对话数据到localStorage
 * @param conversations 要保存的对话数组
 * @returns 是否保存成功
 */
export function saveConversationsToLocalStorage(conversations: Conversation[]): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.setItem('conversations', JSON.stringify(conversations));
    return true;
  } catch (err) {
    console.error('Failed to save conversations:', err);
    return false;
  }
}

/**
 * 清除localStorage中的对话数据
 * @returns 是否清除成功
 */
export function clearConversationsFromLocalStorage(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    localStorage.removeItem('conversations');
    return true;
  } catch (err) {
    console.error('Failed to clear conversations:', err);
    return false;
  }
} 