import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

const RoomDrawer = ({
  rooms = [],
  activeRoomIndex = 0,
  onRoomSelect,
  isFocused = false,
  width = "20%"
}) => {
  const [selectedIndex, setSelectedIndex] = useState(activeRoomIndex);

  // Update selected index when active room changes externally
  useEffect(() => {
    setSelectedIndex(activeRoomIndex);
  }, [activeRoomIndex]);

  // Handle keyboard navigation
  useInput((input, key) => {
    if (!isFocused) return;

    // Use arrow keys to navigate rooms
    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }

    if (key.downArrow && selectedIndex < rooms.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }

    // Use Enter to select a room
    if (key.return && onRoomSelect) {
      onRoomSelect(selectedIndex);
    }
  });

  return (
    <Box
      width={width}
      height="100%"
      borderStyle="single"
      borderColor={isFocused ? "green" : "cyan"}
      flexDirection="column"
      marginRight={1}
    >
      <Box padding={1} backgroundColor="blue">
        <Text bold color="white">Rooms {isFocused ? "(Active)" : ""}</Text>
      </Box>

      {rooms.length === 0 ? (
        <Box padding={1} flexDirection="column">
          <Text color="gray">No rooms yet.</Text>
          <Text color="gray">Create one via menu</Text>
        </Box>
      ) : (
        <Box flexDirection="column" overflowY="scroll" flexGrow={1}>
          {rooms.map((room, index) => (
            <Box
              key={index}
              padding={1}
              backgroundColor={index === selectedIndex ? (isFocused ? "green" : "cyan") : undefined}
            >
              <Text color={index === selectedIndex ? "black" : "white"}>
                {room.name || `Room ${index + 1}`}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {isFocused && (
        <Box marginTop={1} padding={1} flexDirection="column" borderStyle="single" borderColor="gray">
          <Text dim>↑/↓: Navigate</Text>
          <Text dim>Enter: Select</Text>
        </Box>
      )}
    </Box>
  );
};

export default RoomDrawer;
