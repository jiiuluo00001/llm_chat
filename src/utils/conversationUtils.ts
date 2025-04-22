import { Conversation, Message } from '../types/chat';

// 生成唯一的会话ID
export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// 从消息生成会话标题
export const generateTitle = (messages: Message[]): string => {
  if (messages.length === 0) {
    return '新对话';
  }
  
  // 获取第一条用户消息作为标题基础
  const firstUserMessage = messages.find(msg => msg.role === 'user');
  if (!firstUserMessage) {
    return '新对话';
  }
  
  // 从用户消息中提取标题
  const content = firstUserMessage.content.trim();
  
  // 如果消息很短，直接使用
  if (content.length <= 30) {
    return content;
  }
  
  // 否则截取前30个字符
  return content.substring(0, 30) + '...';
};

// 创建新的会话
export const createNewConversation = (): Conversation => {
  return {
    id: generateId(),
    title: '新对话',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// 从localStorage加载所有会话
export const loadConversations = (): Conversation[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  
  try {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      const parsed = JSON.parse(savedConversations);
      
      // 转换日期字符串为Date对象
      return parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt)
      }));
    }
  } catch (e) {
    console.error('Failed to load conversations:', e);
  }
  
  return [];
};

// 保存所有会话到localStorage
export const saveConversations = (conversations: Conversation[]): void => {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('conversations', JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations:', e);
  }
};

// 更新会话
export const updateConversation = (
  conversations: Conversation[],
  conversationId: string,
  messages: Message[]
): Conversation[] => {
  const now = new Date();
  
  return conversations.map(conv => {
    if (conv.id === conversationId) {
      // 如果标题是默认的"新对话"并且有消息，则生成新标题
      const title = (conv.title === '新对话' && messages.length > 0) 
        ? generateTitle(messages)
        : conv.title;
        
      return {
        ...conv,
        messages,
        title,
        updatedAt: now
      };
    }
    return conv;
  });
};

// 删除会话
export const deleteConversation = (
  conversations: Conversation[],
  conversationId: string
): Conversation[] => {
  return conversations.filter(conv => conv.id !== conversationId);
}; 