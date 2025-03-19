import React, { createContext, useContext, useState, useRef } from 'react';

// Create Message context
const MessageContext = createContext(null);

// Maximum number of messages to keep per room
const MAX_MESSAGES = 1000;

// Custom hook to use the context
export function useMessageContext() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessageContext must be used within a MessageProvider');
  }
  return context;
}

// Provider component
export function MessageProvider({ children }) {
  // Message storage - map of room topic to messages array
  const roomMessagesRef = useRef(new Map());

  // State to trigger UI updates when messages change
  const [messagesVersion, setMessagesVersion] = useState(0);

  // Add a message to a room
  const addMessage = (roomTopic, message) => {
    if (!roomTopic) {
      // console.error('Cannot add message - room topic is missing');
      return false;
    }

    try {
      // Get existing messages or initialize empty array
      const messages = roomMessagesRef.current.get(roomTopic) || [];

      // Add the new message
      const newMessages = [...messages, message];

      // Limit the number of messages and update the ref
      roomMessagesRef.current.set(roomTopic, newMessages.slice(-MAX_MESSAGES));

      // Trigger UI update
      setMessagesVersion(prev => prev + 1);

      // console.log(`Message added to room ${roomTopic}, total: ${newMessages.length}, version: ${messagesVersion + 1}`);
      return true;
    } catch (err) {
      console.error(`Error adding message to room ${roomTopic}:`, err);
      return false;
    }
  };

  // Add a user message
  const addUserMessage = (roomTopic, username, text, timestamp = Date.now()) => {
    return addMessage(roomTopic, { username, text, timestamp });
  };

  // Add a system message
  const addSystemMessage = (roomTopic, text, timestamp = Date.now()) => {
    return addMessage(roomTopic, { system: true, text, timestamp });
  };

  // Get messages for a specific room
  const getRoomMessages = (roomTopic) => {
    if (!roomTopic) return [];
    return roomMessagesRef.current.get(roomTopic) || [];
  };

  // Clear messages for a room
  const clearRoomMessages = (roomTopic) => {
    if (!roomTopic) return false;

    roomMessagesRef.current.set(roomTopic, [{
      system: true,
      text: "Chat history cleared",
      timestamp: Date.now()
    }]);

    // Trigger UI update
    setMessagesVersion(prev => prev + 1);
    return true;
  };

  // The context value
  const value = {
    messagesVersion,
    addUserMessage,
    addSystemMessage,
    getRoomMessages,
    clearRoomMessages
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}
