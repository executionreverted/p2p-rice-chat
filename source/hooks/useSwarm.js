import { useState, useEffect, useRef } from 'react';
import Hyperswarm from 'hyperswarm';
import b4a from 'b4a';
import crypto from 'crypto';

export function useSwarm({ username, onMessage, onSystem }) {
  // Map to store all swarms by room topic - use useRef to maintain persistent references
  const swarmsRef = useRef(new Map());

  // Current room state
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peerCount, setPeerCount] = useState(0);

  // Make sure onSystem is a valid function
  const handleSystemMessage = typeof onSystem === 'function'
    ? onSystem
    : (msg) => console.log(`[System] ${msg}`);

  // Create a new room
  const createRoom = (roomName, description = "") => {
    try {
      // Generate a new random topic
      const topicBuffer = crypto.randomBytes(32);
      const topicHex = b4a.toString(topicBuffer, 'hex');

      // Create room data
      const roomData = {
        name: roomName,
        description: description,
        topic: topicHex,
        messages: []
      };

      // Join the new room
      joinRoom(roomData);

      return roomData;
    } catch (err) {
      handleSystemMessage(`Error creating room: ${err.message}`);
      return null;
    }
  };

  // Join an existing room
  const joinRoom = async (roomData) => {
    try {
      // Validate room data
      if (!roomData || typeof roomData !== 'object') {
        handleSystemMessage("Room data is not an object");
        return false;
      }

      if (!roomData.topic || typeof roomData.topic !== 'string') {
        handleSystemMessage("Room topic is missing or invalid");
        return false;
      }

      const topicHex = roomData.topic;

      // Check if we already have a swarm for this room
      if (!swarmsRef.current.has(topicHex)) {
        // Create a new swarm for this room
        const swarm = new Hyperswarm();

        // Set up connection handler for this swarm
        swarm.on('connection', createConnectionHandler(roomData, swarm));

        // Join the swarm with this topic
        const topicBuffer = b4a.from(topicHex, 'hex');
        const discovery = swarm.join(topicBuffer, { client: true, server: true });
        await discovery.flushed();

        // Store discovery reference for cleanup
        swarm.discovery = discovery;

        // Store the swarm in our map
        swarmsRef.current.set(topicHex, swarm);

        handleSystemMessage(`Joined new room: ${roomData.name || topicHex.slice(0, 8)}`);
      } else {
        handleSystemMessage(`Switched to room: ${roomData.name || topicHex.slice(0, 8)}`);
      }

      // Set this as the current room
      setCurrentRoom(roomData);
      setIsConnected(true);

      // Update peer count for this room
      updatePeerCount(topicHex);

      return true;
    } catch (err) {
      handleSystemMessage(`Error joining room: ${err.message}`);
      return false;
    }
  };

  // Leave a room
  const leaveRoom = async (topicHex) => {
    try {
      if (!topicHex || !swarmsRef.current.has(topicHex)) {
        return false;
      }

      const swarm = swarmsRef.current.get(topicHex);

      // Leave the topic
      if (swarm.discovery) {
        swarm.leave(swarm.discovery.topic);
      }

      // Destroy the swarm
      await swarm.destroy();

      // Remove from our map
      swarmsRef.current.delete(topicHex);

      handleSystemMessage(`Left room`);
      return true;
    } catch (err) {
      handleSystemMessage(`Error leaving room: ${err.message}`);
      return false;
    }
  };

  // Create connection handler for a specific room
  const createConnectionHandler = (roomData, swarm) => (peer) => {
    const peerId = b4a.toString(peer.remotePublicKey, 'hex').slice(0, 6);

    // Only send system message if this is the current room
    if (currentRoom && currentRoom.topic === roomData.topic) {
      handleSystemMessage(`New peer connected in ${roomData.name}: ${peerId}`);
    }

    // Update peer count
    updatePeerCount(roomData.topic);

    // Create a unique ID for this peer connection
    peer.connectionId = crypto.randomBytes(4).toString('hex');

    // Handle messages
    const handleData = (data) => {
      try {
        const message = JSON.parse(b4a.toString(data));

        if (message.type === 'chat') {
          // Route message to the appropriate handler
          onMessage(
            roomData.topic,
            message.username || peerId,
            message.text
          );
        }
        // Other message types handled separately
      } catch (err) {
        // Handle plain text messages
        const text = b4a.toString(data);
        if (text.length > 0) {
          onMessage(roomData.topic, peerId, text);
        }
      }
    };

    const handleError = (e) => {
      if (currentRoom && currentRoom.topic === roomData.topic) {
        handleSystemMessage(`Connection error: ${e}`);
      }
    };

    const handleClose = () => {
      if (currentRoom && currentRoom.topic === roomData.topic) {
        handleSystemMessage(`Peer disconnected: ${peerId}`);
      }

      // Update peer count
      updatePeerCount(roomData.topic);
    };

    // Set up event listeners
    peer.on('data', handleData);
    peer.on('error', handleError);
    peer.on('close', handleClose);
  };

  // Update peer count for a specific room
  const updatePeerCount = (topicHex) => {
    if (swarmsRef.current.has(topicHex)) {
      const swarm = swarmsRef.current.get(topicHex);
      const count = swarm.connections.size;

      // Only update state if this is the current room
      if (currentRoom && currentRoom.topic === topicHex) {
        setPeerCount(count);
      }

      return count;
    }
    return 0;
  };

  // Send message to all peers in the current room
  const sendToCurrentRoom = (message) => {
    if (!currentRoom) {
      handleSystemMessage("Not in any room");
      return false;
    }

    const topicHex = currentRoom.topic;

    if (!swarmsRef.current.has(topicHex)) {
      handleSystemMessage("Room swarm not found");
      return false;
    }

    const swarm = swarmsRef.current.get(topicHex);
    const peers = [...swarm.connections];

    if (peers.length === 0) {
      handleSystemMessage("No peers connected in this room");
      return false;
    }

    for (const peer of peers) {
      try {
        peer.write(JSON.stringify(message));
      } catch (err) {
        handleSystemMessage(`Error sending message: ${err.message}`);
      }
    }

    return true;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Destroy all swarms
      for (const [topic, swarm] of swarmsRef.current.entries()) {
        try {
          swarm.destroy().catch(err => {
            console.error(`Error destroying swarm for ${topic}: ${err.message}`);
          });
        } catch (err) {
          console.error(`Error in cleanup for ${topic}: ${err.message}`);
        }
      }
    };
  }, []);

  return {
    swarms: swarmsRef.current,
    currentRoom,
    isConnected,
    peerCount,
    createRoom,
    joinRoom,
    leaveRoom,
    sendToCurrentRoom,
    getRoomPeerCount: updatePeerCount
  };
}
