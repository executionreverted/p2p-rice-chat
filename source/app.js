import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput, useApp, useFocus, useFocusManager } from 'ink';
import Hyperswarm from 'hyperswarm';
import b4a from 'b4a';
import crypto from 'crypto';

import StatusBar from './components/StatusBar.js';
import ChatMessages from './components/ChatMessages.js';
import InputArea from './components/InputArea.js';
import CommandMenu from './components/CommandMenu.js';
import TransferStatus from './components/TransferStatus.js';
import { formatBytes, expandPath } from './utils/index.js';
import { useSwarm } from './hooks/useSwarm.js';
import { useFileTransfer } from './hooks/useFileTransfer.js';

const App = ({ initialUsername, initialTopic }) => {
  const { exit } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [username, setUsername] = useState(initialUsername || process.env.USER || 'anonymous');
  const [activeView, setActiveView] = useState('chat'); // chat, nick, share, help
  const [tempInput, setTempInput] = useState('');
  const [focusedInput, setFocusedInput] = useState(true); // true = input, false = menu

  const { focusNext, focusPrevious } = useFocusManager();
  const inputFocus = useFocus({ autoFocus: true });
  const menuFocus = useFocus();

  // Maximum number of messages to keep
  const MAX_MESSAGES = 1000;

  // Initialize swarm and connection handlers
  const {
    swarm,
    isConnected,
    peerCount,
    roomTopic,
    sendToAllPeers
  } = useSwarm({
    initialTopic,
    username,
    onMessage: handleIncomingMessage,
    onSystem: handleSystemMessage
  });

  // Initialize file transfer system
  const {
    transfers,
    shareFile,
    handleFileShareOffer
  } = useFileTransfer({
    swarm,
    username,
    onMessage: handleSystemMessage
  });

  // Add a message to the chat
  function handleSystemMessage(text) {
    setMessages(prev => {
      const newMessages = [...prev, { system: true, text }];
      // Limit the number of messages
      return newMessages.slice(-MAX_MESSAGES);
    });
  }

  // Handle incoming messages
  function handleIncomingMessage(username, text) {
    setMessages(prev => {
      const newMessages = [...prev, { username, text }];
      // Limit the number of messages
      return newMessages.slice(-MAX_MESSAGES);
    });
  }

  // Clear all messages
  const clearMessages = () => {
    setMessages([]);
    handleSystemMessage("Chat history cleared");
  }

  // Handle user input for chat
  const handleChatInput = (value) => {
    setInput(value);
  };

  // Handle input submission
  const handleSubmit = async () => {
    if (!input.trim()) return;

    // Handle commands
    if (input.startsWith('/')) {
      const [command, ...args] = input.slice(1).split(' ');
      await handleCommand(command.toLowerCase(), args);
    }
    // Send chat message
    else {
      if (peerCount === 0) {
        handleSystemMessage('No peers connected. Your message wasn\'t sent to anyone.');
      } else {
        sendToAllPeers({
          type: 'chat',
          username: username,
          text: input,
          timestamp: Date.now()
        });

        // Show own message
        handleIncomingMessage(username, input);
      }
    }

    setInput('');
  };

  // Handle commands
  const handleCommand = async (command, args) => {
    switch (command) {
      case 'help':
        handleSystemMessage('Available commands:');
        handleSystemMessage('/help - Show commands');
        handleSystemMessage('/exit - Exit chat');
        handleSystemMessage('/nick <n> - Change username');
        handleSystemMessage('/share <file> - Share a file');
        handleSystemMessage('/peers - Show connected peers');
        handleSystemMessage('/transfers - Show active transfers');
        handleSystemMessage('/topic - Show room topic');
        handleSystemMessage('/clear - Clear chat history');
        break;

      case 'clear':
        clearMessages();
        break;

      case 'exit':
      case 'quit':
        exit();
        break;

      case 'nick':
      case 'name':
        if (args.length > 0) {
          setUsername(args[0]);
          handleSystemMessage(`Username changed to ${args[0]}`);
        } else {
          setActiveView('nick');
        }
        break;

      case 'share':
        if (args.length > 0) {
          shareFile(args.join(' '));
        } else {
          setActiveView('share');
        }
        break;

      case 'peers':
        handleSystemMessage(`Connected peers: ${peerCount}`);
        break;

      case 'transfers':
        if (transfers.size === 0) {
          handleSystemMessage('No active transfers');
        } else {
          handleSystemMessage('Active transfers:');
          for (const [id, transfer] of transfers.entries()) {
            const shortId = id.slice(0, 6);
            const progress = transfer.type === 'upload'
              ? Math.round((transfer.sentChunks / transfer.totalChunks) * 100)
              : Math.round((transfer.receivedChunks / transfer.totalChunks) * 100);

            handleSystemMessage(`${shortId} - ${transfer.type === 'upload' ? 'Upload' : 'Download'}: ${transfer.filename} (${progress}%)`);
          }
        }
        break;

      case 'topic':
        handleSystemMessage(`Room topic: ${roomTopic}`);
        break;

      default:
        handleSystemMessage(`Unknown command: ${command}`);
    }
  };

  // Handle menu selection
  const handleMenuSelect = ({ value }) => {
    switch (value) {
      case 'help':
        handleCommand('help', []);
        break;
      case 'nick':
        setActiveView('nick');
        break;
      case 'share':
        setActiveView('share');
        break;
      case 'peers':
        handleCommand('peers', []);
        break;
      case 'transfers':
        handleCommand('transfers', []);
        break;
      case 'clear':
        clearMessages();
        break;
      case 'exit':
        exit();
        break;
    }

    // Switch focus back to input after selection
    setFocusedInput(true);
    inputFocus.focus();
  };

  // Handle temp input for modals
  const handleTempSubmit = () => {
    if (activeView === 'nick' && tempInput) {
      setUsername(tempInput);
      handleSystemMessage(`Username changed to ${tempInput}`);
    } else if (activeView === 'share' && tempInput) {
      shareFile(tempInput);
    }

    setTempInput('');
    setActiveView('chat');
  };

  // Configure keyboard navigation
  useInput((input, key) => {
    // Handle ESC key
    if (key.escape) {
      if (activeView !== 'chat') {
        // Return to chat view if in a modal
        setActiveView('chat');
        setTempInput('');
      } else if (focusedInput) {
        // Switch focus to menu when ESC is pressed in input area
        setFocusedInput(false);
        menuFocus.focus();
      }
    }

    // Handle Tab key for navigation between input and menu
    if (key.tab) {
      setFocusedInput(!focusedInput);
      if (focusedInput) {
        menuFocus.focus();
      } else {
        inputFocus.focus();
      }
    }
  });

  // Render different views
  const renderActiveView = () => {
    switch (activeView) {
      case 'nick':
        return (
          <Box flexDirection="column" borderStyle="single" padding={1}>
            <Text>Enter new username:</Text>
            <InputArea
              value={tempInput}
              onChange={setTempInput}
              onSubmit={handleTempSubmit}
              isFocused={true}
            />
          </Box>
        );

      case 'share':
        return (
          <Box flexDirection="column" borderStyle="single" padding={1}>
            <Text>Enter file path to share:</Text>
            <InputArea
              value={tempInput}
              onChange={setTempInput}
              onSubmit={handleTempSubmit}
              isFocused={true}
            />
          </Box>
        );

      case 'chat':
      default:
        return (
          <InputArea
            value={input}
            onChange={handleChatInput}
            onSubmit={handleSubmit}
            placeholder="Type a message or /command..."
            isFocused={inputFocus.isFocused}
          />
        );
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text backgroundColor="blue" color="white" bold> HyperChat - P2P Chat with File Sharing </Text>
      </Box>

      <StatusBar peerCount={peerCount} username={username} room={roomTopic} />

      <Box flexDirection="row" marginY={1}>
        <Box flexDirection="column" width="70%">
          <ChatMessages messages={messages} />
          {renderActiveView()}
        </Box>

        <Box flexDirection="column" width="30%" marginLeft={1}>
          <CommandMenu onSelect={handleMenuSelect} />
          <TransferStatus transfers={transfers} />
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color="gray">Press Tab to navigate, Esc to cancel, Enter to submit</Text>
      </Box>
    </Box>
  );
};

export default App;
