import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Search for .env in server directory, project root, and current working directory
const candidatePaths = [
  path.resolve(__dirname, '../../.env'), // scratch/yashvardhan-ai/server/.env
  path.resolve(__dirname, '../../../.env'), // scratch/yashvardhan-ai/.env
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'server/.env')
];

let envLoaded = false;
for (const envPath of candidatePaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    envLoaded = true;
    break;
  }
}

if (!envLoaded) {
  dotenv.config({ override: true });
}

/**
 * Safely get the GEMINI_API_KEY from environment variables
 * Ensures empty or placeholder values are properly detected
 */
export function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY || '';
  if (
    key &&
    key.trim() !== '' &&
    key !== 'your_api_key_here' &&
    key !== 'your_gemini_api_key_here' &&
    !key.startsWith('your_')
  ) {
    return key.trim();
  }
  return '';
}

export default {
  getGeminiApiKey
};
