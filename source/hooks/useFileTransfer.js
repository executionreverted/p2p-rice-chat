
import { useState, useEffect, useRef } from 'react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { CHUNK_SIZE, formatBytes, expandPath } from '../utils/index.js';

export function useFileTransfer({ swarms, currentRoom, username, onMessage }) {
  // Use refs for long-lived objects that shouldn't trigger re-renders
  const transfersRef = useRef(new Map());
  // State to trigger UI updates when transfers change
  const [transfersVersion, setTransfersVersion] = useState(0);

  // Helper to trigger UI update when transfers change
  const updateTransfersUI = () => {
    setTransfersVersion(prev => prev + 1);
  };
  // Share a file with peers in current room
  const shareFile = (filePath) => {
    try {
      if (!filePath) {
        onMessage('Usage: /share <file-path>');
        return;
      }

      if (!currentRoom) {
        onMessage('You must be in a room to share files');
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

      // Get the swarm for current room
      if (!swarms.has(currentRoom.topic)) {
        onMessage('Cannot find room swarm');
        return;
      }

      const roomSwarm = swarms.get(currentRoom.topic);

      // Send file share message
      const fileShareMsg = {
        type: 'file-share',
        username: username,
        filename: filename,
        fileSize: stats.size,
        path: filePath,
        timestamp: Date.now()
      };

      // Send to all peers in this room
      const peers = [...roomSwarm.connections];
      if (peers.length === 0) {
        onMessage('No peers connected in this room. Cannot share file.');
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

  // Update transfers periodically to reflect UI changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Only trigger update if there are changes to show
      if (transfersRef.current.size > 0) {
        updateTransfersUI();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    transfers: transfersRef.current,
    transfersVersion,
    shareFile,
    handleFileShareOffer
  };
}
