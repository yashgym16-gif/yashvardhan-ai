import React, { useRef, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  Download,
  Trash2,
  Globe,
  Volume2,
  VolumeX,
  Code2,
  Cpu,
  Compass,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

export function ChatArea({
  conversation,
  messages = [],
  isLoading,
  onSendMessage,
  onStopGeneration,
  onRetryMessage,
  useWebSearch,
  setUseWebSearch,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  isListening,
  onStartVoice,
  onStopVoice,
  speechTranscript,
  onSpeak,
  speakingContent,
  onStopSpeaking,
  onToggleSidebar,
  settings,
  onOpenSettings
}) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Export conversation to markdown
  const handleExportMarkdown = () => {
    if (!messages || messages.length === 0) return;
    let md = `# Conversation: ${conversation?.title || 'Yashvardhan AI Chat'}\n`;
    md += `*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;

    messages.forEach((m) => {
      const role = m.role === 'user' ? '### 👤 User' : '### 🤖 Yashvardhan AI';
      md += `${role} (${new Date(m.createdAt).toLocaleTimeString()}):\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(conversation?.title || 'chat').replace(/[^a-z0-9]/gi, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const starterPrompts = [
    {
      title: 'Modern Web App',
      description: 'Build a responsive React component with Tailwind CSS & animations',
      prompt: 'Create a responsive modern dashboard card component in React using Tailwind CSS with glassmorphism and smooth hover transitions.'
    },
    {
      title: 'Full-Stack Architecture',
      description: 'Design a scalable, secure Node.js & SQLite API architecture',
      prompt: 'Explain the best practices for structuring a modular full-stack application with clean service boundaries, secure API key handling, and database connection pooling.'
    },
    {
      title: 'Web Search & Research',
      description: 'Find and synthesize the latest AI & technology breakthroughs',
      prompt: 'What are the most recent advancements in multi-agent AI systems and large language model architectures?'
    },
    {
      title: 'Code Debugger & Refactor',
      description: 'Optimize algorithms, eliminate memory leaks, and add unit tests',
      prompt: 'Can you review this code logic for edge cases, performance bottlenecks, and explain how to write comprehensive unit tests?'
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#0B0F19] relative">
      {/* Top Header Bar */}
      <header className="h-14 border-b border-gray-800/60 dark:border-dark-border/60 px-4 flex items-center justify-between bg-gray-950/60 dark:bg-[#0d121f]/80 backdrop-blur-md z-10">
        {/* Left: Mobile Menu Toggle & Title */}
        <div className="flex items-center space-x-3 truncate">
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800"
            title="Open Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2 truncate">
            <h2 className="text-sm font-semibold text-gray-100 truncate">
              {conversation?.title || 'Yashvardhan AI'}
            </h2>
            <button
              onClick={onOpenSettings}
              className="hidden sm:flex items-center space-x-1 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-[11px] font-mono hover:bg-brand-500/20 transition-colors"
              title="Click to configure AI model"
            >
              <Cpu className="w-3 h-3" />
              <span>{settings?.model || 'gemini-1.5-flash'}</span>
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
          {/* Web Search Quick Toggle */}
          <button
            onClick={() => setUseWebSearch(!useWebSearch)}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl transition-all ${
              useWebSearch
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
            title="Toggle Web Search"
          >
            <Globe className={`w-3.5 h-3.5 ${useWebSearch ? 'text-indigo-400' : ''}`} />
            <span className="hidden sm:inline">Search: {useWebSearch ? 'ON' : 'OFF'}</span>
          </button>

          {/* Export Chat */}
          {messages.length > 0 && (
            <button
              onClick={handleExportMarkdown}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors flex items-center space-x-1"
              title="Export conversation to Markdown"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          )}
        </div>
      </header>

      {/* Message Stream Area */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-6 scrollbar-thin">
        {messages.length === 0 ? (
          /* Empty State Hero */
          <div className="max-w-3xl mx-auto h-full flex flex-col justify-center items-center text-center px-4 py-8 animate-fade-in">
            {/* Glowing Brand Icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-600 to-cyan-400 rounded-3xl blur-xl opacity-40 animate-pulse-subtle" />
              <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-2xl ring-4 ring-brand-500/20">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-brand-300 bg-clip-text text-transparent mb-2">
              Welcome to {settings?.persona || 'Yashvardhan AI'}
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm max-w-lg mb-8 leading-relaxed">
              Your intelligent, multimodal personal AI assistant. Equipped with real-time web search, document & code analysis, persistent memory, and voice features.
            </p>

            {/* Quick Starter Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
              {starterPrompts.map((card, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage({ content: card.prompt, attachments: [], useWebSearch })}
                  className="p-4 rounded-2xl bg-gray-900/40 hover:bg-gray-900/80 border border-gray-800/80 hover:border-brand-500/40 text-left transition-all duration-200 group relative overflow-hidden backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="font-semibold text-xs text-gray-200 group-hover:text-brand-300 transition-colors">
                      {card.title}
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-brand-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Messages Thread */
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onRetry={() => onRetryMessage(message)}
                onSpeak={(text) => onSpeak(text, message.content)}
                isSpeakingThis={speakingContent === message.content}
                onStopSpeaking={onStopSpeaking}
              />
            ))}

            {/* Loading Indicator Bubble */}
            {isLoading && (
              <div className="flex gap-3 px-4 py-5 md:px-6 rounded-2xl bg-gray-900/40 border border-gray-800/40 shadow-sm animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white ring-2 ring-brand-500/20">
                  <Sparkles className="w-5 h-5 animate-spin-slow" />
                </div>
                <div className="flex-1 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="text-xs text-gray-400 ml-2">Yashvardhan AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Sticky Bottom Chat Input */}
      <ChatInput
        onSendMessage={onSendMessage}
        isLoading={isLoading}
        onStopGeneration={onStopGeneration}
        useWebSearch={useWebSearch}
        setUseWebSearch={setUseWebSearch}
        attachments={attachments}
        onAddAttachment={onAddAttachment}
        onRemoveAttachment={onRemoveAttachment}
        isListening={isListening}
        onStartVoice={onStartVoice}
        onStopVoice={onStopVoice}
        speechTranscript={speechTranscript}
      />
    </div>
  );
}
