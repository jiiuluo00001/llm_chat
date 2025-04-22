# Next.js 14 LLM聊天演示

这是一个基于Next.js 14构建的简单LLM聊天应用程序演示。

## 项目功能

- 聊天界面：用户可以与AI助手进行对话
- 消息历史：显示用户与AI的对话记录
- 响应式设计：适配不同设备屏幕大小

## 技术栈

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Server Components
- Server Actions

## 类型定义

### Message

消息类型定义位于 `src/types/chat.ts`

```typescript
export interface Message {
  role: 'user' | 'assistant';  // 消息发送者角色
  content: string;             // 消息内容
  createdAt?: Date;            // 消息创建时间（可选）
}
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 运行开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 运行生产版本

```bash
npm start
```

## Features

- 💬 Chat interface with DeepSeek AI
- ⚙️ Configurable API settings (API key, base URL, model)
- 🔄 Toggle between streaming and blocking output modes
- 🎨 Light/dark mode support based on system preferences
- 📱 Responsive design for desktop and mobile devices
- ✨ Markdown rendering for formatted AI responses

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Installation

1. Clone the repository or download the source code
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Install the Tailwind CSS typography plugin:

```bash
npm install @tailwindcss/typography
# or
yarn add @tailwindcss/typography
```

### Running the Application

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## Configuration

To use the application, you'll need to configure your DeepSeek API settings:

1. Click the "Settings" button in the top-right corner
2. Enter your DeepSeek API key
3. Configure the base URL (default: `https://api.deepseek.com/v1`)
4. Set your preferred model name
5. Toggle streaming output on or off
6. Click "Save" to apply settings

Your settings will be stored in your browser's local storage.

## Usage

1. Type your message in the text input at the bottom of the screen
2. Press Enter or click the "Send" button to send your message
3. The AI response will be displayed in the chat interface
4. Use the settings panel to configure the API connection and response mode

## Technical Details

- Built with Next.js 14 App Router and React 18
- Styled with Tailwind CSS
- Uses React hooks for state management
- Implements streaming and non-streaming response handling
- Employs Server Components where possible for improved performance
- Supports dark/light mode based on system preferences

## License

This project is licensed under the MIT License - see the LICENSE file for details. 