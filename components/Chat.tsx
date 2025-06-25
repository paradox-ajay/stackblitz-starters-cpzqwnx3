'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types/game';
import { Send } from 'lucide-react';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onGuess: (guess: string) => void;
  isDrawing: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, onGuess, isDrawing }) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (isDrawing) {
      onSendMessage(inputValue);
    } else {
      onGuess(inputValue);
    }
    
    setInputValue('');
  };

  return (
    <div className="flex flex-col h-96 bg-white rounded-lg shadow-md">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`p-2 rounded-lg max-w-xs ${
              message.isGuess
                ? 'bg-blue-100 text-blue-800 ml-auto'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <div className="font-semibold text-sm">{message.playerName}</div>
            <div className="text-sm">{message.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={isDrawing ? "Type a message..." : "Type your guess..."}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={50}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;