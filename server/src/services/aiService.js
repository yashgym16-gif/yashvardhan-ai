import '../config/env.js';
import { getGeminiApiKey } from '../config/env.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db/database.js';
import { formatMemoriesForPrompt } from './memoryService.js';
import { formatSearchResultsForPrompt } from './searchService.js';
import { formatAttachmentsForPrompt } from './fileService.js';

/**
 * AI Service Orchestrator for Yashvardhan AI
 * Connects to Google Gemini API using GEMINI_API_KEY from server/.env.
 */

export async function generateChatResponse({
  conversationId,
  messages = [],
  userMessage,
  attachments = [],
  searchResults = [],
  settings = null
}) {
  const currentSettings = settings || db.getSettings();
  const provider = currentSettings.provider || 'gemini';
  
  // Normalize model name (map deprecated 1.5/2.5 models to active 3.6/3.7 flash models)
  let model = currentSettings.model || 'gemini-3.6-flash';
  if (model.includes('1.5') || model.includes('2.5-flash')) {
    model = 'gemini-3.6-flash';
  }
  
  const temperature = currentSettings.temperature !== undefined ? currentSettings.temperature : 0.7;
  const maxTokens = currentSettings.maxTokens || 2048;

  // Build system instructions with custom persona, memories, and web context
  const persona = currentSettings.persona || 'Yashvardhan AI';
  const baseInstructions =
    currentSettings.customInstructions ||
    `You are ${persona}, an exceptionally capable, thoughtful, and articulate personal AI assistant. You provide clear, well-structured, and helpful answers. When presenting code, always use markdown blocks with the correct language tag.`;

  const memoryContext = formatMemoriesForPrompt();
  const searchContext = formatSearchResultsForPrompt(searchResults);
  const attachmentContext = formatAttachmentsForPrompt(attachments);

  const fullSystemPrompt = `${baseInstructions}${memoryContext}${searchContext}`;

  // If Gemini is selected (default)
  if (provider === 'gemini' || !provider) {
    const geminiKey = getGeminiApiKey() || db.getRawApiKey('gemini');

    if (!geminiKey || !geminiKey.trim()) {
      throw new Error(
        'GEMINI_API_KEY is not configured on the server. Please add your GEMINI_API_KEY in server/.env (e.g. GEMINI_API_KEY=AIzaSy...) and restart the backend server.'
      );
    }

    return await generateGeminiResponse({
      apiKey: geminiKey.trim(),
      model,
      systemPrompt: fullSystemPrompt,
      messages,
      userMessage,
      attachments,
      attachmentContext,
      temperature,
      maxTokens
    });
  }

  // Optional OpenAI Provider
  if (provider === 'openai') {
    const openaiKey = db.getRawApiKey('openai');
    if (!openaiKey || !openaiKey.trim()) {
      throw new Error(
        'OPENAI_API_KEY is not configured on the server. Please add OPENAI_API_KEY in server/.env or configure it in settings.'
      );
    }
    return await generateOpenAIResponse({
      apiKey: openaiKey.trim(),
      model,
      systemPrompt: fullSystemPrompt,
      messages,
      userMessage,
      attachmentContext,
      temperature,
      maxTokens
    });
  }

  // Optional Anthropic Provider
  if (provider === 'anthropic') {
    const anthropicKey = db.getRawApiKey('anthropic');
    if (!anthropicKey || !anthropicKey.trim()) {
      throw new Error(
        'ANTHROPIC_API_KEY is not configured on the server. Please add ANTHROPIC_API_KEY in server/.env or configure it in settings.'
      );
    }
    return await generateAnthropicResponse({
      apiKey: anthropicKey.trim(),
      model,
      systemPrompt: fullSystemPrompt,
      messages,
      userMessage,
      attachmentContext,
      temperature,
      maxTokens
    });
  }

  // Optional Groq Provider
  if (provider === 'groq') {
    const groqKey = db.getRawApiKey('groq');
    if (!groqKey || !groqKey.trim()) {
      throw new Error(
        'GROQ_API_KEY is not configured on the server. Please add GROQ_API_KEY in server/.env or configure it in settings.'
      );
    }
    return await generateGroqResponse({
      apiKey: groqKey.trim(),
      model,
      systemPrompt: fullSystemPrompt,
      messages,
      userMessage,
      attachmentContext,
      temperature,
      maxTokens
    });
  }

  // Fallback to Gemini
  const fallbackKey = getGeminiApiKey() || db.getRawApiKey('gemini');
  if (!fallbackKey || !fallbackKey.trim()) {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please add your GEMINI_API_KEY in server/.env and restart the backend server.'
    );
  }

  return await generateGeminiResponse({
    apiKey: fallbackKey.trim(),
    model: 'gemini-3.6-flash',
    systemPrompt: fullSystemPrompt,
    messages,
    userMessage,
    attachments,
    attachmentContext,
    temperature,
    maxTokens
  });
}

/**
 * Google Gemini Provider (Real LLM API)
 */
