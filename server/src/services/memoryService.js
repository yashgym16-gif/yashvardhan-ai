import { db } from '../db/database.js';

/**
 * Memory Service for Yashvardhan AI
 * Handles persistent long-term memory, preference recall, and auto-learning facts.
 */

export function getMemories() {
  return db.getMemories();
}

export function addMemory({ category = 'general', key, value }) {
  return db.addMemory({ category, key, value });
}

export function deleteMemory(id) {
  return db.deleteMemory(id);
}

export function clearMemories() {
  return db.clearMemories();
}

/**
 * Format active memories into prompt context
 */
export function formatMemoriesForPrompt() {
  const memories = db.getMemories();
  if (!memories || memories.length === 0) return '';

  let context = `\n\n[USER LONG-TERM MEMORY & PREFERENCES]\n`;
  memories.forEach((m) => {
    context += `- [${m.category.toUpperCase()}] ${m.key}: ${m.value}\n`;
  });
  context += `Instruction: Respect and use these user details, context, and preferences naturally without explicitly listing this memory dump unless asked.\n`;
  return context;
}

/**
 * Auto-extract memorable facts or preferences from user input
 */
export function autoLearnFromMessage(messageContent) {
  if (!messageContent || typeof messageContent !== 'string') return null;

  const content = messageContent.trim();
  const lower = content.toLowerCase();

  // Pattern 1: Explicit "remember that..." or "remember:"
  const rememberMatch = content.match(/remember(?:\s+that)?\s+([^\.\n]+)/i);
  if (rememberMatch && rememberMatch[1]) {
    const value = rememberMatch[1].trim();
    return db.addMemory({
      category: 'explicit',
      key: `Fact: ${value.slice(0, 30)}`,
      value
    });
  }

  // Pattern 2: "My name is..."
  const nameMatch = content.match(/my name is\s+([A-Za-z0-9_\- ]+)/i);
  if (nameMatch && nameMatch[1]) {
    const name = nameMatch[1].trim().split(/[,\.]/)[0];
    return db.addMemory({
      category: 'profile',
      key: 'User Name',
      value: name
    });
  }

  // Pattern 3: "I prefer..." or "My preferred ... is ..."
  const preferMatch = content.match(/(?:i prefer|my favorite|i like using)\s+([^\.\n]+)/i);
  if (preferMatch && preferMatch[1]) {
    const pref = preferMatch[1].trim();
    return db.addMemory({
      category: 'preference',
      key: `Preference: ${pref.slice(0, 25)}`,
      value: pref
    });
  }

  return null;
}
