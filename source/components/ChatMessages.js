import React, { useRef, useEffect } from 'react';
import { Box, Text, Spacer } from 'ink';

// Individual Message Component
const Message = ({ message }) => {
  const { username, text, system } = message;

  if (system) {
    return <Text color="yellow">[i] {text}</Text>;
  }

  return (
    <Box>
      <Text color="blue">{username}: </Text>
      <Text>{text}</Text>
    </Box>
  );
};

// Chat Messages Component
const ChatMessages = ({ messages }) => {
  // Use this ref to help determine when to scroll
  const messagesEndRef = useRef(null);

  // Auto-scroll function
  useEffect(() => {
    // In a real Ink app, we'd use the messagesEndRef to scroll
    // For now, we're relying on Ink's built-in scrolling behavior
  }, [messages]);

  return (
    <Box
      flexDirection="column"
      height={15}
      borderStyle="single"
      borderColor="blue"
      padding={1}
      overflowY="scroll"
    >
      {messages.length === 0 ? (
        <Text color="gray">No messages yet. Type something to start chatting!</Text>
      ) : (
        messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))
      )}
      <Box ref={messagesEndRef} />
    </Box>
  );
};

export default ChatMessages;
