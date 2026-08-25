const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}

export const api = {
  // Health
  checkHealth: () => request('/health'),

  // Conversations
  getConversations: () => request('/conversations'),
  createConversation: (title) =>
    request('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title })
    }),
  getConversation: (id) => request(`/conversations/${id}`),
  updateConversation: (id, updates) =>
    request(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),
  deleteConversation: (id) =>
    request(`/conversations/${id}`, {
      method: 'DELETE'
    }),
  clearAllConversations: () =>
    request('/conversations/clear', {
      method: 'POST'
    }),

  // Chat
  sendMessage: ({ conversationId, content, attachments = [], useWebSearch = false }) =>
    request('/chat', {
      method: 'POST',
      body: JSON.stringify({ conversationId, content, attachments, useWebSearch })
    }),

  // File Upload
  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    return data.file;
  },

  // Memories
  getMemories: () => request('/memories'),
  addMemory: ({ category, key, value }) =>
    request('/memories', {
      method: 'POST',
      body: JSON.stringify({ category, key, value })
    }),
  deleteMemory: (id) =>
    request(`/memories/${id}`, {
      method: 'DELETE'
    }),
  clearMemories: () =>
    request('/memories/clear', {
      method: 'POST'
    }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings) =>
    request('/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    }),

  // Web Search
  searchWeb: (query) =>
    request('/search', {
      method: 'POST',
      body: JSON.stringify({ query })
    })
};
