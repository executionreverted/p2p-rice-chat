import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { CHUNK_SIZE, formatBytes, expandPath } from '../utils/index.js';
import { useSwarmContext } from './useSwarm.js';
import { useMessageContext } from './useMessages.js';

// Create the FileTransfer context
const FileTransferContext = createContext(null);

// Custom hook to use the context
export function useFileTransferContext() {
  const context = useContext(FileTransferContext);
  if (!context) {
    throw new Error('useFileTransferContext must be used within a FileTransferProvider');
  }
  return context;
}

// Provider component
export function FileTransferProvider({ children }) {
  const { addSystemMessage } = useMessageContext()
  // Get swarm functionality from context
  const { swarms, currentRoom } = useSwarmContext();

  // Use refs for long-lived objects that shouldn't trigger re-renders
  const transfersRef = useRef(new Map());
  const pendingOffersRef = useRef(new Map());
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
        addSystemMessage('', 'Usage: /share <file-path>');
        return;
      }

      if (!currentRoom) {
        addSystemMessage('', 'You must be in a room to share files');
        return;
      }

      // Expand ~ to home directory
      filePath = expandPath(filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        addSystemMessage('', `File not found: ${filePath}`);
        return;
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        addSystemMessage('', `Not a file: ${filePath}`);
        return;
      }

      const filename = path.basename(filePath);
      addSystemMessage('', `Sharing file: ${filename} (${formatBytes(stats.size)})`);

      // Get the swarm for current room
      if (!swarms.has(currentRoom.topic)) {
        addSystemMessage('', 'Cannot find room swarm');
        return;
      }

      const roomSwarm = swarms.get(currentRoom.topic);

      // Create transfer ID
      const transferId = crypto.randomBytes(16).toString('hex');

      // Send file share message
      const fileShareMsg = {
        type: 'file-share',
        transferId: transferId,
        username: username,
        filename: filename,
        fileSize: stats.size,
        timestamp: Date.now()
      };

      // Save transfer record
      transfersRef.current.set(transferId, {
        id: transferId,
        type: 'upload',
        filename: filename,
        fileSize: stats.size,
        path: filePath,
        status: 'pending',
        sentChunks: 0,
        totalChunks: Math.ceil(stats.size / CHUNK_SIZE),
        peers: new Set(),
        timestamp: Date.now()
      });

      updateTransfersUI();

      // Send to all peers in this room
      const peers = [...roomSwarm.connections];
      if (peers.length === 0) {
        addSystemMessage('', 'No peers connected in this room. Cannot share file.');
        return;
      }

      for (const peer of peers) {
        peer.write(JSON.stringify(fileShareMsg));
      }

      addSystemMessage('', `File offer sent to ${peers.length} peer(s)`);
    } catch (err) {
      addSystemMessage('', `Error sharing file: ${err.message}`);
    }
  };

  // Handle incoming file share offer
  const handleFileShareOffer = (message, peerId, peer) => {
    // Store the offer in pending offers
    pendingOffersRef.current.set(message.transferId, {
      transferId: message.transferId,
      peer: peer,
      peerId: peerId,
      username: message.username,
      filename: message.filename,
      fileSize: message.fileSize,
      timestamp: message.timestamp
    });

    addSystemMessage('', `${message.username || peerId} wants to share: ${message.filename} (${formatBytes(message.fileSize)})`);
    addSystemMessage('', `Type "/accept ${message.transferId}" to download the file.`);
  };

  // Accept a file transfer
  const acceptFileTransfer = (transferId) => {
    try {
      // Check if offer exists
      if (!pendingOffersRef.current.has(transferId)) {
        // Try with partial ID match
        const matches = Array.from(pendingOffersRef.current.entries())
          .filter(([id]) => id.startsWith(transferId));

        if (matches.length === 1) {
          transferId = matches[0][0]; // Use the full ID
        } else if (matches.length > 1) {
          addSystemMessage('', `Multiple matching transfers found. Please use more characters from the ID.`);
          for (const [id, offer] of matches) {
            addSystemMessage('', `- ${id.slice(0, 8)}: ${offer.filename} from ${offer.username}`);
          }
          return false;
        } else {
          addSystemMessage('', `No pending file transfer with ID: ${transferId}`);
          return false;
        }
      }

      const offer = pendingOffersRef.current.get(transferId);

      // Create download directory if it doesn't exist
      const downloadDir = path.join(os.homedir(), 'Downloads', 'HyperChat');
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }

      // Generate destination path, avoid overwriting existing files
      let filePath = path.join(downloadDir, offer.filename);
      let fileIndex = 1;

      while (fs.existsSync(filePath)) {
        const ext = path.extname(offer.filename);
        const baseName = path.basename(offer.filename, ext);
        filePath = path.join(downloadDir, `${baseName} (${fileIndex})${ext}`);
        fileIndex++;
      }

      // Create transfer record
      transfersRef.current.set(transferId, {
        id: transferId,
        type: 'download',
        filename: offer.filename,
        fileSize: offer.fileSize,
        path: filePath,
        status: 'accepted',
        receivedChunks: 0,
        totalChunks: Math.ceil(offer.fileSize / CHUNK_SIZE),
        peer: offer.peer,
        fileStream: fs.createWriteStream(filePath),
        timestamp: Date.now()
      });

      // Send acceptance message to peer
      const acceptMsg = {
        type: 'file-accept',
        transferId: transferId,
        username: username
      };

      offer.peer.write(JSON.stringify(acceptMsg));

      // Remove from pending offers
      pendingOffersRef.current.delete(transferId);

      addSystemMessage('', `Accepted file transfer: ${offer.filename}`);
      addSystemMessage('', `Will be saved to: ${filePath}`);

      updateTransfersUI();
      return true;
    } catch (err) {
      addSystemMessage('', `Error accepting file: ${err.message}`);
      return false;
    }
  };

  // Process message based on type
  const processFileMessage = (message, peerId, peer) => {
    switch (message.type) {
      case 'file-share':
        handleFileShareOffer(message, peerId, peer);
        break;
      case 'file-accept':
        // handleFileAcceptance(message, peerId, peer);
        break;
      case 'file-chunk':
        // handleFileChunk(message, peerId, peer);
        break;
      case 'file-complete':
        // handleFileComplete(message, peerId, peer);
        break;
      case 'file-error':
        // handleFileError(message, peerId, peer);
        break;
    }
  };

  // Update transfers periodically to reflect UI changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Only trigger update if there are transfers to show
      if (transfersRef.current.size > 0) {
        updateTransfersUI();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // The context value
  const value = {
    transfers: transfersRef.current,
    transfersVersion,
    shareFile,
    acceptFileTransfer,
    processFileMessage,
    handleFileShareOffer
  };

  return (
    <FileTransferContext.Provider value={value}>
      {children}
    </FileTransferContext.Provider>
  );
}

