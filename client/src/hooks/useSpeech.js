import { useState, useEffect, useRef, useCallback } from 'react';

// Common Hinglish / Romanized Hindi keywords for language detection
const HINGLISH_KEYWORDS = new Set([
  'namaste', 'kaise', 'kaisa', 'kaisi', 'aap', 'aapka', 'aapki', 'aapke', 'tum', 'tumhara',
  'kya', 'hai', 'hain', 'ho', 'hoon', 'hun', 'mein', 'main', 'hum', 'mera', 'meri', 'mere',
  'hoga', 'hogi', 'hoge', 'batao', 'karo', 'karna', 'kare', 'shukriya', 'dhanyawad', 'dhanyavaad',
  'kripya', 'kripya', 'kuch', 'bahut', 'bohot', 'accha', 'achha', 'theek', 'thik', 'madad',
  'karunga', 'karungi', 'sakte', 'sakta', 'sakti', 'saktee', 'chahiye', 'nahi', 'nahin',
  'kyun', 'kaise', 'kab', 'kahan', 'yahan', 'wahan', 'zaroor', 'bhi', 'aur', 'lekin',
  'dost', 'bhai', 'samajh', 'samjha', 'shuru', 'khatam', 'alvida', 'namaskar'
]);

/**
 * Automatically detects if text is primarily Hindi (Devanagari script or Hinglish) or English
 * @param {string} text
 * @returns {'hi-IN' | 'en-US'}
 */
export function detectTextLanguage(text) {
  if (!text || typeof text !== 'string') return 'en-US';

  // 1. Check for Devanagari Unicode script range (\u0900-\u097F)
  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  if (devanagariMatches && devanagariMatches.length > 0) {
    return 'hi-IN';
  }

  // 2. Check for Romanized Hindi / Hinglish keywords
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let hinglishCount = 0;
  for (const word of words) {
    if (HINGLISH_KEYWORDS.has(word)) {
      hinglishCount++;
    }
  }

  // If multiple Hinglish keywords found or significant portion of short text
  if (hinglishCount >= 2 || (hinglishCount >= 1 && words.length <= 6)) {
    return 'hi-IN';
  }

  return 'en-US';
}

/**
 * Finds the most suitable SpeechSynthesisVoice for the detected language
 * @param {'hi-IN' | 'en-US'} detectedLang
 * @param {SpeechSynthesisVoice[]} availableVoices
 * @param {string} preferredVoiceName
 * @returns {SpeechSynthesisVoice | null}
 */
export function findBestVoiceForLanguage(detectedLang, availableVoices = [], preferredVoiceName = '') {
  if (!availableVoices || availableVoices.length === 0) return null;

  // 1. If Hindi is detected
  if (detectedLang === 'hi-IN') {
    // If user explicitly picked a Hindi voice by name, use it
    if (preferredVoiceName) {
      const explicitMatch = availableVoices.find(
        (v) => v.name === preferredVoiceName && v.lang.toLowerCase().startsWith('hi')
      );
      if (explicitMatch) return explicitMatch;
    }

    // A. Look for dedicated Hindi voices (hi-IN, hi, Devanagari)
    const hindiVoice = availableVoices.find((v) => {
      const langLower = (v.lang || '').toLowerCase();
      const nameLower = (v.name || '').toLowerCase();
      return (
        langLower.startsWith('hi') ||
        nameLower.includes('hindi') ||
        nameLower.includes('हिन्दी') ||
        nameLower.includes('swara') ||
        nameLower.includes('hemant') ||
        nameLower.includes('kalpana')
      );
    });

    if (hindiVoice) return hindiVoice;

    // B. Fallback: Look for Indian English voices (en-IN), which handle Hindi/Hinglish phonetics well
    const indianEnglishVoice = availableVoices.find((v) => {
      const langLower = (v.lang || '').toLowerCase();
      const nameLower = (v.name || '').toLowerCase();
      return (
        langLower === 'en-in' ||
        langLower.startsWith('en-in') ||
        nameLower.includes('india') ||
        nameLower.includes('neerja') ||
        nameLower.includes('prabhat')
      );
    });

    if (indianEnglishVoice) return indianEnglishVoice;
  }

  // 2. If English or default
  if (preferredVoiceName) {
    const userVoice = availableVoices.find((v) => v.name === preferredVoiceName);
    if (userVoice) return userVoice;
  }

  // Look for natural English voices
  const defaultEnglish = availableVoices.find((v) => {
    const langLower = (v.lang || '').toLowerCase();
    return langLower.startsWith('en-us') || langLower.startsWith('en-in') || langLower.startsWith('en');
  });

  return defaultEnglish || availableVoices[0] || null;
}

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [speechSupported, setSpeechSupported] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const activeUtteranceRef = useRef(null);

  // Initialize Speech APIs and load voices
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const synth = window.speechSynthesis;

      setSpeechSupported(Boolean(SpeechRecognition || synth));

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = (event) => {
          console.warn('Speech recognition notice:', event.error);
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }

      if (synth) {
        synthRef.current = synth;

        const updateVoices = () => {
          const available = synth.getVoices() || [];
          setVoices(available);
        };

        updateVoices();

        if (synth.onvoiceschanged !== undefined) {
          synth.onvoiceschanged = updateVoices;
        }
      }
    }
  }, []);

  // Start Listening
  const startListening = useCallback(
    (onResultCallback) => {
      if (!recognitionRef.current) return;
      try {
        setTranscript('');
        recognitionRef.current.onresult = (event) => {
          let current = '';
          for (let i = 0; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
          if (onResultCallback) onResultCallback(current);
        };
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    },
    []
  );

  // Stop Listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  // Speak text aloud with automatic language and voice detection
  const speak = useCallback(
    (text, { pitch = 1.0, rate = 1.0, voiceName = '' } = {}) => {
      if (!synthRef.current || !text) return;

      // Clean text by stripping markdown code blocks, links, and formatting symbols
      const cleanText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*_#\[\]()~>]/g, '')
        .replace(/https?:\/\/\S+/g, 'link')
        .trim();

      if (!cleanText) return;

      // Stop any ongoing speech
      synthRef.current.cancel();

      // Detect language (Hindi / Hinglish vs English)
      const detectedLang = detectTextLanguage(cleanText);

      // Create new utterance
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.pitch = pitch;
      utterance.rate = rate;
      utterance.lang = detectedLang;

      // Get latest voices if list was empty
      const availableVoices = voices.length > 0 ? voices : synthRef.current.getVoices() || [];
      const selectedVoice = findBestVoiceForLanguage(detectedLang, availableVoices, voiceName);

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        // Align utterance lang with the selected voice's lang
        utterance.lang = selectedVoice.lang || detectedLang;
      }

      // Preserve active reference to prevent garbage collection cutoffs in Chrome
      activeUtteranceRef.current = utterance;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
      };
      utterance.onerror = (e) => {
        console.warn('Speech synthesis notice:', e);
        setIsSpeaking(false);
        activeUtteranceRef.current = null;
      };

      synthRef.current.speak(utterance);
    },
    [voices]
  );

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      activeUtteranceRef.current = null;
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSpeaking,
    speak,
    stopSpeaking,
    voices,
    speechSupported,
    detectLanguage: detectTextLanguage
  };
}
