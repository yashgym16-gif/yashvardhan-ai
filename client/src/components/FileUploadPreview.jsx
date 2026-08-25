import React from 'react';
import { X, FileText, Image as ImageIcon, FileCode, Paperclip } from 'lucide-react';

export function FileUploadPreview({ attachments, onRemove }) {
  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (file) => {
    if (file.isImage) return <ImageIcon className="w-4 h-4 text-purple-400" />;
    if (file.mimeType?.includes('javascript') || file.originalName?.endsWith('.js') || file.originalName?.endsWith('.jsx') || file.originalName?.endsWith('.py')) {
      return <FileCode className="w-4 h-4 text-emerald-400" />;
    }
    return <FileText className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 mb-2 bg-gray-900/40 dark:bg-dark-surface/60 rounded-xl border border-gray-700/40 backdrop-blur-sm animate-fade-in">
      {attachments.map((file, idx) => (
        <div
          key={file.id || idx}
          className="flex items-center space-x-2 pl-2 pr-1.5 py-1.5 rounded-lg bg-gray-800/80 dark:bg-gray-800/90 border border-gray-700/60 text-xs text-gray-200 group transition-all"
        >
          {file.isImage && file.base64 ? (
            <img
              src={`data:${file.mimeType || 'image/jpeg'};base64,${file.base64}`}
              alt={file.originalName}
              className="w-5 h-5 rounded object-cover"
            />
          ) : (
            getFileIcon(file)
          )}
          <span className="max-w-[140px] truncate font-medium">{file.originalName}</span>
          <span className="text-[10px] text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
          {onRemove && (
            <button
              onClick={() => onRemove(idx)}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-rose-400 transition-colors"
              title="Remove attachment"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
