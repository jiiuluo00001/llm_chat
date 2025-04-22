'use client';

import React from 'react';
import dynamic from 'next/dynamic';

// 使用动态导入，禁用SSR预渲染
const ChatInterface = dynamic(() => import('../components/ChatInterface'), { 
  ssr: false,
  loading: () => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
        </div>
        <p className="text-gray-600 dark:text-gray-400">Loading chat interface...</p>
      </div>
    </div>
  )
});

export default function Home() {
  return <ChatInterface />;
} 