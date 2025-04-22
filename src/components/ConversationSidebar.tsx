'use client';

import React from 'react';
import { Conversation } from '../types/chat';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onCreateNewChat: () => void;
  onDeleteConversation: (id: string) => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onCreateNewChat,
  onDeleteConversation
}) => {
  // 按更新时间排序，最近更新的在前面
  const sortedConversations = [...conversations].sort((a, b) => 
    b.updatedAt.getTime() - a.updatedAt.getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onCreateNewChat}
        className="flex items-center justify-center gap-2 py-2 px-3 mb-3 w-full rounded-md border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        新对话
      </button>

      <div className="flex-1 overflow-auto">
        <div className="space-y-1">
          {sortedConversations.map((conversation) => (
            <div 
              key={conversation.id}
              className="relative group"
            >
              <button
                onClick={() => onSelectConversation(conversation.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                  currentConversationId === conversation.id
                    ? 'bg-gray-200 dark:bg-gray-700 font-medium'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="truncate">{conversation.title}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {conversation.messages.length > 0 
                    ? `${conversation.messages.length} 条消息` 
                    : '无消息'}
                </div>
              </button>
              <button
                onClick={() => onDeleteConversation(conversation.id)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                aria-label="删除对话"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
        {conversations.length === 0 && (
          <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
            还没有对话记录
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar; 