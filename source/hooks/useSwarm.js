import { useState, useEffect } from 'react';
import Hyperswarm from 'hyperswarm';
import b4a from 'b4a';
import crypto from 'crypto';

export function useSwarm({ initialTopic, username, onMessage, onSystem }) {
  const [swarm] = useState(() => new Hyperswarm());
  const [isConnected, setIsConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);
  const [roomTopic, setRoomTopic] = useState('');

  // Send message to all connected peers
  const sendToAllPeers = (message) => {
    const peers = [...swarm.connections];
    if (peers.length > 0) {
      for (const peer of peers) {
        peer.write(JSON.stringify(message));
      }
      return true;
    }
    return false;
  };

  // Effect to join a chat room
  useEffect(() => {
    const joinRoom = async () => {
      try {
        // Generate a topic or use provided one
        let topicBuffer;
        if (initialTopic) {
          topicBuffer = b4a.from(initialTopic, 'hex');
          setRoomTopic(initialTopic);
        } else {
          topicBuffer = crypto.randomBytes(32);
          setRoomTopic(b4a.toString(topicBuffer, 'hex'));
        }

        // Join the swarm
        const discovery = swarm.join(topicBuffer, { client: true, server: true });
        await discovery.flushed();

        setIsConnected(true);
        onSystem(`Joined room: ${b4a.toString(topicBuffer, 'hex').slice(0, 8)}...`);

        if (!initialTopic) {
          onSystem('Share this topic to invite others:');
          onSystem(b4a.toString(topicBuffer, 'hex'));
        }
      } catch (err) {
        onSystem(`Error joining room: ${err.message}`);
      }
    };

    joinRoom();

    return () => {
      // Cleanup
      swarm.destroy().catch(err => {
        console.error(`Error during shutdown: ${err.message}`);
      });
    };
  }, []);

  // Set up connection handler for peers
  useEffect(() => {
    const handleConnection = (peer) => {
      const peerId = b4a.toString(peer.remotePublicKey, 'hex').slice(0, 6);
      onSystem(`New peer connected: ${peerId}`);
      setPeerCount(swarm.connections.size);

      // Create a unique ID for this peer connection
      peer.connectionId = crypto.randomBytes(4).toString('hex');

      // Handle messages
      peer.on('data', (data) => {
        try {
          const message = JSON.parse(b4a.toString(data));

          if (message.type === 'chat') {
            onMessage(message.username || peerId, message.text);
          }
          // File-related messages are handled by the useFileTransfer hook
        } catch (err) {
          // Handle plain text messages
          const text = b4a.toString(data);
          if (text.length > 0) {
            onMessage(peerId, text);
          }
        }
      });

      peer.on('error', (e) => {
        onSystem(`Connection error: ${e}`);
      });

      // Handle peer disconnection
      peer.on('close', () => {
        onSystem(`Peer disconnected: ${peerId}`);
        setPeerCount(swarm.connections.size);
      });
    };

    swarm.on('connection', handleConnection);

    return () => {
      swarm.removeListener('connection', handleConnection);
    };
  }, [onMessage, onSystem]);

  return {
    swarm,
    isConnected,
    peerCount,
    roomTopic,
    sendToAllPeers
  };
}
