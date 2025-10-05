import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface ChatPanelProps {
  history: ChatMessage[];
  isChatting: boolean;
  onSendMessage: (message: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ history, isChatting, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [history]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isChatting) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl flex flex-col h-full max-h-[75vh] shadow-lg">
      <h3 className="text-xl font-bold text-purple-300 p-4 border-b border-gray-700 flex-shrink-0">Refine Your Track</h3>
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        {history.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
            <div className={`${message.role === 'user' ? 'bg-purple-600' : 'bg-gray-700'} text-white p-3 rounded-lg max-w-xs shadow`}>
              {message.parts[0].text}
            </div>
          </div>
        ))}
        {isChatting && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="bg-gray-700 text-white p-3 rounded-lg shadow">
              <span className="animate-pulse">Producer is cooking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., make the chorus more hype"
            disabled={isChatting}
            className="w-full pl-4 pr-20 py-3 text-white bg-gray-700 border border-gray-600 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all placeholder-gray-400"
          />
          <button
            type="submit"
            disabled={isChatting || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-full transition-all duration-300 transform hover:scale-105"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;