async function generateGeminiResponse({
  apiKey,
  model,
  systemPrompt,
  messages = [],
  userMessage,
  attachments = [],
  attachmentContext,
  temperature,
  maxTokens
}) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const targetModel = model || 'gemini-1.5-flash';
    const geminiModel = genAI.getGenerativeModel({
      model: targetModel,
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: Math.max(0, Math.min(temperature, 1)),
        maxOutputTokens: maxTokens || 2048
      }
    });

    // Build properly formatted multi-turn history for Gemini
    // Gemini expects alternating user and model turns, starting with a user message
    const history = [];
    const pastMsgs = (messages || []).slice(-12);

    for (const m of pastMsgs) {
      if (!m.content || !m.content.trim()) continue;

      const role = m.role === 'user' ? 'user' : 'model';

      // Avoid consecutive messages with the same role
      if (history.length > 0 && history[history.length - 1].role === role) {
        history[history.length - 1].parts[0].text += `\n\n${m.content}`;
      } else {
        history.push({
          role,
          parts: [{ text: m.content }]
        });
      }
    }

    // Ensure history starts with user if it has messages
    while (history.length > 0 && history[0].role !== 'user') {
      history.shift();
    }

    const chat = geminiModel.startChat({ history });

    // Prepare current prompt parts (text + attachments)
    const parts = [];
    const textPrompt = `${userMessage}${attachmentContext ? `\n\n${attachmentContext}` : ''}`;
    parts.push({ text: textPrompt });

    // Add multimodal image attachments if present
    for (const att of attachments) {
      if (att.isImage && att.base64) {
        parts.push({
          inlineData: {
            data: att.base64,
            mimeType: att.mimeType || 'image/jpeg'
          }
        });
      }
    }

    const result = await chat.sendMessage(parts);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error('Gemini API returned an empty response.');
    }

    return {
      content,
      provider: 'gemini',
      model: targetModel,
      tokens: Math.round(content.length / 4)
    };
  } catch (err) {
    console.error('Gemini API Error:', err);
    if (err.message && err.message.includes('API_KEY_INVALID')) {
      throw new Error('Invalid GEMINI_API_KEY. Please verify your API key in server/.env.');
    }
    if (err.message && err.message.includes('QUOTA_EXCEEDED')) {
      throw new Error('Gemini API quota exceeded. Please check your Google AI Studio quota or try again shortly.');
    }
    throw new Error(`Gemini API Error: ${err.message}`);
  }
}

/**
 * OpenAI Provider
 */
async function generateOpenAIResponse({
  apiKey,
  model,
  systemPrompt,
  messages = [],
  userMessage,
  attachmentContext,
  temperature,
  maxTokens
}) {
  const formattedMessages = [{ role: 'system', content: systemPrompt }];

  const pastMsgs = messages.slice(-10);
  for (const m of pastMsgs) {
    if (m.content) {
      formattedMessages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      });
    }
  }

  const currentContent = `${userMessage}${attachmentContext ? `\n\n${attachmentContext}` : ''}`;
  formattedMessages.push({ role: 'user', content: currentContent });

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `OpenAI request failed: ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices[0]?.message?.content || '';

  return {
    content,
    provider: 'openai',
    model: model || 'gpt-4o-mini',
    tokens: data.usage?.total_tokens || Math.round(content.length / 4)
  };
}

/**
 * Anthropic Claude Provider
 */
async function generateAnthropicResponse({
  apiKey,
  model,
  systemPrompt,
  messages = [],
  userMessage,
  attachmentContext,
  temperature,
  maxTokens
}) {
  const formattedMessages = [];
  const pastMsgs = messages.slice(-10);
  for (const m of pastMsgs) {
    if (m.content) {
      formattedMessages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      });
    }
  }

  const currentContent = `${userMessage}${attachmentContext ? `\n\n${attachmentContext}` : ''}`;
  formattedMessages.push({ role: 'user', content: currentContent });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      system: systemPrompt,
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Anthropic request failed: ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.content?.map((c) => c.text).join('\n') || '';

  return {
    content,
    provider: 'anthropic',
    model: model || 'claude-3-5-sonnet-20241022',
    tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
  };
}

/**
 * Groq Provider
 */
async function generateGroqResponse({
  apiKey,
  model,
  systemPrompt,
  messages = [],
  userMessage,
  attachmentContext,
  temperature,
  maxTokens
}) {
  const formattedMessages = [{ role: 'system', content: systemPrompt }];
  const pastMsgs = messages.slice(-10);
  for (const m of pastMsgs) {
    if (m.content) {
      formattedMessages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      });
    }
  }
  const currentContent = `${userMessage}${attachmentContext ? `\n\n${attachmentContext}` : ''}`;
  formattedMessages.push({ role: 'user', content: currentContent });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: formattedMessages,
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq request failed: ${res.statusText}`);
  }

  const data = await res.json();
  const content = data.choices[0]?.message?.content || '';

  return {
    content,
    provider: 'groq',
    model: model || 'llama-3.3-70b-versatile',
    tokens: data.usage?.total_tokens || Math.round(content.length / 4)
  };
}
