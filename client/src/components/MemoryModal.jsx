import React, { useState } from 'react';
import {
  X,
  Brain,
  Plus,
  Trash2,
  Search,
  Sparkles,
  Tag,
  Clock
} from 'lucide-react';

export function MemoryModal({
  isOpen,
  onClose,
  memories = [],
  onAddMemory,
  onDeleteMemory,
  onClearMemories
}) {
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategory, setNewCategory] = useState('preference');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  if (!isOpen) return null;

  const filteredMemories = memories.filter(
    (m) =>
      (m.key || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.value || '').toLowerCase().includes(search.toLowerCase()) ||
      (m.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) return;
    onAddMemory({
      category: newCategory,
      key: newKey.trim(),
      value: newValue.trim()
    });
    setNewKey('');
    setNewValue('');
    setShowAddForm(false);
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'preference':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'profile':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'identity':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f1422] border border-gray-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">User Memory Store</h2>
              <p className="text-xs text-gray-400">
                Persistent facts and preferences remembered by Yashvardhan AI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar (Search & Add) */}
        <div className="px-6 py-3 border-b border-gray-800/60 flex items-center justify-between gap-3 bg-gray-900/20">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-900/80 rounded-lg text-xs text-gray-200 placeholder-gray-500 border border-gray-800 focus:outline-none focus:border-purple-500"
            />
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddForm ? 'Cancel' : 'Add Memory'}</span>
          </button>
        </div>

        {/* Add Memory Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="p-4 bg-gray-900/60 border-b border-gray-800/80 space-y-3 animate-fade-in text-xs"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 mb-1">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-gray-900 rounded-lg border border-gray-800 text-gray-200"
                >
                  <option value="preference">Preference</option>
                  <option value="profile">Profile / Name</option>
                  <option value="project">Project Context</option>
                  <option value="general">General Fact</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 mb-1">Key / Topic</label>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="e.g. Favorite Coding Language"
                  className="w-full px-2.5 py-1.5 bg-gray-900 rounded-lg border border-gray-800 text-gray-200"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Value / Fact</label>
              <textarea
                rows={2}
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="e.g. TypeScript and React with Tailwind CSS"
                className="w-full px-2.5 py-1.5 bg-gray-900 rounded-lg border border-gray-800 text-gray-200 resize-none"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs shadow"
              >
                Save Memory
              </button>
            </div>
          </form>
        )}

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-thin text-xs">
          {filteredMemories.map((m) => (
            <div
              key={m.id}
              className="p-3.5 rounded-xl bg-gray-900/40 border border-gray-800/80 hover:border-gray-700 transition-all flex items-start justify-between gap-3 group"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryColor(
                      m.category
                    )}`}
                  >
                    {m.category.toUpperCase()}
                  </span>
                  <span className="font-semibold text-gray-200">{m.key}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{m.value}</p>
                {m.createdAt && (
                  <div className="text-[10px] text-gray-500 flex items-center gap-1 pt-1">
                    <Clock className="w-3 h-3" />
                    <span>Added {new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => onDeleteMemory(m.id)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-gray-800 transition-colors opacity-60 group-hover:opacity-100"
                title="Delete memory"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {filteredMemories.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Brain className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="font-medium text-gray-400">No memories found</p>
              <p className="text-[11px] text-gray-600 mt-1">
                Yashvardhan AI will automatically learn facts from your chats, or you can add them manually.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {memories.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-800/80 flex items-center justify-between text-xs bg-gray-900/40">
            <span className="text-gray-500">{memories.length} total saved facts</span>
            <button
              onClick={onClearMemories}
              className="text-rose-400 hover:text-rose-300 font-medium hover:underline text-xs"
            >
              Clear All Memories
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
