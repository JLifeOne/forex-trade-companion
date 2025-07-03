
import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { queryChatAssistant } from '../services/geminiService';
import { FaPaperPlane, FaRobot, FaCommentDots, FaWindowMinimize, FaRegWindowClose } from 'react-icons/fa'; // Added FaCommentDots, FaWindowMinimize

type ChatWidgetDisplayMode = 'hidden' | 'collapsed' | 'expanded';

interface ChatAssistantProps {
  displayMode: ChatWidgetDisplayMode;
  onToggleExpand: () => void;
  onHideWidget: () => void;
}

const ChatAssistantComponent: React.FC<ChatAssistantProps> = ({ displayMode, onToggleExpand, onHideWidget }) => {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (displayMode === 'expanded' && messages.length === 0) {
       setMessages([{ id: '0', role: 'assistant', text: "Hello! I'm your Forex trading assistant. How can I help you today? (e.g., explain VWAP, risk management tips)", timestamp: Date.now() }]);
    }
    if (displayMode === 'expanded' && inputRef.current) {
        inputRef.current.focus();
    }
  }, [displayMode, messages.length]);

  useEffect(() => {
    if (displayMode === 'expanded') {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, displayMode]);

  const handleSendPrompt = async () => {
    if (!prompt.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: prompt,
      timestamp: Date.now(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const assistantResponseText = await queryChatAssistant(prompt, messages);
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: assistantResponseText,
        timestamp: Date.now(),
      };
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Chat API error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now(),
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
       if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendPrompt();
    }
  };

  if (displayMode === 'hidden') {
    return null;
  }

  if (displayMode === 'collapsed') {
    return (
      <button
        onClick={onToggleExpand}
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg z-50 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-gray-900"
        aria-label="Open AI Assistant"
        title="Open AI Assistant"
      >
        <FaCommentDots size={24} />
      </button>
    );
  }

  // Expanded mode
  return (
    <div className="fixed bottom-6 right-6 bg-gray-800 shadow-2xl rounded-lg w-full max-w-sm h-[500px] flex flex-col z-50 border border-indigo-700 print:hidden">
      <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-750 rounded-t-lg">
        <h3 className="text-md font-semibold text-indigo-300 flex items-center">
          <span className="mr-2 text-indigo-400"><FaRobot /></span> AI Trading Assistant
        </h3>
        <div className="flex items-center space-x-2">
            <button
                onClick={onToggleExpand} // This will collapse it
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-600 transition-colors"
                aria-label="Minimize chat"
                title="Minimize Chat"
            >
                <FaWindowMinimize size={16}/>
            </button>
            <button
                onClick={onHideWidget} // This will hide it
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-600 transition-colors"
                aria-label="Close chat"
                title="Close Chat"
            >
                <FaRegWindowClose size={18}/>
            </button>
        </div>
      </div>

      <div className="flex-1 p-3 space-y-3 overflow-y-auto bg-gray-800">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-2.5 rounded-xl shadow ${
                msg.role === 'user'
                  ? 'bg-indigo-500 text-white rounded-br-none'
                  : 'bg-gray-600 text-gray-100 rounded-bl-none'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-indigo-200 text-right' : 'text-gray-400 text-left'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
              <div className="max-w-[85%] p-2.5 rounded-xl shadow bg-gray-600 text-gray-100 rounded-bl-none">
                  <div className="flex items-center">
                      <div className="dot-flashing mr-2"></div>
                      <span className="text-sm">Assistant is typing...</span>
                  </div>
              </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-gray-700 bg-gray-750 rounded-b-lg">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything..."
            className="flex-1 bg-gray-700 text-white p-2.5 rounded-lg border border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none shadow-sm disabled:opacity-60 text-sm"
            disabled={isLoading}
          />
          <button
            onClick={handleSendPrompt}
            disabled={isLoading || !prompt.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold p-2.5 rounded-lg shadow-sm transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            aria-label="Send message"
          >
            <FaPaperPlane size={16}/>
          </button>
        </div>
      </div>
      <style>{`
        .dot-flashing {
          position: relative;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: #9ca3af; /* gray-400 */
          color: #9ca3af;
          animation: dotFlashing 1s infinite linear alternate;
          animation-delay: .5s;
        }
        .dot-flashing::before, .dot-flashing::after {
          content: '';
          display: inline-block;
          position: absolute;
          top: 0;
        }
        .dot-flashing::before {
          left: -10px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: #9ca3af;
          color: #9ca3af;
          animation: dotFlashing 1s infinite alternate;
          animation-delay: 0s;
        }
        .dot-flashing::after {
          left: 10px;
          width: 6px;
          height: 6px;
          border-radius: 5px;
          background-color: #9ca3af;
          color: #9ca3af;
          animation: dotFlashing 1s infinite alternate;
          animation-delay: 1s;
        }
        @keyframes dotFlashing {
          0% { background-color: #9ca3af; }
          50%, 100% { background-color: #60a5fa; } /* blue-400 to match indigo theme better */
        }
      `}</style>
    </div>
  );
};

export default React.memo(ChatAssistantComponent);
