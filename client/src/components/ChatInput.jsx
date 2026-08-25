import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  MicOff,
  Globe,
  Loader2,
  StopCircle,
  Sparkles
} from 'lucide-react';
import { FileUploadPreview } from './FileUploadPreview';

export function ChatInput({
  onSendMessage,
  isLoading,
  onStopGeneration,
  useWebSearch,
  setUseWebSearch,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  isListening,
  onStartVoice,
  onStopVoice,
  speechTranscript
}) {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync speech recognition transcript
  useEffect(() => {
    if (speechTranscript) {
      setInput(speechTranscript);
    }
  }, [speechTranscript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (isLoading) return;
    const trimmed = input.trim();
    if (!trimmed && (!attachments || attachments.length === 0)) return;

    onSendMessage({
      content: trimmed,
      attachments,
      useWebSearch
    });

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await onAddAttachment(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 pb-4">
      {/* File Upload Preview */}
      <FileUploadPreview attachments={attachments} onRemove={onRemoveAttachment} />

      {/* Input Box Card */}
      <div className="relative rounded-2xl glass-panel shadow-2xl border border-gray-700/60 dark:border-gray-800 bg-gray-900/80 dark:bg-dark-surface/90 transition-all focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20">
        {/* Listening state banner */}
        {isListening && (
          <div className="flex items-center justify-between px-4 py-2 bg-rose-500/10 border-b border-rose-500/20 text-rose-300 text-xs rounded-t-2xl animate-pulse">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span className="font-medium">Listening to your voice... Speak now</span>
            </div>
            <button
              onClick={onStopVoice}
              className="text-rose-400 hover:text-rose-200 font-semibold text-xs"
            >
              Finish
            </button>
          </div>
        )}

        {/* Textarea */}
        <div className="p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isListening
                ? 'Transcribing your voice...'
                : 'Message Yashvardhan AI... (Shift+Enter for newline)'
            }
            className="w-full bg-transparent text-gray-100 placeholder-gray-500 resize-none focus:outline-none text-sm md:text-base max-h-48 scrollbar-thin"
          />
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-800/80 text-xs">
          {/* Left Actions (Search Toggle & Attach File) */}
          <div className="flex items-center space-x-1.5">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept="image/*,.txt,.md,.js,.jsx,.ts,.tsx,.json,.csv,.py,.html,.css,.pdf"
            />

            {/* Attach Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-800/80 transition-colors"
              title="Attach files or images"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Web Search Toggle */}
            <button
              type="button"
              onClick={() => setUseWebSearch(!useWebSearch)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                useWebSearch
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80 border border-transparent'
              }`}
              title="Toggle Web Search"
            >
              <Globe className={`w-3.5 h-3.5 ${useWebSearch ? 'text-indigo-400 animate-spin-slow' : ''}`} />
              <span className="hidden sm:inline">Web Search</span>
              {useWebSearch && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Right Actions (Voice & Send) */}
          <div className="flex items-center space-x-2">
            {/* Speech-to-Text Button */}
            <button
              type="button"
              onClick={isListening ? onStopVoice : onStartVoice}
              className={`p-2 rounded-xl transition-all ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/80'
              }`}
              title={isListening ? 'Stop recording voice' : 'Voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send / Stop Button */}
            {isLoading ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium shadow-md transition-all"
                title="Stop generating"
              >
                <StopCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() && (!attachments || attachments.length === 0)}
                className={`flex items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all ${
                  input.trim() || (attachments && attachments.length > 0)
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white ring-2 ring-brand-500/30'
                    : 'bg-gray-800/70 text-gray-500 cursor-not-allowed'
                }`}
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline ml-1.5">Send</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-2 text-[11px] text-gray-500">
        Yashvardhan AI can make mistakes. Check important information.
      </div>
    </div>
  );
}
