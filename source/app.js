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
import { formatBytes, expandPath, copyToClipboard } from './utils/index.js';
import { useSwarmContext } from './hooks/useSwarm.js';
import { useFileTransfer } from './hooks/useFileTransfer.js';
import { useMessageContext } from './hooks/useMessages.js';

const App = ({ initialUsername, initialTopic }) => {
  const { exit } = useApp();

  const {
    messagesVersion,
    addUserMessage,
    addSystemMessage,
    getRoomMessages,
    clearRoomMessages,

  } = useMessageContext();


  // Core state
  const [username, setUsername] = useState(initialUsername || process.env.USER || 'anonymous');
  const [input, setInput] = useState('');
  const [activeView, setActiveView] = useState('chat'); // chat, nick, share, join, newroom
  const [tempInput, setTempInput] = useState('');


  // UI state
  const [focusedInput, setFocusedInput] = useState(true); // true = input, false = menu
  const [showMenu, setShowMenu] = useState(false); // Controls menu visibility
  const [showRooms, setShowRooms] = useState(true); // Controls room drawer visibility

  // Room management
  const [rooms, setRooms] = useState([]);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  // Focus management
  const { focusNext, focusPrevious } = useFocusManager();
  const inputFocus = useFocus({ autoFocus: true });
  const menuFocus = useFocus();

  // Maximum number of messages to keep per room

  // Maximum number of messages to keep per room
  const MAX_MESSAGES = 1000;


  // Initialize swarm with room management
  const {
    swarms,
    currentRoom,
    isConnected,
    peerCount,
    createRoom,
    joinRoom,
    leaveRoom,
    sendToCurrentRoom,
    getRoomPeerCount
  } = useSwarmContext({
    username,
  });

  // Initialize file transfer system
  const {
    transfers,
    transfersVersion,
    shareFile,
    handleFileShareOffer
  } = useFileTransfer(username);


  // Add a room to the list
  const addRoom = (roomData) => {
    if (!roomData || !roomData.topic) {
      return false;
    }

    const newRoom = {
      name: roomData.name || `Room ${roomData.topic.slice(0, 8)}`,
      description: roomData.description || "",
      topic: roomData.topic
    };

    // Check if room already exists
    const exists = rooms.some(room => room.topic === roomData.topic);

    if (!exists) {
      setRooms(prev => [...prev, newRoom]);
      // Set active index to the last item (new room)
      setActiveRoomIndex(rooms.length);
    } else {
      // Find and focus the existing room
      const roomIndex = rooms.findIndex(room => room.topic === roomData.topic);
      setActiveRoomIndex(roomIndex >= 0 ? roomIndex : 0);
    }

    return true;
  };

  // Handle switching rooms
  const handleRoomSelect = (index) => {
    if (index >= 0 && index < rooms.length) {
      const selectedRoom = rooms[index];
      joinRoom(selectedRoom);
      setActiveRoomIndex(index);
    }
  };

  // Effect to initialize with a default room
  useEffect(() => {
    const initRoom = async () => {
      try {
        let roomToJoin;

        if (initialTopic) {
          // Join existing room from initialTopic
          roomToJoin = {
            name: "Joined Room",
            description: "Room joined from topic",
            topic: initialTopic
          };
        } else {
          // Create a default room
          return
        }

        // Join the room
        const joined = await joinRoom(roomToJoin);

        if (joined) {
          // Add to room list and don't trigger another join in the second useEffect
          addRoom(roomToJoin);
        } else {
          addSystemMessage("", "Failed to join initial room. Creating a new one...");
          const newRoom = createRoom("Main Room");
          if (newRoom) {
            addRoom(newRoom);
          }
        }
      } catch (err) {
        addSystemMessage("", `Error initializing room: ${err.message}`);
      }
    };

    initRoom();
    // Add initialTopic to dependencies to ensure this only runs once when needed
  }, [initialTopic]);

  // Effect to update room list when currentRoom changes
  useEffect(() => {
    if (currentRoom) {
      // Check if the current room is already in our list
      const roomExists = rooms.some(room => room.topic === currentRoom.topic);

      if (!roomExists && currentRoom.topic !== initialTopic) {
        // Only add the room if it's not the initial room we already joined
        addRoom(currentRoom);
      }
    }
  }, [currentRoom, initialTopic]);

  // Generate an invitation code for the current room
  const generateInviteCode = () => {
    try {
      // Check if we have access to room information
      if (!currentRoom) {
        addSystemMessage(currentRoom.topic, "You're not in a room yet.");
        return null;
      }

      const roomData = {
        name: currentRoom.name || "HyperChat Room",
        description: currentRoom.description || "Join my chat room!",
        topic: currentRoom.topic
      };

      // Convert to base64
      const inviteCode = Buffer.from(JSON.stringify(roomData)).toString('base64');

      // Try to copy to clipboard
      copyToClipboard(inviteCode)
        .then(() => {
          addSystemMessage(currentRoom.topic, "✓ Invitation code copied to clipboard!");
        })
        .catch(err => {
          addSystemMessage(currentRoom.topic, `Couldn't copy to clipboard: ${err.message}`);
        });

      addSystemMessage(currentRoom.topic, "Share this invitation code:");
      addSystemMessage(currentRoom.topic, inviteCode);

      return inviteCode;
    } catch (err) {
      addSystemMessage(currentRoom.topic, `Error generating invite: ${err.message}`);
      return null;
    }
  };

  // Join a room from invitation code
  const joinRoomFromInvite = (inviteCode) => {
    try {
      if (!inviteCode || typeof inviteCode !== 'string') {
        addSystemMessage("", "Invalid invitation code format");
        return false;
      }

      let roomData;
      try {
        const decoded = Buffer.from(inviteCode, 'base64').toString();
        roomData = JSON.parse(decoded);
        console.log(roomData)
      } catch (e) {
        addSystemMessage(roomData.topic, `Could not parse invitation code: ${e.message}`);
        return false;
      }

      if (!roomData || typeof roomData !== 'object') {
        addSystemMessage("", "Invalid invitation data format");
        return false;
      }

      if (!roomData.topic || typeof roomData.topic !== 'string') {
        addSystemMessage(""
          , "Invitation missing valid topic");
        return false;
      }

      // Join the room
      const success = joinRoom(roomData);

      if (success) {
        // Add to rooms list
        addRoom(roomData);
        addSystemMessage(roomData.topic, `Joined room: ${roomData.name || roomData.topic.slice(0, 8)}`);
      }

      return success;
    } catch (err) {
      addSystemMessage("", `Error joining room: ${err.message}`);
      return false;
    }
  };

  // Handle user input for chat
  const handleChatInput = (value) => {
    setInput(value);
  };

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Handle commands
    if (trimmedInput.startsWith('/')) {
      const parts = trimmedInput.slice(1).split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      try {
        handleCommand(command, args);
      } catch (err) {
        console.error(`Error handling command: ${err.message}`);
        addSystemMessage("", `Error executing command: ${err.message}`);
      }
    }
    // Send chat message
    else {
      if (!currentRoom) {
        addSystemMessage("", 'Not in any room.');
        return;
      }

      try {
        // Create the message object
        const message = {
          type: 'chat',
          username: username,
          text: trimmedInput,
          timestamp: Date.now()
        };

        // First show own message in current room
        addUserMessage(currentRoom.topic, username, trimmedInput, message.timestamp);

        // Force refresh peer count before sending
        if (currentRoom && currentRoom.topic) {
          getRoomPeerCount(currentRoom.topic);
        }

        // Try to send to peers
        const sendResult = sendToCurrentRoom(message);

        // Only show warning if sending failed AND there should be peers
        if (!sendResult && peerCount > 0) {
          addSystemMessage("", 'Failed to send message to peers.');
        }
      } catch (err) {
        console.error(`Error sending message: ${err.message}`);
        addSystemMessage("", `Failed to send message: ${err.message}`);
      }
    }

    setInput('');
  };


  // Handle temp input for modals


  const handleTempSubmit = () => {
    if (activeView === 'nick' && tempInput) {
      setUsername(tempInput);
      addSystemMessage("", `Username changed to ${tempInput}`);
    } else if (activeView === 'share' && tempInput) {
      shareFile(tempInput);
    }

    setTempInput('');
    setActiveView('chat');
  };

  // Handle commands

  const handleCommand = (command, args) => {
    switch (command) {
      case 'help':
        addSystemMessage("", 'Available commands:');
        addSystemMessage("", '/help - Show commands');
        addSystemMessage("", '/exit - Exit chat');
        addSystemMessage("", '/nick <n> - Change username');
        addSystemMessage("", '/share <file> - Share a file');
        addSystemMessage("", '/accept <id> - Accept a file transfer');
        addSystemMessage("", '/peers - Show connected peers');
        addSystemMessage("", '/transfers - Show active transfers');
        addSystemMessage("", '/topic - Show room topic');
        addSystemMessage("", '/clear - Clear chat history');
        addSystemMessage("", '/invite - Generate and copy room invitation');
        addSystemMessage("", '/join <code> - Join room from invitation');
        addSystemMessage("", '/room <n> - Create a new room');
        break;

      case 'clear':
        clearMessages();
        break;

      case 'exit':
      case 'quit':
        // Perform cleanup before exiting
        try {
          if (currentRoom) {
            addSystemMessage(currentRoom.topic, `Leaving room before exit...`);
            leaveRoom(currentRoom.topic)
              .then(() => exit())
              .catch(err => {
                console.error(`Error leaving room: ${err.message}`);
                exit();
              });
          } else {
            exit();
          }
        } catch (err) {
          console.error(`Error during exit: ${err.message}`);
          exit();
        }
        break;

      case 'nick':
      case 'name':
        if (args.length > 0) {
          // Validate username
          const newName = args[0].trim();
          if (!newName) {
            addSystemMessage("", `Username cannot be empty`);
            return;
          }
          if (newName.length > 20) {
            addSystemMessage("", `Username too long (max 20 characters)`);
            return;
          }

          setUsername(newName);
          addSystemMessage("", `Username changed to ${newName}`);
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

      case 'accept':
        if (args.length > 0) {
          // Call the acceptFileTransfer function from useFileTransfer
          if (typeof acceptFileTransfer === 'function') {
            const transferId = args[0];
            const success = acceptFileTransfer(transferId);

            if (!success) {
              addSystemMessage("", `Failed to accept file transfer. Use /transfers to see available transfers.`);
            }
          } else {
            addSystemMessage("", `File transfer acceptance not available`);
          }
        } else {
          addSystemMessage("", `Usage: /accept <transfer-id>`);
          addSystemMessage("", `Use /transfers to see available transfers.`);
        }
        break;

      case 'peers':
        addSystemMessage("", `Connected peers: ${peerCount}`);

        // Add more detailed peer information if available
        if (currentRoom && swarms.has(currentRoom.topic)) {
          const roomSwarm = swarms.get(currentRoom.topic);
          if (roomSwarm.connections && roomSwarm.connections.size > 0) {
            addSystemMessage("", `Peer details:`);

            let index = 1;
            for (const peer of roomSwarm.connections) {
              try {
                const peerId = b4a.toString(peer.remotePublicKey, 'hex').slice(0, 8);
                addSystemMessage("", `${index}. Peer ${peerId}`);
                index++;
              } catch (err) {
                console.error(`Error getting peer details: ${err.message}`);
              }
            }
          }
        }
        break;

      case 'transfers':
        if (transfers.size === 0) {
          addSystemMessage("", 'No active transfers');
        } else {
          addSystemMessage("", 'Active transfers:');
          for (const [id, transfer] of transfers.entries()) {
            const shortId = id.slice(0, 6);
            const progress = transfer.type === 'upload'
              ? Math.round((transfer.sentChunks / transfer.totalChunks) * 100)
              : Math.round((transfer.receivedChunks / transfer.totalChunks) * 100);

            addSystemMessage("", `${shortId} - ${transfer.type === 'upload' ? 'Upload' : 'Download'}: ${transfer.filename} (${progress}%, ${transfer.status})`);
          }
        }
        break;

      case 'topic':
        if (currentRoom) {
          addSystemMessage("", `Room topic: ${currentRoom.topic}`);

          try {
            // Copy to clipboard
            copyToClipboard(currentRoom.topic)
              .then(() => {
                addSystemMessage("", `Topic copied to clipboard`);
              })
              .catch(err => {
                console.error(`Error copying to clipboard: ${err.message}`);
              });
          } catch (err) {
            console.error(`Error with topic command: ${err.message}`);
          }
        } else {
          addSystemMessage("", "Not in a room");
        }
        break;

      case 'invite':
        generateInviteCode();
        break;

      case 'join':
        if (args.length > 0) {
          try {
            joinRoomFromInvite(args[0]);
          } catch (err) {
            addSystemMessage("", `Error joining room: ${err.message}`);
          }
        } else {
          setActiveView('join');
        }
        break;

      case 'room':
        if (args.length > 0) {
          const roomName = args.join(' ');

          // Validate room name
          if (!roomName.trim()) {
            addSystemMessage("", `Room name cannot be empty`);
            return;
          }

          const newRoom = createRoom(roomName);

          if (newRoom) {
            // Add room to the list
            addRoom(newRoom);
            addSystemMessage("", `Created and joined room: ${roomName}`);
          }
        } else {
          setActiveView('newroom');
        }
        break;

      default:
        addSystemMessage("", `Unknown command: ${command}`);
        addSystemMessage("", `Type /help to see available commands`);
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
      case 'invite':
        generateInviteCode();
        break;
      case 'join':
        setActiveView('join');
        break;
      case 'room':
        setActiveView('newroom');
        break;
      case 'exit':
        exit();
        break;
    }

    // Close the menu and switch focus back to input
    setShowMenu(false);
    setFocusedInput(true);
    inputFocus.focus();
  };

  // Configure keyboard navigation
  useInput((input, key) => {
    // Handle ESC key
    if (key.escape) {
      if (activeView !== 'chat') {
        // Return to chat view if in a modal
        setActiveView('chat');
        setTempInput('');
      } else {
        // Toggle menu visibility
        setShowMenu(!showMenu);
        if (!showMenu) {
          setFocusedInput(false);
          menuFocus.focus();
        } else {
          setFocusedInput(true);
          inputFocus.focus();
        }
      }
    }

    // Handle Tab key for room drawer
    if (key.tab && key.shift) {
      setShowRooms(!showRooms);
    }

    // Use arrow keys to navigate rooms when drawer is open
    if (showRooms && key.upArrow && activeRoomIndex > 0) {
      setActiveRoomIndex(activeRoomIndex - 1);
    }

    if (showRooms && key.downArrow && activeRoomIndex < rooms.length - 1) {
      setActiveRoomIndex(activeRoomIndex + 1);
    }

    // Use Enter to select a room
    if (showRooms && key.return && !focusedInput) {
      handleRoomSelect(activeRoomIndex);
    }
  });

  // Render the room drawer
  const renderRoomDrawer = () => {
    if (!showRooms) return null;

    return (
      <Box
        width={20}
        height={15}
        borderStyle="single"
        borderColor="cyan"
        flexDirection="column"
        marginRight={1}
      >
        <Box padding={1} backgroundColor="blue">
          <Text bold color="white">Rooms</Text>
        </Box>

        {rooms.length === 0 ? (
          <Box padding={1} flexDirection="column">
            <Text color="gray">No rooms yet.</Text>
            <Text color="gray">Use /room to create one.</Text>
          </Box>
        ) : (
          rooms.map((room, index) => (
            <Box
              key={index}
              padding={1}
              backgroundColor={index === activeRoomIndex ? "cyan" : undefined}
            >
              <Text color={index === activeRoomIndex ? "black" : "white"}>
                {room.name || `Room ${index + 1}`}
              </Text>
            </Box>
          ))
        )}

        <Box marginTop={1} padding={1} flexDirection="column">
          <Text dim>↑/↓: Navigate</Text>
          <Text dim>Enter: Select</Text>
        </Box>
      </Box>
    );
  };

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

      case 'join':
        return (
          <Box flexDirection="column" borderStyle="single" padding={1}>
            <Text>Enter invitation code:</Text>
            <InputArea
              value={tempInput}
              onChange={setTempInput}
              onSubmit={(value) => {
                joinRoomFromInvite(value);
                setTempInput('');
                setActiveView('chat');
              }}
              isFocused={true}
            />
          </Box>
        );

      case 'newroom':
        return (
          <Box flexDirection="column" borderStyle="single" padding={1}>
            <Text>Enter room name:</Text>
            <InputArea
              value={tempInput}
              onChange={setTempInput}
              onSubmit={(value) => {
                handleCommand('room', [value]);
                setTempInput('');
                setActiveView('chat');
              }}
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
            isFocused={inputFocus.isFocused && !showMenu}
          />
        );
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text backgroundColor="blue" color="white" bold> HyperChat - P2P Chat with File Sharing </Text>
      </Box>

      <StatusBar
        peerCount={peerCount}
        username={username}
        room={currentRoom?.name || "Not connected"}
      />

      <Box flexDirection="row" marginY={1}>
        {renderRoomDrawer()}

        <Box flexDirection="column" width={showRooms ? "50%" : "70%"}>
          <ChatMessages messages={getRoomMessages(currentRoom?.topic)} version={messagesVersion} />
          {renderActiveView()}
        </Box>

        {showMenu && (
          <Box flexDirection="column" width="30%" marginLeft={1}>
            <CommandMenu onSelect={handleMenuSelect} isFocused={true} />
            <TransferStatus transfers={transfers} version={transfersVersion} />
          </Box>
        )}
      </Box>

      <Box marginTop={1}>
        <Text color="gray">ESC: Toggle Menu | Shift+Tab: Room Drawer | Enter: Submit</Text>
      </Box>
    </Box>
  );
};

export default App;
