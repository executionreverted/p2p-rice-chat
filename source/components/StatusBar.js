// components/StatusBar.js
import React from 'react';
import { Box, Text } from 'ink';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout.js';

const StatusBar = ({ peerCount, username, room }) => {
  const layout = useResponsiveLayout();
  const compact = layout.compact;

  const formatRoomName = (roomName) => {
    if (!roomName) return 'Not connected';

    // If the room name is a topic (a long hex string), show a shorter version
    if (/^[0-9a-f]{64}$/i.test(roomName)) {
      return compact ? `${roomName.slice(0, 6)}...` : `${roomName.slice(0, 8)}...`;
    }

    // For normal room names, truncate if necessary based on layout
    const maxLength = layout.maxRoomNameLength;
    if (roomName.length > maxLength) {
      return `${roomName.slice(0, maxLength - 3)}...`;
    }

    return roomName;
  };

  // Mini mode for extremely small terminals
  if (layout.miniMode) {
    return (
      <Box borderStyle="single" borderColor="cyan">
        <Text color="green">{username}</Text>
        <Text> | </Text>
        <Text color="cyan">{formatRoomName(room)}</Text>
        <Text> | </Text>
        <Text color={peerCount > 0 ? "green" : "blue"}>{peerCount}p</Text>
      </Box>
    );
  }

  return (
    <Box height={layout.statusHeight} borderStyle="single" borderColor="cyan">
      <Box flexGrow={1} paddingLeft={1}>
        <Text>{compact ? "User: " : "Username: "}</Text>
        <Text color="green">{username}</Text>
      </Box>
      <Box paddingLeft={1}>
        <Text>Room: </Text>
        <Text color="cyan">{formatRoomName(room)}</Text>
      </Box>
      <Box paddingLeft={1}>
        <Text>{compact ? "P: " : "Peers: "}</Text>
        <Text color={peerCount > 0 ? "green" : "blue"}>{peerCount}</Text>
      </Box>
    </Box>
  );
};

export default StatusBar;
