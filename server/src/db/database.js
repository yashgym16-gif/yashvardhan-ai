import '../config/env.js';
import { getGeminiApiKey } from '../config/env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database Schema
const initialData = {
  conversations: [],
  messages: [],
  memories: [
    {
      id: 'mem_1',
      category: 'identity',
      key: 'Assistant Identity',
      value: 'Yashvardhan AI - An intelligent, helpful, and creative personal assistant.',
      createdAt: new Date().toISOString()
    },
    {
      id: 'mem_2',
      category: 'preference',
      key: 'Code Style',
      value: 'Prefers clean, modern, well-documented and modular code patterns.',
      createdAt: new Date().toISOString()
    }
  ],
  settings: {
    persona: 'Yashvardhan AI',
    customInstructions: 'You are Yashvardhan AI, a world-class personal AI assistant. You are knowledgeable, concise, kind, and exceptionally skilled at coding, creative thinking, reasoning, and problem-solving. Always format code in markdown blocks with proper language identifiers.',
    provider: 'gemini', // 'gemini' | 'openai' | 'anthropic' | 'groq'
    model: 'gemini-3.6-flash',
    temperature: 0.7,
    maxTokens: 2048,
    webSearchEnabled: false,
    autoMemory: true,
    theme: 'dark',
    voicePitch: 1.0,
    voiceRate: 1.0,
    voiceName: '',
    apiKeys: {
      gemini: '',
      openai: '',
      anthropic: '',
      groq: ''
    }
  }
};

class Database {
  constructor() {
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Merge in any missing defaults
        this.data.settings = { ...initialData.settings, ...this.data.settings };
        this.data.settings.apiKeys = { ...initialData.settings.apiKeys, ...(this.data.settings.apiKeys || {}) };
        if (!this.data.conversations) this.data.conversations = [];
        if (!this.data.messages) this.data.messages = [];
        if (!this.data.memories) this.data.memories = [...initialData.memories];
      } else {
        this.data = JSON.parse(JSON.stringify(initialData));
        this.save();
      }
    } catch (err) {
      console.error('Error loading database, resetting to default structure:', err);
      this.data = JSON.parse(JSON.stringify(initialData));
      this.save();
    }
  }

  save() {
    try {
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  // --- Conversations ---
  getConversations() {
    return [...this.data.conversations].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getConversation(id) {
    return this.data.conversations.find((c) => c.id === id) || null;
  }

  createConversation(title = 'New Conversation') {
    const id = `conv_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const newConv = {
      id,
      title,
      isPinned: false,
      createdAt: now,
      updatedAt: now
    };
    this.data.conversations.unshift(newConv);
    this.save();
    return newConv;
  }

  updateConversation(id, updates) {
    const index = this.data.conversations.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.conversations[index] = {
      ...this.data.conversations[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.conversations[index];
  }

  deleteConversation(id) {
    this.data.conversations = this.data.conversations.filter((c) => c.id !== id);
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);
    this.save();
    return true;
  }

  clearAllConversations() {
    this.data.conversations = [];
    this.data.messages = [];
    this.save();
    return true;
  }

  // --- Messages ---
  getMessages(conversationId) {
    return this.data.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  addMessage({ conversationId, role, content, attachments = [], searchResults = null, tokens = 0 }) {
    const id = `msg_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const message = {
      id,
      conversationId,
      role, // 'user' | 'assistant' | 'system'
      content,
      attachments,
      searchResults,
      tokens,
      createdAt: now
    };
    this.data.messages.push(message);

    // Update conversation timestamp and title if first message
    const conv = this.getConversation(conversationId);
    if (conv) {
      const convMessages = this.getMessages(conversationId);
      const updates = { updatedAt: now };
      if (convMessages.length === 1 && role === 'user' && conv.title === 'New Conversation') {
        updates.title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
      }
      this.updateConversation(conversationId, updates);
    }

    this.save();
    return message;
  }

  deleteMessage(id) {
    this.data.messages = this.data.messages.filter((m) => m.id !== id);
    this.save();
    return true;
  }

  // --- Memories ---
  getMemories() {
    return [...this.data.memories].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  addMemory({ category = 'general', key, value }) {
    const id = `mem_${crypto.randomUUID()}`;
    const memory = {
      id,
      category,
      key,
      value,
      createdAt: new Date().toISOString()
    };
    this.data.memories.unshift(memory);
    this.save();
    return memory;
  }

  deleteMemory(id) {
    this.data.memories = this.data.memories.filter((m) => m.id !== id);
    this.save();
    return true;
  }

  clearMemories() {
    this.data.memories = [];
    this.save();
    return true;
  }

  // --- Settings & Masked API Keys ---
  getSettings() {
    const { apiKeys, ...rest } = this.data.settings;
    const geminiEnvKey = getGeminiApiKey();

    // Mask keys before returning to frontend so secrets are never exposed
    const maskedKeys = {
      gemini: geminiEnvKey
        ? `${geminiEnvKey.slice(0, 4)}...${geminiEnvKey.slice(-4)}`
        : apiKeys.gemini
        ? `${apiKeys.gemini.slice(0, 4)}...${apiKeys.gemini.slice(-4)}`
        : '',
      openai: apiKeys.openai ? `${apiKeys.openai.slice(0, 3)}...${apiKeys.openai.slice(-4)}` : '',
      anthropic: apiKeys.anthropic ? `${apiKeys.anthropic.slice(0, 7)}...${apiKeys.anthropic.slice(-4)}` : '',
      groq: apiKeys.groq ? `${apiKeys.groq.slice(0, 4)}...${apiKeys.groq.slice(-4)}` : ''
    };
    const keyConfigured = {
      gemini: Boolean(geminiEnvKey || apiKeys.gemini),
      openai: Boolean(apiKeys.openai || (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('your_'))),
      anthropic: Boolean(apiKeys.anthropic || (process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.startsWith('your_'))),
      groq: Boolean(apiKeys.groq || (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.startsWith('your_')))
    };
    return {
      ...rest,
      maskedKeys,
      keyConfigured
    };
  }

  getRawApiKey(provider = 'gemini') {
    if (provider === 'gemini') {
      const geminiEnvKey = getGeminiApiKey();
      if (geminiEnvKey) return geminiEnvKey;
    }
    const provUpper = (provider || 'gemini').toUpperCase();
    const envKey = process.env[`${provUpper}_API_KEY`];
    if (envKey && envKey !== 'your_api_key_here' && !envKey.startsWith('your_')) {
      return envKey.trim();
    }
    return this.data.settings.apiKeys?.[provider] || '';
  }

  updateSettings(newSettings) {
    const { apiKeys, ...otherSettings } = newSettings;
    this.data.settings = {
      ...this.data.settings,
      ...otherSettings
    };

    if (apiKeys) {
      this.data.settings.apiKeys = {
        ...this.data.settings.apiKeys
      };
      for (const [provider, key] of Object.entries(apiKeys)) {
        // Only update if not empty string and not masked string (containing '...')
        if (key && !key.includes('...')) {
          this.data.settings.apiKeys[provider] = key.trim();
        } else if (key === '') {
          this.data.settings.apiKeys[provider] = '';
        }
      }
    }

    this.save();
    return this.getSettings();
  }
}

export const db = new Database();
