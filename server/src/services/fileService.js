import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_\-]/g, '_');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max
});

/**
 * Process an uploaded file into an AI-ready attachment object
 */
export async function processUploadedFile(file) {
  const filePath = file.path;
  const fileName = file.originalname;
  const mimeType = file.mimetype;
  const ext = path.extname(fileName).toLowerCase();

  const isImage = mimeType.startsWith('image/');
  const isText =
    mimeType.startsWith('text/') ||
    [
      '.txt',
      '.md',
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.json',
      '.csv',
      '.py',
      '.html',
      '.css',
      '.scss',
      '.yaml',
      '.yml',
      '.xml',
      '.sql',
      '.sh',
      '.env'
    ].includes(ext);

  let extractedContent = '';
  let base64 = null;

  if (isImage) {
    const fileBuffer = fs.readFileSync(filePath);
    base64 = fileBuffer.toString('base64');
  } else if (isText) {
    try {
      extractedContent = fs.readFileSync(filePath, 'utf-8');
      // Limit preview text size to 50KB to avoid excessive token consumption
      if (extractedContent.length > 50000) {
        extractedContent = extractedContent.slice(0, 50000) + '\n\n...[Content truncated for length]...';
      }
    } catch (err) {
      console.error('Error reading text file:', err);
    }
  } else {
    extractedContent = `[Binary file attachment: ${fileName} (${(file.size / 1024).toFixed(1)} KB)]`;
  }

  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    originalName: fileName,
    fileName: file.filename,
    mimeType,
    size: file.size,
    isImage,
    isText,
    extractedContent,
    base64,
    url: `/uploads/${file.filename}`
  };
}

/**
 * Format attachments for prompt context
 */
export function formatAttachmentsForPrompt(attachments) {
  if (!attachments || attachments.length === 0) return '';

  let context = `\n\n[USER ATTACHED FILES & DOCUMENTS]\n`;
  attachments.forEach((att, idx) => {
    context += `\n--- File #${idx + 1}: ${att.originalName} (${att.mimeType || 'unknown'}) ---\n`;
    if (att.isText && att.extractedContent) {
      context += `${att.extractedContent}\n`;
    } else if (att.isImage) {
      context += `[Image attached: ${att.originalName}]\n`;
    } else {
      context += `${att.extractedContent || '[Attachment provided]'}\n`;
    }
  });
  return context;
}
