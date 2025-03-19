// components/ChatMessages.js
import React, { useRef, useEffect, memo, useMemo } from 'react';
import { Box, Text } from 'ink';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout.js';

// Individual Message Component - Memoize for performance
const Message = memo(({ message, layout }) => {
  const { username, text, system, timestamp } = message;
  const { compact, miniMode, showTimestamps } = layout;

  // Format timestamp if it exists and should be shown
  const formattedTime = useMemo(() => {
    if (!(timestamp && showTimestamps)) return '';

    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: !compact ? '2-digit' : undefined
    });
  }, [timestamp, showTimestamps, compact]);

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
  const displayName = useMemo(() => {
    if (!username) return '';
    return compact && username.length > 8 ? `${username.slice(0, 7)}…` : username;
  }, [username, compact]);

  return (
    <Box>
      {showTimestamps && <Text color="gray">[{formattedTime}] </Text>}
      <Text color="blue">{displayName}: </Text>
      <Text>{text}</Text>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  // Only re-render if message content or relevant layout properties change
  return (
    prevProps.message === nextProps.message &&
    prevProps.layout.compact === nextProps.layout.compact &&
    prevProps.layout.miniMode === nextProps.layout.miniMode &&
    prevProps.layout.showTimestamps === nextProps.layout.showTimestamps
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
  }, [messages.length, version]);

  // Memoize the message preparation logic
  const visibleMessages = useMemo(() => {
    // Add an empty message if there are no messages
    const displayMessages = messages.length === 0
      ? [{ system: true, text: 'No messages yet. Type something to start chatting!' }]
      : messages;

    // In mini mode, show fewer messages
    return layout.miniMode
      ? displayMessages.slice(-5)
      : displayMessages;
  }, [messages, layout.miniMode]);

  // Use virtualization to only render visible messages
  // For terminal apps, we can approximate this by limiting the number of rendered messages
  const renderCount = layout.miniMode ? 5 : Math.min(Math.floor(layout.rows * 0.75), 50);
  const messagesToRender = useMemo(() => {
    return visibleMessages.slice(-renderCount);
  }, [visibleMessages, renderCount]);

  return (
    <Box
      flexDirection="column"
      height="100%"
      borderStyle="single"
      borderColor="blue"
      padding={layout.compact ? 0 : 1}
      overflowY="scroll"
    >
      {messagesToRender.map((msg, index) => (
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
