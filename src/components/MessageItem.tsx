'use client';

import React, { useState } from 'react';
import { Message } from '../types/chat';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import rehypeRaw from 'rehype-raw';

// 扩展Message类型以包含可选的createdAt属性
interface ExtendedMessage extends Message {
  createdAt?: Date;
}

interface MessageItemProps {
  message: ExtendedMessage;
}

// 自定义的图标组件，避免依赖react-icons
const UserIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const RobotIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
    <path d="M21,10.975V8a2,2,0,0,0-2-2H16V4.874a4,4,0,1,0-8,0V6H5A2,2,0,0,0,3,8v3a3,3,0,0,0,1,2.236V16.5a3.5,3.5,0,0,0,7,0V13H13v3.5a3.5,3.5,0,0,0,7,0V13.211A3,3,0,0,0,21,10.975ZM10,4.874a2,2,0,1,1,4,0V6H10Zm0,8.126a1,1,0,1,1-1-1A1,1,0,0,1,10,13Zm6-1a1,1,0,1,1,1,1A1,1,0,0,1,16,12Z"/>
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M20 2H10c-1.103 0-2 .897-2 2v4H4c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2v-4h4c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM4 20V10h10l.002 10H4zm16-6h-4v-4c0-1.103-.897-2-2-2h-4V4h10v10z"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
  </svg>
);

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const isUser = message.role === 'user';

  return (
    <div className={`flex p-4 ${isUser ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200`}>
      <div className="flex-shrink-0 mr-4">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
            <UserIcon />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <RobotIcon />
          </div>
        )}
      </div>
      
      <div className="flex-1 relative">
        <div className="font-medium text-sm text-gray-500 mb-1">
          {isUser ? 'You' : 'AI'}
        </div>
        
        <div className="prose max-w-none">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match;
                return !isInline ? (
                  <div className="relative group">
                    <SyntaxHighlighter
                      language={match?.[1] || ''}
                      style={vscDarkPlus}
                      PreTag="div"
                      className="rounded-md"
                      showLineNumbers={true}
                      wrapLines={true}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                    <button
                      onClick={() => copyToClipboard(String(children))}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 text-white p-1 rounded"
                      aria-label="Copy code"
                    >
                      {copied ? <CheckIcon /> : <CopyIcon />}
                    </button>
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        {!isUser && message.content && (
          <button
            onClick={() => copyToClipboard(message.content)}
            className="absolute top-0 right-0 text-gray-400 hover:text-gray-600 p-1 rounded"
            aria-label="Copy message"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageItem; 