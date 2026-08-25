import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot,
  User,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCw,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { FileUploadPreview } from './FileUploadPreview';

export function ChatMessage({
  message,
  onRetry,
  onSpeak,
  isSpeakingThis,
  onStopSpeaking
}) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(false);

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div
      className={`group relative flex gap-3 px-4 py-5 md:px-6 rounded-2xl transition-all duration-200 ${
        isUser
          ? 'bg-transparent text-gray-100 flex-row-reverse'
          : 'bg-gray-900/40 dark:bg-dark-surface/50 border border-gray-800/40 dark:border-dark-border/40 shadow-sm backdrop-blur-sm'
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-md transition-transform ${
          isUser
            ? 'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white'
            : 'bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-500 text-white ring-2 ring-brand-500/20'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </div>

      {/* Message Body Container */}
      <div className={`flex-1 min-w-0 max-w-full ${isUser ? 'flex flex-col items-end' : ''}`}>
        {/* Header (Role & Time) */}
        <div className={`flex items-center space-x-2 mb-1.5 text-xs ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <span className="font-semibold text-gray-300">
            {isUser ? 'You' : 'Yashvardhan AI'}
          </span>
          {formattedTime && (
            <span className="text-[11px] text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3 inline" />
              {formattedTime}
            </span>
          )}
          {!isUser && message.tokens > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700/50">
              ~{message.tokens} tokens
            </span>
          )}
        </div>

        {/* Attachments (if any) */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 w-full">
            <FileUploadPreview attachments={message.attachments} />
          </div>
        )}

        {/* Search Results Citations (if any) */}
        {message.searchResults && message.searchResults.length > 0 && (
          <div className="mb-3 w-full rounded-xl bg-indigo-950/20 border border-indigo-500/20 overflow-hidden text-xs">
            <button
              onClick={() => setShowSources(!showSources)}
              className="w-full flex items-center justify-between px-3 py-2 text-indigo-300 hover:text-indigo-200 transition-colors font-medium"
            >
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Web Sources Cited ({message.searchResults.length})</span>
              </div>
              {showSources ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showSources && (
              <div className="p-3 pt-0 grid grid-cols-1 md:grid-cols-2 gap-2 border-t border-indigo-500/10 mt-1">
                {message.searchResults.map((res, idx) => (
                  <a
                    key={idx}
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-gray-900/60 hover:bg-gray-800/80 border border-indigo-500/15 text-gray-300 hover:text-white transition-all flex flex-col justify-between group/link"
                  >
                    <div className="font-semibold text-indigo-300 group-hover/link:text-indigo-200 truncate flex items-center justify-between">
                      <span className="truncate">{res.title}</span>
                      <ExternalLink className="w-3 h-3 ml-1 opacity-70 group-hover/link:opacity-100 flex-shrink-0" />
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-1">{res.snippet}</p>
                    <span className="text-[10px] text-indigo-400/80 mt-1 truncate">{res.source || res.url}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Box */}
        <div
          className={`prose-custom max-w-none break-words ${
            isUser
              ? 'inline-block bg-brand-600/90 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-md'
              : 'text-gray-200'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock
                      language={match[1]}
                      value={String(children).replace(/\n$/, '')}
                      {...props}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Message Actions Bar (for Assistant responses) */}
        {!isUser && (
          <div className="flex items-center space-x-1 mt-3 pt-2 text-gray-400 opacity-80 group-hover:opacity-100 transition-opacity text-xs border-t border-gray-800/30">
            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-800 hover:text-gray-200 transition-colors"
              title="Copy response"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Read Aloud Button */}
            <button
              onClick={() => {
                if (isSpeakingThis) {
                  onStopSpeaking();
                } else {
                  onSpeak(message.content);
                }
              }}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md transition-colors ${
                isSpeakingThis
                  ? 'bg-brand-500/20 text-brand-400'
                  : 'hover:bg-gray-800 hover:text-gray-200'
              }`}
              title={isSpeakingThis ? 'Stop speaking' : 'Read aloud'}
            >
              {isSpeakingThis ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                  <span>Stop</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Speak</span>
                </>
              )}
            </button>

            {/* Retry Button */}
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-800 hover:text-gray-200 transition-colors"
                title="Regenerate response"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
