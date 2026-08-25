import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { MemoryModal } from './components/MemoryModal';
import { api } from './services/api';
import { useSpeech } from './hooks/useSpeech';

export default function App() {
  // Application State
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [memories, setMemories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [speakingContent, setSpeakingContent] = useState(null);

  // Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);

  // Speech Hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSpeaking,
    speak,
    stopSpeaking,
    voices
  } = useSpeech();

  const abortControllerRef = useRef(null);

  // Apply Theme to Document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Initial Load: Settings, Memories, Conversations
  useEffect(() => {
    async function init() {
      try {
        const [settingsRes, memoriesRes, convsRes] = await Promise.all([
          api.getSettings(),
          api.getMemories(),
          api.getConversations()
        ]);

        if (settingsRes.success && settingsRes.settings) {
          setSettings(settingsRes.settings);
          if (settingsRes.settings.theme) {
            setTheme(settingsRes.settings.theme);
          }
          if (settingsRes.settings.webSearchEnabled !== undefined) {
            setUseWebSearch(settingsRes.settings.webSearchEnabled);
          }
        }

        if (memoriesRes.success && memoriesRes.memories) {
          setMemories(memoriesRes.memories);
        }

        if (convsRes.success && convsRes.conversations) {
          setConversations(convsRes.conversations);
          if (convsRes.conversations.length > 0) {
            setActiveConversationId(convsRes.conversations[0].id);
          }
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Fetch Messages when Active Conversation Changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    async function loadMessages() {
      try {
        const res = await api.getConversation(activeConversationId);
        if (res.success) {
          setMessages(res.messages || []);
        }
      } catch (err) {
        console.error('Error loading messages for conversation:', err);
      }
    }

    loadMessages();
  }, [activeConversationId]);

  // Handle New Chat
  const handleNewChat = useCallback(async () => {
    try {
      const res = await api.createConversation('New Conversation');
      if (res.success && res.conversation) {
        setConversations((prev) => [res.conversation, ...prev]);
        setActiveConversationId(res.conversation.id);
        setMessages([]);
        setAttachments([]);
      }
    } catch (err) {
      console.error('Error creating new conversation:', err);
    }
  }, []);

  // Handle Update Conversation (Rename / Pin)
  const handleUpdateConversation = useCallback(async (id, updates) => {
    try {
      const res = await api.updateConversation(id, updates);
      if (res.success && res.conversation) {
        setConversations((prev) =>
          prev.map((c) => (c.id === id ? res.conversation : c))
        );
      }
    } catch (err) {
      console.error('Error updating conversation:', err);
    }
  }, []);

  // Handle Delete Conversation
  const handleDeleteConversation = useCallback(
    async (id) => {
      try {
        await api.deleteConversation(id);
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          const remaining = conversations.filter((c) => c.id !== id);
          if (remaining.length > 0) {
            setActiveConversationId(remaining[0].id);
          } else {
            setActiveConversationId(null);
            setMessages([]);
          }
        }
      } catch (err) {
        console.error('Error deleting conversation:', err);
      }
    },
    [activeConversationId, conversations]
  );

  // File Upload Handler
  const handleAddAttachment = useCallback(async (file) => {
    try {
      const uploaded = await api.uploadFile(file);
      setAttachments((prev) => [...prev, uploaded]);
    } catch (err) {
      console.error('File upload error:', err);
      alert(`File upload failed: ${err.message}`);
    }
  }, []);

  const handleRemoveAttachment = useCallback((idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Send Message Handler
  const handleSendMessage = useCallback(
    async ({ content, attachments: currentAttachments = [], useWebSearch: searchFlag }) => {
      if (isLoading) return;
      if (!content && (!currentAttachments || currentAttachments.length === 0)) return;

      setIsLoading(true);

      // Optimistically add user message to UI
      const tempUserMsg = {
        id: `temp_${Date.now()}`,
        role: 'user',
        content,
        attachments: currentAttachments,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, tempUserMsg]);
      setAttachments([]);

      try {
        const response = await api.sendMessage({
          conversationId: activeConversationId,
          content,
          attachments: currentAttachments,
          useWebSearch: searchFlag
        });

        if (response.success) {
          // If a new conversation was created on backend
          if (!activeConversationId || activeConversationId !== response.conversationId) {
            setActiveConversationId(response.conversationId);
            // Refresh conversation list
            const convsRes = await api.getConversations();
            if (convsRes.success) setConversations(convsRes.conversations);
          }

          // Replace temp message with server message and append assistant message
          setMessages((prev) => [
            ...prev.filter((m) => m.id !== tempUserMsg.id),
            response.userMessage,
            response.assistantMessage
          ]);

          // Refresh memory list if auto-memory was active
          const memsRes = await api.getMemories();
          if (memsRes.success) setMemories(memsRes.memories);

          // Auto-speak if enabled in settings
          if (settings?.autoSpeak && response.assistantMessage?.content) {
            speak(response.assistantMessage.content, {
              voiceRate: settings.voiceRate || 1.0,
              voicePitch: settings.voicePitch || 1.0,
              voiceName: settings.voiceName || ''
            });
            setSpeakingContent(response.assistantMessage.content);
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
        // Append error assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: 'assistant',
            content: `⚠️ **Error generating response:** ${err.message || 'Something went wrong. Please check your backend connection or API key in settings.'}`,
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [activeConversationId, isLoading, settings, speak]
  );

  // Retry / Regenerate
  const handleRetryMessage = useCallback(
    (message) => {
      // Find the user message before this assistant message
      const msgIndex = messages.findIndex((m) => m.id === message.id);
      if (msgIndex > 0) {
        const prevUserMsg = messages[msgIndex - 1];
        if (prevUserMsg && prevUserMsg.role === 'user') {
          handleSendMessage({
            content: prevUserMsg.content,
            attachments: prevUserMsg.attachments || [],
            useWebSearch
          });
        }
      }
    },
    [messages, handleSendMessage, useWebSearch]
  );

  // Stop Generation
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  }, []);

  // Speak Content
  const handleSpeak = useCallback(
    (text, originalContent) => {
      speak(text, {
        voiceRate: settings?.voiceRate || 1.0,
        voicePitch: settings?.voicePitch || 1.0,
        voiceName: settings?.voiceName || ''
      });
      setSpeakingContent(originalContent);
    },
    [speak, settings]
  );

  const handleStopSpeaking = useCallback(() => {
    stopSpeaking();
    setSpeakingContent(null);
  }, [stopSpeaking]);

  // Memory Handlers
  const handleAddMemory = useCallback(async ({ category, key, value }) => {
    try {
      const res = await api.addMemory({ category, key, value });
      if (res.success && res.memory) {
        setMemories((prev) => [res.memory, ...prev]);
      }
    } catch (err) {
      console.error('Error adding memory:', err);
    }
  }, []);

  const handleDeleteMemory = useCallback(async (id) => {
    try {
      await api.deleteMemory(id);
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error('Error deleting memory:', err);
    }
  }, []);

  const handleClearMemories = useCallback(async () => {
    try {
      await api.clearMemories();
      setMemories([]);
    } catch (err) {
      console.error('Error clearing memories:', err);
    }
  }, []);

  // Save Settings Handler
  const handleSaveSettings = useCallback(async (newSettings) => {
    try {
      const res = await api.updateSettings(newSettings);
      if (res.success && res.settings) {
        setSettings(res.settings);
        if (newSettings.theme) setTheme(newSettings.theme);
        if (newSettings.webSearchEnabled !== undefined) {
          setUseWebSearch(newSettings.webSearchEnabled);
        }
      }
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }, []);

  // Toggle Theme
  const handleToggleTheme = useCallback(() => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (settings) {
      handleSaveSettings({ ...settings, theme: nextTheme });
    }
  }, [theme, settings, handleSaveSettings]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0B0F19] text-gray-100 font-sans">
      {/* Conversation Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onNewChat={handleNewChat}
        onUpdateConversation={handleUpdateConversation}
        onDeleteConversation={handleDeleteConversation}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenMemories={() => setIsMemoryOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        memoryCount={memories.length}
        activeProvider={settings?.provider || 'gemini'}
      />

      {/* Main Chat Area */}
      <ChatArea
        conversation={activeConversation}
        messages={messages}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        onStopGeneration={handleStopGeneration}
        onRetryMessage={handleRetryMessage}
        useWebSearch={useWebSearch}
        setUseWebSearch={setUseWebSearch}
        attachments={attachments}
        onAddAttachment={handleAddAttachment}
        onRemoveAttachment={handleRemoveAttachment}
        isListening={isListening}
        onStartVoice={() => startListening()}
        onStopVoice={stopListening}
        speechTranscript={transcript}
        onSpeak={handleSpeak}
        speakingContent={speakingContent}
        onStopSpeaking={handleStopSpeaking}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        voices={voices}
      />

      {/* Memory Manager Modal */}
      <MemoryModal
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
        memories={memories}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onClearMemories={handleClearMemories}
      />
    </div>
  );
}
