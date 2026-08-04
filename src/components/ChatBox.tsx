import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Smile, ShieldAlert } from 'lucide-react';
import { ChatMessage, UserProfile } from '../types';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (msg: string) => void;
  currentUser: UserProfile | null;
  disabled?: boolean;
}

const QUICK_PHRASES = [
  'Good luck! 🍀',
  'Nice move! 👏',
  'Good game! 🤝',
  'Thinking... 🤔',
  'Oops! 😅',
];

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  currentUser,
  disabled = false,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickPhrase = (phrase: string) => {
    if (disabled) return;
    onSendMessage(phrase);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-full min-h-[360px] shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm text-slate-200">Live Match Chat</h3>
        </div>
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          Real-Time
        </span>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2.5 max-h-[280px] sm:max-h-[320px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
            <Smile className="w-8 h-8 mb-2 opacity-40 text-amber-400" />
            <p>No messages yet. Say hello or send good luck!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = currentUser && msg.senderId === currentUser.id;
            const isSystem = msg.isSystem;

            if (isSystem) {
              return (
                <div
                  key={msg.id}
                  className="mx-auto my-1 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-amber-300 text-center max-w-[90%] flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{msg.message}</span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-400 font-medium mb-0.5 px-1">
                  {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`px-3.5 py-2 rounded-2xl text-xs max-w-[85%] break-words shadow-sm ${
                    isMe
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/80 rounded-tl-none'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Phrase Chips */}
      <div className="px-3 py-2 bg-slate-900/90 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            onClick={() => handleQuickPhrase(phrase)}
            disabled={disabled}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium whitespace-nowrap transition-colors border border-slate-700/60 disabled:opacity-50"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-800/80 border-t border-slate-800 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={disabled ? 'Chat disabled' : 'Type a message...'}
          disabled={disabled}
          maxLength={280}
          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !inputText.trim()}
          className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all disabled:opacity-40 disabled:hover:bg-amber-500 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
