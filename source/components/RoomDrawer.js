
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout.js';

const RoomDrawer = ({
  rooms = [],
  activeRoomIndex = 0,
  onRoomSelect,
  isFocused = false,
  width = 20,
  compact = false
}) => {
  const layout = useResponsiveLayout();
  const [selectedIndex, setSelectedIndex] = useState(activeRoomIndex);

  // Update selected index when active room changes externally
  useEffect(() => {
    setSelectedIndex(activeRoomIndex);
  }, [activeRoomIndex]);

  useInput((input, key) => {
    if (!isFocused || rooms.length === 0) return;

    // Use arrow keys to navigate rooms with circular navigation
    if (key.upArrow) {
      // When at the first item, go to the last item
      if (selectedIndex === 0) {
        setSelectedIndex(rooms.length - 1);
      } else {
        setSelectedIndex(selectedIndex - 1);
      }
    }

    if (key.downArrow) {
      // When at the last item, go back to the first item
      if (selectedIndex === rooms.length - 1) {
        setSelectedIndex(0);
      } else {
        setSelectedIndex(selectedIndex + 1);
      }
    }

    // Use Enter to select a room
    if (key.return && onRoomSelect) {
      onRoomSelect(selectedIndex);
    }

    const numberKey = parseInt(input);
    if (!isNaN(numberKey) && numberKey >= 1 && numberKey <= 9) {
      const roomIndex = numberKey - 1;
      if (roomIndex < rooms.length) {
        onRoomSelect(roomIndex);
      }
    }
  });

  const formatRoomName = (room, index) => {
    const name = room.name || `Room ${index + 1}`;

    // If it's a topic hash, show shorter version
    if (/^[0-9a-f]{64}$/i.test(name)) {
      return compact ? `${name.slice(0, 6)}...` : `${name.slice(0, 8)}...`;
    }

    // Truncate based on layout
    const maxLength = layout.compact ? 10 : layout.maxRoomNameLength;
    if (name.length > maxLength) {
      return `${name.slice(0, maxLength - 3)}...`;
    }

    return name;
  };

  return (
    <Box
      width={width}
      height="100%"
      borderStyle="single"
      borderColor={isFocused ? "green" : "cyan"}
      flexDirection="column"
    >
      <Box padding={compact ? 0 : 1} backgroundColor="blue">
        <Text bold color="white">Rooms {isFocused ? "(Active)" : ""}</Text>
      </Box>

      {rooms.length === 0 ? (
        <Box padding={compact ? 0 : 1} flexDirection="column">
          <Text color="gray">No rooms yet.</Text>
          <Text color="gray">Create one via menu</Text>
        </Box>
      ) : (
        <Box flexDirection="column" overflowY="scroll" flexGrow={1}>
          {rooms.map((room, index) => (
            <Box
              key={index}
              padding={compact ? 0 : 1}
              backgroundColor={index === selectedIndex ? (isFocused ? "green" : "cyan") : undefined}
            >
              <Text color={index === selectedIndex ? "black" : "white"}>
                {compact && index < 9 ? `${index + 1}:` : ""} {formatRoomName(room, index)}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      {isFocused && rooms.length > 0 && !compact && (
        <Box marginTop={1} padding={1} flexDirection="column" borderStyle="single" borderColor="gray">
          <Text dim>↑/↓: Navigate (Circular)</Text>
          <Text dim>Enter: Select</Text>
          {rooms.length > 1 && <Text dim>1-{Math.min(9, rooms.length)}: Quick Select</Text>}
        </Box>
      )}
    </Box>
  );
};

export default RoomDrawer;
