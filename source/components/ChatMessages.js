// components/ChatMessages.js
import React, { useRef, useEffect, memo } from 'react';
import { Box, Text } from 'ink';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout.js';

// Individual Message Component - Memoize for performance
const Message = memo(({ message, layout }) => {
  const { username, text, system, timestamp } = message;
  const { compact, miniMode, showTimestamps } = layout;

  // Format timestamp if it exists and should be shown
  const formattedTime = (timestamp && showTimestamps)
    ? new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: !compact ? '2-digit' : undefined
    })
    : '';

  // For mini mode, render extremely compact messages
  if (miniMode) {
    if (system) {
      return <Text color="yellow">{text}</Text>;
    }
    const shortName = username ? `${username.slice(0, 5)}` : '?';
    return <Text>{shortName}: {text}</Text>;
  }

  // Normal system message
  if (system) {
    return (
      <Box>
        {showTimestamps && <Text color="gray">[{formattedTime}] </Text>}
        <Text color="yellow">[i] {text}</Text>
      </Box>
    );
  }

  // Normal user message
  const displayName = compact && username?.length > 8
    ? `${username.slice(0, 7)}…`
    : username;

  return (
    <Box>
      {showTimestamps && <Text color="gray">[{formattedTime}] </Text>}
      <Text color="blue">{displayName}: </Text>
      <Text>{text}</Text>
    </Box>
  );
});

// Chat Messages Component
const ChatMessages = memo(({ messages, version }) => {
  // Get responsive layout
  const layout = useResponsiveLayout();

  // Use this ref to track the last messages length
  const prevMessagesLengthRef = useRef(0);
  const messagesEndRef = useRef(null);

  // Auto-scroll effect - improved to only scroll on new messages
  useEffect(() => {
    // Only auto-scroll if new messages were added
    if (messages.length > prevMessagesLengthRef.current) {
      // In a real Ink app, we'd scroll to the bottom
      if (messagesEndRef.current) {
        // Ink doesn't have direct scroll control, but in a real app:
        // messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Update the previous length reference
    prevMessagesLengthRef.current = messages.length;
  }, [messages, version]);

  // Add an empty message if there are no messages
  const displayMessages = messages.length === 0
    ? [{ system: true, text: 'No messages yet. Type something to start chatting!' }]
    : messages;

  // In mini mode, show fewer messages
  const visibleMessages = layout.miniMode
    ? displayMessages.slice(-5)
    : displayMessages;

  return (
    <Box
      flexDirection="column"
      height="100%"
      borderStyle="single"
      borderColor="blue"
      padding={layout.compact ? 0 : 1}
      overflowY="scroll"
    >
      {visibleMessages.map((msg, index) => (
        <Message
          key={`msg-${index}-${msg.timestamp || 0}`}
          message={msg}
          layout={layout}
        />
      ))}
      <Box ref={messagesEndRef} />
    </Box>
  );
});

// Use memo to prevent unnecessary re-renders
export default ChatMessages;

