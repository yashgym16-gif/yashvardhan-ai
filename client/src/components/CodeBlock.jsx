import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

export function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanLang = (language || 'text').replace(/^[a-zA-Z0-9_-]+:/, '');

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-gray-700/60 dark:border-gray-800 bg-[#0d1117] shadow-xl text-sm font-mono">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800/80 text-xs text-gray-400">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-brand-400" />
          <span className="font-semibold text-gray-300 uppercase tracking-wider">{cleanLang}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-gray-800/60 hover:bg-gray-750 text-gray-300 hover:text-white transition-all text-xs border border-gray-700/50"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-gray-200 leading-relaxed scrollbar-thin">
        <pre className="!bg-transparent !p-0 !m-0">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}
