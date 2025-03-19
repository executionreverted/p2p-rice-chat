import fs from 'fs';
import os from 'os';
import path from 'path';

// Data directory
export const DATA_DIR = path.join(os.homedir(), '.hyperchat');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Chunk size for file transfers
export const CHUNK_SIZE = 1024 * 512; // 512 KB chunks

// Helper function to format bytes
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Expand home directory in file paths
export function expandPath(filePath) {
  if (filePath.startsWith('~')) {
    return filePath.replace('~', os.homedir());
  }
  return filePath;
}
