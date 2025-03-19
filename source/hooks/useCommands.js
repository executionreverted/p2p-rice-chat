import { useCallback } from 'react';
import { FOCUS_AREAS } from './useFocusManager.js';

export function useCommands({
  username,
  setUsername,
  currentRoom,
  addSystemMessage,
  clearRoomMessages,
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomPeerCount,
  peerCount,
  shareFile,
  acceptFileTransfer,
  transfers,
  swarms,
  copyToClipboard,
  setActiveView,
  setTempInput,
  generateInviteCode,
  joinRoomFromInvite,
  addRoom,
  focusManager,
  exit
}) {
  const handleCommand = useCallback((command, args) => {
    switch (command) {
      case 'help':
        addSystemMessage("", 'Available commands:');
        addSystemMessage("", '/help - Show commands');
        // ... (all help text)
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

      // ... (all other command handlers)

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
            addSystemMessage("", `Chat input focused.`);
          } else if (area === 'users' || area === 'user') {
            focusManager.changeFocus(FOCUS_AREAS.USERS);
            focusManager.setShowMenu(false);
            addSystemMessage("", `Users panel focused.`);
          } else if (area === 'menu') {
            focusManager.changeFocus(FOCUS_AREAS.MENU);
            focusManager.setShowMenu(true);
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
    username, setUsername, currentRoom, addSystemMessage, clearRoomMessages,
    createRoom, joinRoom, leaveRoom, getRoomPeerCount, peerCount,
    shareFile, acceptFileTransfer, transfers, swarms, copyToClipboard,
    setActiveView, setTempInput, generateInviteCode, joinRoomFromInvite,
    addRoom, focusManager, exit
  ]);

  return {
    handleCommand
  };
}
