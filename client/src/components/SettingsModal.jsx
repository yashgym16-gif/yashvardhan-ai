import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Sliders,
  Cpu,
  ShieldCheck,
  Check,
  Eye,
  EyeOff,
  Volume2,
  Sparkles,
  Search,
  Brain
} from 'lucide-react';

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  voices = []
}) {
  const [formData, setFormData] = useState({
    persona: 'Yashvardhan AI',
    customInstructions: '',
    provider: 'gemini',
    model: 'gemini-1.5-flash',
    temperature: 0.7,
    maxTokens: 2048,
    webSearchEnabled: false,
    autoMemory: true,
    voiceRate: 1.0,
    voicePitch: 1.0,
    voiceName: '',
    autoSpeak: false,
    apiKeys: {
      gemini: '',
      openai: '',
      anthropic: '',
      groq: ''
    }
  });

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'models' | 'security' | 'voice'
  const [showKeys, setShowKeys] = useState({});
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        persona: settings.persona || 'Yashvardhan AI',
        customInstructions: settings.customInstructions || '',
        provider: settings.provider || 'gemini',
        model: settings.model || 'gemini-1.5-flash',
        temperature: settings.temperature ?? 0.7,
        maxTokens: settings.maxTokens || 2048,
        webSearchEnabled: Boolean(settings.webSearchEnabled),
        autoMemory: settings.autoMemory ?? true,
        voiceRate: settings.voiceRate || 1.0,
        voicePitch: settings.voicePitch || 1.0,
        voiceName: settings.voiceName || '',
        autoSpeak: Boolean(settings.autoSpeak),
        apiKeys: {
          gemini: '',
          openai: '',
          anthropic: '',
          groq: ''
        }
      });
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const providerModels = {
    gemini: [
      { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Fast & State-of-the-Art)' },
      { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash (High Reasoning)' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Deep Intelligence)' },
      { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' }
    ],
    openai: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Efficient)' },
      { id: 'gpt-4o', name: 'GPT-4o (Omni High Intelligence)' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
    ],
    anthropic: [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Superior Coding)' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Ultra Fast)' }
    ],
    groq: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (High Speed Open Source)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Long Context)' }
    ],
    builtin: [
      { id: 'yashvardhan-builtin-core', name: 'Yashvardhan AI Built-in Core (Zero-Key Fallback)' }
    ]
  };

  const handleProviderChange = (e) => {
    const prov = e.target.value;
    const defaultModel = providerModels[prov]?.[0]?.id || 'gemini-1.5-flash';
    setFormData((prev) => ({ ...prev, provider: prov, model: defaultModel }));
  };

  const toggleKeyVisibility = (keyName) => {
    setShowKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0f1422] border border-gray-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100">Assistant Settings</h2>
              <p className="text-xs text-gray-400">Configure AI models, personas, security, and voice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 pt-3 border-b border-gray-800/60 bg-gray-900/20 space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Persona & General</span>
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'models'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>AI Model & Parameters</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>API Keys (Secure)</span>
          </button>
          <button
            onClick={() => setActiveTab('voice')}
            className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'voice'
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice & Audio</span>
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin text-xs">
          {/* TAB 1: General & Persona */}
          {activeTab === 'general' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Assistant Name / Persona
                </label>
                <input
                  type="text"
                  value={formData.persona}
                  onChange={(e) => setFormData({ ...formData, persona: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900/80 rounded-xl border border-gray-800 text-gray-100 focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Yashvardhan AI"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Custom System Instructions
                </label>
                <textarea
                  rows={4}
                  value={formData.customInstructions}
                  onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900/80 rounded-xl border border-gray-800 text-gray-100 focus:outline-none focus:border-brand-500 resize-none"
                  placeholder="Define the behavior, tone, constraints, and expertise of the assistant..."
                />
              </div>

              <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-semibold text-gray-200">Default Web Search</div>
                      <div className="text-[10px] text-gray-500">Auto-search for fresh queries</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.webSearchEnabled}
                    onChange={(e) => setFormData({ ...formData, webSearchEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-gray-900 border-gray-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-900/40 border border-gray-800">
                  <div className="flex items-center space-x-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-semibold text-gray-200">Auto-Learn Memory</div>
                      <div className="text-[10px] text-gray-500">Remember facts & preferences</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.autoMemory}
                    onChange={(e) => setFormData({ ...formData, autoMemory: e.target.checked })}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 bg-gray-900 border-gray-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AI Models & Parameters */}
          {activeTab === 'models' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    AI Provider
                  </label>
                  <select
                    value={formData.provider}
                    onChange={handleProviderChange}
                    className="w-full px-3 py-2 bg-gray-900 rounded-xl border border-gray-800 text-gray-100 focus:outline-none focus:border-brand-500"
                  >
                    <option value="gemini">Google Gemini (Recommended)</option>
                    <option value="openai">OpenAI (GPT-4o)</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="groq">Groq (Llama 3.3)</option>
                    <option value="builtin">Yashvardhan Built-in Core</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Model Selection
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 rounded-xl border border-gray-800 text-gray-100 focus:outline-none focus:border-brand-500"
                  >
                    {(providerModels[formData.provider] || []).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Temperature Slider */}
              <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-200">Temperature (Creativity)</span>
                  <span className="text-brand-400 font-mono">{formData.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Precise & Factual (0.0)</span>
                  <span>Creative & Expressive (1.0)</span>
                </div>
              </div>

              {/* Max Tokens Slider */}
              <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-200">Max Tokens (Output Length)</span>
                  <span className="text-brand-400 font-mono">{formData.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="8192"
                  step="256"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>512 tokens</span>
                  <span>8,192 tokens</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: API Keys (Secure) */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex items-start space-x-3 text-xs text-indigo-300">
                <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Zero Frontend Secret Exposure</p>
                  <p className="text-gray-400 text-[11px] mt-0.5 leading-relaxed">
                    API keys are stored securely on the server or loaded via `.env`. They are never sent to or visible in client JavaScript code.
                  </p>
                </div>
              </div>

              {/* Gemini Key */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-300">Google Gemini API Key</label>
                  {settings?.keyConfigured?.gemini && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configured ({settings.maskedKeys?.gemini})
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={formData.apiKeys.gemini}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiKeys: { ...formData.apiKeys, gemini: e.target.value }
                      })
                    }
                    placeholder={settings?.keyConfigured?.gemini ? 'Enter new key to replace' : 'AIzaSy...'}
                    className="w-full px-3 py-2 bg-gray-900/80 rounded-xl border border-gray-800 text-gray-100 pr-10 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('gemini')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showKeys.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* OpenAI Key */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-300">OpenAI API Key</label>
                  {settings?.keyConfigured?.openai && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configured ({settings.maskedKeys?.openai})
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showKeys.openai ? 'text' : 'password'}
                    value={formData.apiKeys.openai}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiKeys: { ...formData.apiKeys, openai: e.target.value }
                      })
                    }
                    placeholder={settings?.keyConfigured?.openai ? 'Enter new key to replace' : 'sk-...'}
                    className="w-full px-3 py-2 bg-gray-900/80 rounded-xl border border-gray-800 text-gray-100 pr-10 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('openai')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Anthropic Key */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-gray-300">Anthropic Claude API Key</label>
                  {settings?.keyConfigured?.anthropic && (
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Configured ({settings.maskedKeys?.anthropic})
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showKeys.anthropic ? 'text' : 'password'}
                    value={formData.apiKeys.anthropic}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apiKeys: { ...formData.apiKeys, anthropic: e.target.value }
                      })
                    }
                    placeholder={settings?.keyConfigured?.anthropic ? 'Enter new key to replace' : 'sk-ant-...'}
                    className="w-full px-3 py-2 bg-gray-900/80 rounded-xl border border-gray-800 text-gray-100 pr-10 focus:outline-none focus:border-brand-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => toggleKeyVisibility('anthropic')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Voice & Audio */}
          {activeTab === 'voice' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                  Synthesizer Voice
                </label>
                <select
                  value={formData.voiceName}
                  onChange={(e) => setFormData({ ...formData, voiceName: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-900 rounded-xl border border-gray-800 text-gray-100 focus:outline-none focus:border-brand-500"
                >
                  <option value="">System Default Natural Voice</option>
                  {voices.map((v, i) => (
                    <option key={i} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Speech Rate */}
                <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-200">Speech Rate</span>
                    <span className="text-brand-400 font-mono">{formData.voiceRate}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={formData.voiceRate}
                    onChange={(e) => setFormData({ ...formData, voiceRate: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>

                {/* Speech Pitch */}
                <div className="p-3 rounded-xl bg-gray-900/40 border border-gray-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-200">Speech Pitch</span>
                    <span className="text-brand-400 font-mono">{formData.voicePitch}</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={formData.voicePitch}
                    onChange={(e) => setFormData({ ...formData, voicePitch: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-gray-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
