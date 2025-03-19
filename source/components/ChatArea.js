import React, { useState, useCallback } from 'react';
import { Box } from 'ink';
import ChatMessages from './ChatMessages.js';
import InputArea from './InputArea.js';

/**
 * ChatArea Component
 * Manages the chat messages display and input area
 */
const ChatArea = ({
  activeView,
  focusedArea,
  messages,
  messagesVersion,
  input = '',
  setInput,
  onSubmit,
  onTempSubmit,
  onCommandSubmit,
  isFocused,
  layout
}) => {
  // Local state for chat input (separate from temp input)
  const [chatInput, setChatInput] = useState('');

  // Handle chat input change
  const handleChatInputChange = useCallback((value) => {
    setChatInput(value);
  }, []);

  // Handle chat submission
  const handleChatSubmit = useCallback(() => {
    const trimmedInput = chatInput.trim();
    if (!trimmedInput) return;
    onSubmit(trimmedInput);
    setChatInput('');
  }, [chatInput, onSubmit]);

  // Render active view (chat or modals)
  const renderActiveView = () => {
    switch (activeView) {
      case 'nick':
        return (
          <InputArea
            placeholder={"Enter new username:"}
            value={input}
            onChange={setInput}
            onSubmit={(value) => onTempSubmit(value)}
            isFocused={true}
          />
        );
      case 'share':
        return (
          <InputArea
            placeholder={"Enter file path to share:"}
            value={input}
            onChange={setInput}
            onSubmit={(value) => onTempSubmit(value)}
            isFocused={true}
          />
        );
      case 'join':
        return (
          <InputArea
            placeholder={"Enter invitation code:"}
            value={input}
            onChange={setInput}
            onSubmit={(value) => onTempSubmit(value)}
            isFocused={true}
          />
        );
      case 'newroom':
        return (
          <InputArea
            placeholder={"Enter new room name"}
            value={input}
            onChange={setInput}
            onSubmit={(value) => onTempSubmit(value)}
            isFocused={true}
          />
        );
      case 'chat':
      default:
        return (
          <InputArea
            value={chatInput}
            onChange={handleChatInputChange}
            onSubmit={handleChatSubmit}
            placeholder="Type a message or /command..."
            isFocused={isFocused}
          />
        );
    }
  };

  return (
    <Box
      flexDirection="column"
      width="100%"
      height="100%"
    >
      <Box
        flexDirection="column"
        flex={1}
        width="100%"
      >
        <ChatMessages
          layout={layout}
          messages={messages}
          version={messagesVersion}
        />
      </Box>
      <Box
        width="100%"
      >
        {renderActiveView()}
      </Box>
    </Box>
  );
};

export default ChatArea;
