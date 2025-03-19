import React, { useRef, useEffect, memo } from 'react';
import { Box, Text } from 'ink';

// Individual Message Component - Memoize for performance
const Message = memo(({ message }) => {
  const { username, text, system, timestamp } = message;

  // Format timestamp if it exists
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  if (system) {
    return (
      <Box>
        {timestamp && <Text color="gray">[{formattedTime}] </Text>}
        <Text color="yellow">[i] {text}</Text>
      </Box>
    );
  }

  return (
    <Box>
      {timestamp && <Text color="gray">[{formattedTime}] </Text>}
      <Text color="blue">{username}: </Text>
      <Text>{text}</Text>
    </Box>
  );
});

// Chat Messages Component
const ChatMessages = ({ messages, version }) => {
  // Use this ref to track the last messages length
  const prevMessagesLengthRef = useRef(0);
  const messagesEndRef = useRef(null);

  // Auto-scroll effect - improved to only scroll on new messages
  useEffect(() => {
    // Only auto-scroll if new messages were added
    if (messages.length > prevMessagesLengthRef.current) {
      // In a real Ink app, we'd scroll to the bottom
      // This is a placeholder for the actual implementation
      // which depends on the specific terminal library being used
      if (messagesEndRef.current) {
        // Ink doesn't have direct scroll control, but in a real app:
        // messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Update the previous length reference
    prevMessagesLengthRef.current = messages.length;
  }, [messages, version]);

  // Add an empty message if there are no messages to ensure the box has content
  const displayMessages = messages.length === 0
    ? [{ system: true, text: 'No messages yet. Type something to start chatting!' }]
    : messages;

  return (
    <Box
      flexDirection="column"
      height="100%"
      borderStyle="single"
      borderColor="blue"
      padding={1}
      overflowY="scroll"
    >
      {displayMessages.map((msg, index) => (
        <Message key={`msg-${index}-${msg.timestamp || 0}`} message={msg} />
      ))}
      <Box ref={messagesEndRef} />
    </Box>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(ChatMessages);
