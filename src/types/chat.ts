export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
} 