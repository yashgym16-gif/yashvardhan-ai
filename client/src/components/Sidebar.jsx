import React, { useState } from 'react';
import {
  MessageSquarePlus,
  Search,
  Pin,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Brain,
  Sun,
  Moon,
  Bot,
  PanelLeftClose,
  Sparkles,
  Layers
} from 'lucide-react';

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onUpdateConversation,
  onDeleteConversation,
  onOpenSettings,
  onOpenMemories,
  theme,
  onToggleTheme,
  isOpen,
  onClose,
  memoryCount = 0,
  activeProvider = 'gemini'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Group conversations by time
  const filtered = conversations.filter((c) =>
    (c.title || 'New Conversation').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const lastWeek = today - 7 * 86400000;

  const groups = {
    Pinned: filtered.filter((c) => c.isPinned),
    Today: filtered.filter((c) => !c.isPinned && new Date(c.updatedAt).getTime() >= today),
    Yesterday: filtered.filter(
      (c) => !c.isPinned && new Date(c.updatedAt).getTime() >= yesterday && new Date(c.updatedAt).getTime() < today
    ),
    'Previous 7 Days': filtered.filter(
      (c) => !c.isPinned && new Date(c.updatedAt).getTime() >= lastWeek && new Date(c.updatedAt).getTime() < yesterday
    ),
    Older: filtered.filter((c) => !c.isPinned && new Date(c.updatedAt).getTime() < lastWeek)
  };

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = (id, e) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onUpdateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const handleTogglePin = (conv, e) => {
    e.stopPropagation();
    onUpdateConversation(conv.id, { isPinned: !conv.isPinned });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 flex flex-col bg-gray-950/95 dark:bg-[#0d121f] border-r border-gray-800/60 dark:border-dark-border/60 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* App Header & Branding */}
        <div className="p-4 flex items-center justify-between border-b border-gray-800/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg ring-2 ring-brand-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold bg-gradient-to-r from-white via-gray-100 to-brand-300 bg-clip-text text-transparent">
                Yashvardhan AI
              </h1>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
                  {activeProvider} Mode
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md transition-all group"
          >
            <MessageSquarePlus className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Search Chats */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-900/60 dark:bg-dark-surface/80 rounded-lg text-xs text-gray-200 placeholder-gray-500 border border-gray-800 focus:outline-none focus:border-brand-500/60"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin">
          {Object.entries(groups).map(([groupTitle, items]) => {
            if (items.length === 0) return null;

            return (
              <div key={groupTitle} className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  {groupTitle}
                </div>
                {items.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const isEditing = editingId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={`group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                        isActive
                          ? 'bg-brand-600/20 text-brand-300 font-medium border border-brand-500/30'
                          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center space-x-1 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 px-1.5 py-0.5 bg-gray-900 rounded text-xs text-white border border-brand-500 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(conv.id, e);
                              if (e.key === 'Escape') handleCancelRename(e);
                            }}
                          />
                          <button
                            onClick={(e) => handleSaveRename(conv.id, e)}
                            className="p-1 text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelRename}
                            className="p-1 text-gray-400 hover:text-gray-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2 truncate pr-2">
                            {conv.isPinned ? (
                              <Pin className="w-3 h-3 text-brand-400 fill-brand-400 flex-shrink-0" />
                            ) : null}
                            <span className="truncate">{conv.title || 'New Conversation'}</span>
                          </div>

                          {/* Action icons on hover or active */}
                          <div className="hidden group-hover:flex items-center space-x-1 flex-shrink-0">
                            <button
                              onClick={(e) => handleTogglePin(conv, e)}
                              className="p-1 hover:text-white transition-colors"
                              title={conv.isPinned ? 'Unpin' : 'Pin'}
                            >
                              <Pin
                                className={`w-3 h-3 ${
                                  conv.isPinned ? 'text-brand-400 fill-brand-400' : 'text-gray-400'
                                }`}
                              />
                            </button>
                            <button
                              onClick={(e) => handleStartRename(conv, e)}
                              className="p-1 hover:text-white text-gray-400 transition-colors"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv.id);
                              }}
                              className="p-1 hover:text-rose-400 text-gray-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-xs">
              No conversations found
            </div>
          )}
        </div>

        {/* Bottom Configuration & Modals Trigger */}
        <div className="p-3 border-t border-gray-800/60 space-y-1">
          {/* User Memory Trigger */}
          <button
            onClick={onOpenMemories}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-gray-800/60 hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>User Memories</span>
            </div>
            {memoryCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-semibold">
                {memoryCount}
              </span>
            )}
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-gray-800/60 hover:text-white transition-colors"
          >
            <div className="flex items-center space-x-2.5">
              <Settings className="w-4 h-4 text-brand-400" />
              <span>Assistant Settings</span>
            </div>
          </button>

          {/* Theme Switcher */}
          <div className="pt-2 flex items-center justify-between px-3 text-xs text-gray-400">
            <span>Appearance</span>
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
              <span className="text-[11px] capitalize">{theme}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