// Standalone hook for backward compatibility
export function useFileTransfer({ username }) {

  const { swarms, currentRoom } = useSwarmContext();
  // Use refs for transfers
  const transfersRef = useRef(new Map());
  const [transfersVersion, setTransfersVersion] = useState(0);

  // Basic implementation for backward compatibility
  const shareFile = (filePath) => {
    try {
      if (!filePath) {
        addSystemMessage('', 'Usage: /share <file-path>');
        return;
      }

      if (!currentRoom) {
        addSystemMessage('', 'You must be in a room to share files');
        return;
      }

      // Expand ~ to home directory
      filePath = expandPath(filePath);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        addSystemMessage('', `File not found: ${filePath}`);
        return;
      }

      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        addSystemMessage('', `Not a file: ${filePath}`);
        return;
      }

      const filename = path.basename(filePath);
      addSystemMessage('', `Sharing file: ${filename} (${formatBytes(stats.size)})`);

      // Get the swarm for current room
      if (!swarms.has(currentRoom.topic)) {
        addSystemMessage('', 'Cannot find room swarm');
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
        addSystemMessage('', 'No peers connected in this room. Cannot share file.');
        return;
      }

      for (const peer of peers) {
        peer.write(JSON.stringify(fileShareMsg));
      }

      addSystemMessage('', `File offer sent to ${peers.length} peer(s)`);
    } catch (err) {
      addSystemMessage('', `Error sharing file: ${err.message}`);
    }
  };

  return {
    transfers: transfersRef.current,
    transfersVersion,
    shareFile,
    handleFileShareOffer: () => { }
  };
}
