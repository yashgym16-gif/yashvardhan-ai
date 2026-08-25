import express from 'express';
import { db } from '../db/database.js';
import { generateChatResponse } from '../services/aiService.js';
import { performWebSearch } from '../services/searchService.js';
import { uploadMiddleware, processUploadedFile } from '../services/fileService.js';
import { getMemories, addMemory, deleteMemory, clearMemories, autoLearnFromMessage } from '../services/memoryService.js';

const router = express.Router();

// --- Health Check ---
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Yashvardhan AI Backend',
    timestamp: new Date().toISOString()
  });
});

// --- Conversations ---
router.get('/conversations', (req, res) => {
  const conversations = db.getConversations();
  res.json({ success: true, conversations });
});

router.post('/conversations', (req, res) => {
  const { title } = req.body;
  const conversation = db.createConversation(title || 'New Conversation');
  res.json({ success: true, conversation });
});

router.get('/conversations/:id', (req, res) => {
  const conversation = db.getConversation(req.params.id);
  if (!conversation) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }
  const messages = db.getMessages(req.params.id);
  res.json({ success: true, conversation, messages });
});

router.patch('/conversations/:id', (req, res) => {
  const updated = db.updateConversation(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Conversation not found' });
  }
  res.json({ success: true, conversation: updated });
});

router.delete('/conversations/:id', (req, res) => {
  db.deleteConversation(req.params.id);
  res.json({ success: true, message: 'Conversation deleted' });
});

router.post('/conversations/clear', (req, res) => {
  db.clearAllConversations();
  res.json({ success: true, message: 'All conversations cleared' });
});

// --- Chat Completion Endpoint ---
router.post('/chat', async (req, res) => {
  try {
    let { conversationId, content, attachments = [], useWebSearch = false } = req.body;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ success: false, error: 'Message content or attachment required' });
    }

    // If no conversationId provided, create a new conversation session
    if (!conversationId) {
      const newConv = db.createConversation(content ? content.slice(0, 30) : 'File Conversation');
      conversationId = newConv.id;
    }

    // Auto-extract memory from user message if setting enabled
    const settings = db.getSettings();
    if (settings.autoMemory && content) {
      autoLearnFromMessage(content);
    }

    // Execute web search if enabled
    let searchResults = [];
    if (useWebSearch || settings.webSearchEnabled) {
      try {
        searchResults = await performWebSearch(content);
      } catch (err) {
        console.warn('Search query error:', err.message);
      }
    }

    // Save user message to database
    const userMsg = db.addMessage({
      conversationId,
      role: 'user',
      content,
      attachments,
      searchResults: searchResults.length > 0 ? searchResults : null
    });

    // Get conversation history for multi-turn context
    const messages = db.getMessages(conversationId);

    // Call AI Service
    const aiResult = await generateChatResponse({
      conversationId,
      messages,
      userMessage: content,
      attachments,
      searchResults,
      settings
    });

    // Save assistant response to database
    const assistantMsg = db.addMessage({
      conversationId,
      role: 'assistant',
      content: aiResult.content,
      tokens: aiResult.tokens,
      searchResults: searchResults.length > 0 ? searchResults : null
    });

    res.json({
      success: true,
      conversationId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      provider: aiResult.provider,
      model: aiResult.model,
      searchResults
    });
  } catch (err) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// --- File Upload Endpoint ---
router.post('/upload', uploadMiddleware.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const processed = await processUploadedFile(req.file);
    res.json({ success: true, file: processed });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: err.message || 'File processing failed' });
  }
});

// --- Web Search Endpoint ---
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, error: 'Query is required' });
    const results = await performWebSearch(query);
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Memories Management ---
router.get('/memories', (req, res) => {
  const memories = getMemories();
  res.json({ success: true, memories });
});

router.post('/memories', (req, res) => {
  const { category, key, value } = req.body;
  if (!key || !value) {
    return res.status(400).json({ success: false, error: 'Key and Value are required' });
  }
  const memory = addMemory({ category, key, value });
  res.json({ success: true, memory });
});

router.delete('/memories/:id', (req, res) => {
  deleteMemory(req.params.id);
  res.json({ success: true, message: 'Memory deleted' });
});

router.post('/memories/clear', (req, res) => {
  clearMemories();
  res.json({ success: true, message: 'Memories cleared' });
});

// --- Settings Management ---
router.get('/settings', (req, res) => {
  const settings = db.getSettings();
  res.json({ success: true, settings });
});

router.post('/settings', (req, res) => {
  try {
    const updated = db.updateSettings(req.body);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
