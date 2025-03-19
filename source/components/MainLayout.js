import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp, useFocus } from 'ink';
import StatusBar from './StatusBar.js';
import ChatArea from './ChatArea.js';
import RoomManager from './RoomManager.js';
import CommandMenu from './CommandMenu.js';
import OnlineUsers from './OnlineUsers.js';
import TransferStatus from './TransferStatus.js';
import { useFocusManager, FOCUS_AREAS } from '../hooks/useFocusManager.js';
import { useSwarmContext } from '../hooks/useSwarm.js';
import { useFileTransferContext } from '../hooks/useFileTransfer.js';
import { useMessageContext } from '../hooks/useMessages.js';
import { formatBytes, expandPath, copyToClipboard } from '../utils/index.js';
import crypto from 'crypto';
import b4a from 'b4a';

const MainLayout = ({ initialUsername, setUsername, initialTopic }) => {
  const { exit } = useApp();

  // Initialize focus management
  const focusManager = useFocusManager(FOCUS_AREAS.CHAT_INPUT);
  const { focusedArea, showMenu, showRooms } = focusManager;

  // UI state
  const [activeView, setActiveView] = useState('chat'); // chat, nick, share, join, newroom
  const [tempInput, setTempInput] = useState('');

  // Room state
  const [rooms, setRooms] = useState([]);
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  // Focus objects
  const inputFocus = useFocus({ autoFocus: true });
  const menuFocus = useFocus();

  // Get context data
  const {
    messagesVersion,
    addUserMessage,
    addSystemMessage,
    getRoomMessages,
    clearRoomMessages,
  } = useMessageContext();

  const {
    swarms,
    currentRoom,
    peerCount,
    createRoom,
    joinRoom,
    leaveRoom,
    sendToCurrentRoom,
    getRoomPeerCount,
    onlineUsers
  } = useSwarmContext();

  const {
    transfers,
    transfersVersion,
    shareFile,
    acceptFileTransfer
  } = useFileTransferContext();

  // Add a room to the list
  const addRoom = useCallback((roomData) => {
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
  }, [rooms]);

  // Handle switching rooms
  const handleRoomSelect = useCallback((index) => {
    if (index >= 0 && index < rooms.length) {
      const selectedRoom = rooms[index];
      setActiveRoomIndex(index);
      joinRoom(selectedRoom);

      // Return focus to input after room selection
      setTimeout(() => {
        focusManager.changeFocus(FOCUS_AREAS.CHAT_INPUT);
        inputFocus.focus();
      }, 100);
    }
  }, [rooms, joinRoom, focusManager, inputFocus]);

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
          // Create a default room if no initial topic
          const newRoom = createRoom("Main Room");
          if (newRoom) {
            roomToJoin = newRoom;
          } else {
            return;
          }
        }

        // Join the room
        const joined = await joinRoom(roomToJoin);

        if (joined) {
          // Add to room list
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
  }, []);

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
  }, [currentRoom, initialTopic, rooms, addRoom]);

  // Generate an invitation code for the current room
  const generateInviteCode = useCallback(() => {
    try {
      // Check if we have access to room information
      if (!currentRoom) {
        addSystemMessage("", "You're not in a room yet.");
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
      addSystemMessage(currentRoom?.topic || "", `Error generating invite: ${err.message}`);
      return null;
    }
  }, [currentRoom, addSystemMessage, copyToClipboard]);

  // Join a room from invitation code
  const joinRoomFromInvite = useCallback((inviteCode) => {
    try {
      if (!inviteCode || typeof inviteCode !== 'string') {
        addSystemMessage("", "Invalid invitation code format");
        return false;
      }

      let roomData;
      try {
        const decoded = Buffer.from(inviteCode, 'base64').toString();
        roomData = JSON.parse(decoded);
      } catch (e) {
        addSystemMessage("", `Could not parse invitation code: ${e.message}`);
        return false;
      }

      if (!roomData || typeof roomData !== 'object') {
        addSystemMessage("", "Invalid invitation data format");
        return false;
      }

      if (!roomData.topic || typeof roomData.topic !== 'string') {
        addSystemMessage("", "Invitation missing valid topic");
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
  }, [addRoom, addSystemMessage, joinRoom]);

  // Handle commands
  const handleCommand = useCallback((command, args) => {
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
        addSystemMessage("", '/rooms - Toggle room drawer');
        addSystemMessage("", '/focus [area] - Focus a specific area (rooms, input, users)');
        addSystemMessage("", '/tab - Cycle focus through components');
        break;

      case 'clear':
        clearRoomMessages(currentRoom?.topic);
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
        if (currentRoom && swarms && swarms.has(currentRoom.topic)) {
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
        if (!transfers || transfers.size === 0) {
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

      case 'rooms':
        // Toggle room drawer
        focusManager.setShowRooms(!showRooms);
        addSystemMessage("", `Room drawer ${showRooms ? 'hidden' : 'shown'}`);
        break;

      case 'focus':
        // Focus a specific area
        if (args.length > 0) {
          const area = args[0].toLowerCase();
          if (area === 'rooms' || area === 'room') {
            focusManager.changeFocus(FOCUS_AREAS.ROOMS);
            focusManager.setShowRooms(true);
            addSystemMessage("", `Room drawer focused. Use arrows to navigate, Enter to select.`);
          } else if (area === 'input' || area === 'chat') {
            focusManager.changeFocus(FOCUS_AREAS.CHAT_INPUT);
            inputFocus.focus();
            addSystemMessage("", `Chat input focused.`);
          } else if (area === 'users' || area === 'user') {
            focusManager.changeFocus(FOCUS_AREAS.USERS);
            focusManager.setShowMenu(false);
            addSystemMessage("", `Users panel focused.`);
          } else if (area === 'menu') {
            focusManager.changeFocus(FOCUS_AREAS.MENU);
            focusManager.setShowMenu(true);
            menuFocus.focus();
            addSystemMessage("", `Menu focused. Use arrows to navigate, Enter to select.`);
          } else {
            addSystemMessage("", `Unknown area "${area}". Try: rooms, input, users, menu`);
          }
        } else {
          // Default to rooms if no area specified
          focusManager.changeFocus(FOCUS_AREAS.ROOMS);
          focusManager.setShowRooms(true);
          addSystemMessage("", `Room drawer focused. Use arrows to navigate, Enter to select.`);
        }
        break;

      case 'tab':
        // Cycle focus
        focusManager.cycleFocus();
        addSystemMessage("", `Focused: ${focusManager.focusedArea}`);
        break;

      default:
        addSystemMessage("", `Unknown command: ${command}`);
        addSystemMessage("", `Type /help to see available commands`);
    }
  }, [
    currentRoom, addSystemMessage, clearRoomMessages, leaveRoom, exit,
    setUsername, shareFile, acceptFileTransfer, peerCount, swarms, transfers,
    copyToClipboard, generateInviteCode, joinRoomFromInvite, createRoom,
    addRoom, focusManager, showRooms, inputFocus, menuFocus
  ]);

  // Handle menu selection
  const handleMenuSelect = useCallback(({ value }) => {
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
        clearRoomMessages(currentRoom?.topic);
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
    focusManager.setShowMenu(false);
    focusManager.changeFocus(FOCUS_AREAS.CHAT_INPUT);
    inputFocus.focus();
  }, [
    handleCommand, clearRoomMessages, currentRoom, generateInviteCode,
    exit, focusManager, inputFocus
  ]);

  // Handle chat submission
  const handleChatSubmit = useCallback((message) => {
    if (!message.trim()) return;

    // Handle commands
    if (message.startsWith('/')) {
      const parts = message.slice(1).split(' ');
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      try {
        handleCommand(command, args);
      } catch (err) {
        console.error(`Error handling command: ${err.message}`);
        addSystemMessage("", `Error executing command: ${err.message}`);
      }
      return;
    }

    // Send chat message
    if (!currentRoom) {
      addSystemMessage("", 'Not in any room.');
      return;
    }

    try {
      // Create the message object
      const chatMessage = {
        type: 'chat',
        username: initialUsername,
        text: message,
        timestamp: Date.now()
      };

      // First show own message in current room
      addUserMessage(currentRoom.topic, initialUsername, message, chatMessage.timestamp);

      // Force refresh peer count before sending
      if (currentRoom && currentRoom.topic) {
        getRoomPeerCount(currentRoom.topic);
      }

      // Try to send to peers
      const sendResult = sendToCurrentRoom(chatMessage);

      // Only show warning if sending failed AND there should be peers
      if (!sendResult && peerCount > 0) {
        addSystemMessage("", 'Failed to send message to peers.');
      }
    } catch (err) {
      console.error(`Error sending message: ${err.message}`);
      addSystemMessage("", `Failed to send message: ${err.message}`);
    }
  }, [
    handleCommand, currentRoom, addSystemMessage, addUserMessage,
    initialUsername, getRoomPeerCount, sendToCurrentRoom, peerCount
  ]);

  // Handle temp input submission
  const handleTempSubmit = useCallback((value) => {
    if (activeView === 'nick' && value) {
      setUsername(value);
      addSystemMessage("", `Username changed to ${value}`);
    } else if (activeView === 'share' && value) {
      shareFile(value);
    } else if (activeView === 'join' && value) {
      joinRoomFromInvite(value);
    } else if (activeView === 'newroom' && value) {
      handleCommand('room', [value]);
    }

    setActiveView('chat');
  }, [
    activeView, setUsername, addSystemMessage, shareFile,
    joinRoomFromInvite, handleCommand
  ]);

  // Configure keyboard navigation
  useInput((input, key) => {
    // Handle Tab key for focus cycling
    if (key.tab && !key.shift) {
      focusManager.cycleFocus();
      return;
    }

    // Handle Shift+Tab for reverse focus cycling
    if (key.tab && key.shift) {
      focusManager.cycleBackward();
      return;
    }

    // Handle ESC key
    if (key.escape) {
      if (activeView !== 'chat') {
        // Return to chat view if in a modal
        setActiveView('chat');
        setTempInput('');
      } else if (focusedArea === FOCUS_AREAS.ROOMS) {
        // If room drawer has focus, unfocus it and focus input
        focusManager.changeFocus(FOCUS_AREAS.CHAT_INPUT);
        inputFocus.focus();
      } else if (showMenu) {
        // Close menu if it's open
        focusManager.setShowMenu(false);
        focusManager.changeFocus(FOCUS_AREAS.CHAT_INPUT);
        inputFocus.focus();
      } else {
        // Toggle menu visibility
        const newMenuState = focusManager.toggleMenu();
        if (newMenuState) {
          menuFocus.focus();
        } else {
          inputFocus.focus();
        }
      }
    }

    // Focus the room drawer with Ctrl+R
    if (key.ctrl && input === 'r') {
      focusManager.changeFocus(FOCUS_AREAS.ROOMS);
      focusManager.setShowRooms(true);
    }

    // Focus the room drawer with Shift+C (custom shortcut)
    if (key.shift && input === 'C') {
      focusManager.changeFocus(FOCUS_AREAS.ROOMS);
      focusManager.setShowRooms(true);
    }

    // Room navigation when focused
    if (focusedArea === FOCUS_AREAS.ROOMS) {
      if (key.upArrow) {
        // Circular navigation - go to the last item when at the first
        if (activeRoomIndex <= 0) {
          setActiveRoomIndex(rooms.length - 1);
        } else {
          setActiveRoomIndex(activeRoomIndex - 1);
        }
      }

      if (key.downArrow) {
        // Circular navigation - go to the first item when at the last
        if (activeRoomIndex >= rooms.length - 1) {
          setActiveRoomIndex(0);
        } else {
          setActiveRoomIndex(activeRoomIndex + 1);
        }
      }

      // Select room on Enter
      if (key.return) {
        handleRoomSelect(activeRoomIndex);
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      width="100%"
      height="100%"
      padding={0}
    >
      <StatusBar
        peerCount={peerCount}
        username={initialUsername}
        room={currentRoom?.name || "Not connected"}
      />

      <Box
        flexDirection="row"
        flex={1}
        minHeight={process.stdout.rows - 7} // Use terminal rows minus space for header/footer
      >
        {showRooms && (
          <RoomManager
            rooms={rooms}
            activeRoomIndex={activeRoomIndex}
            onRoomSelect={handleRoomSelect}
            isFocused={focusedArea === FOCUS_AREAS.ROOMS}
          />
        )}

        <Box
          flexDirection="column"
          flex={1}
          width={"100%"}
          height="100%"
        >
          <ChatArea
            activeView={activeView}
            focusedArea={focusedArea}
            messages={getRoomMessages(currentRoom?.topic)}
            messagesVersion={messagesVersion}
            input={tempInput}
            setInput={setTempInput}
            onSubmit={handleChatSubmit}
            onTempSubmit={handleTempSubmit}
            onCommandSubmit={handleCommand}
            isFocused={focusedArea === FOCUS_AREAS.CHAT_INPUT}
          />
        </Box>

        {showMenu ? (
          <Box
            flexDirection="column"
            width="25%"
            height="100%"
            marginLeft={1}
          >
            <CommandMenu
              onSelect={handleMenuSelect}
              isFocused={focusedArea === FOCUS_AREAS.MENU}
            />
            <TransferStatus transfers={transfers} version={transfersVersion} />
          </Box>
        ) : (
          <Box
            flexDirection="column"
            width="25%"
            height="100%"
            marginLeft={1}
          >
            <OnlineUsers
              users={onlineUsers}
              isFocused={focusedArea === FOCUS_AREAS.USERS}
            />
          </Box>
        )}
      </Box>

      <Box padding={1} borderStyle="single" borderColor="gray">
        <Text color="gray">Tab/Shift+Tab: Cycle Focus | ESC: Menu | Ctrl+R: Focus Rooms | ↑/↓: Navigate | Enter: Select</Text>
      </Box>
    </Box>
  );
};

export default MainLayout;
