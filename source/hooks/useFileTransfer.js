import { useState, useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { CHUNK_SIZE, formatBytes, expandPath } from '../utils/index.js';

export function useFileTransfer({ swarm, username, onMessage }) {
  const [transfers, setTransfers] = useState(new Map());
  // Maintain a reference to active transfers that can be modified by handlers
  const activeTransfers = new Map();

  // Share a file with peers
  const shareFile = (filePath) => {
    try {
      if (!filePath) {
        onMessage('Usage: /share <file-path>');
        return;
      }

      // Expand ~ to home directory
      filePath = expandPath(filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        onMessage(`File not found: ${filePath}`);
        return;
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        onMessage(`Not a file: ${filePath}`);
        return;
      }

      const filename = path.basename(filePath);
      onMessage(`Sharing file: ${filename} (${formatBytes(stats.size)})`);

      // Send file share message
      const fileShareMsg = {
        type: 'file-share',
        username: username,
        filename: filename,
        fileSize: stats.size,
        path: filePath,
        timestamp: Date.now()
      };

      // Send to all peers
      const peers = [...swarm.connections];
      if (peers.length === 0) {
        onMessage('No peers connected. Cannot share file.');
        return;
      }

      for (const peer of peers) {
        peer.write(JSON.stringify(fileShareMsg));
      }

      onMessage(`File offer sent to ${peers.length} peer(s)`);
    } catch (err) {
      onMessage(`Error sharing file: ${err.message}`);
    }
  };

  // Handle incoming file share offer
  const handleFileShareOffer = (message, peerId, peer) => {
    onMessage(`${message.username || peerId} wants to share: ${message.filename} (${formatBytes(message.fileSize)})`);

    // In a more complete implementation, you'd want to prompt the user and handle the response
    // For now, we'll just provide instructions
    onMessage(`Type "/accept ${message.filename}" to accept the download`);
  };

  // Update transfers in state
  useEffect(() => {
    const interval = setInterval(() => {
      setTransfers(new Map(activeTransfers));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // In a complete implementation, you would also include:
  // - handleFileRequest
  // - handleFileChunk
  // - handleChunkAck
  // - handleTransferComplete
  // - sendNextChunks
  // These would be similar to the original code but adapted to the React/hooks pattern

  return {
    transfers,
    shareFile,
    handleFileShareOffer
  };
}
