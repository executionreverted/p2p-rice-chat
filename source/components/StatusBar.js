import React from 'react';
import { Box, Text } from 'ink';

const StatusBar = ({ peerCount, username, room }) => {
  const formatRoomName = (roomName) => {
    if (!roomName) return 'Not connected';

    // If the room name is a topic (a long hex string), show a shorter version
    if (/^[0-9a-f]{64}$/i.test(roomName)) {
      return `${roomName.slice(0, 8)}...`;
    }

    // For normal room names, truncate if necessary based on length
    if (roomName.length > 20) {
      return `${roomName.slice(0, 17)}...`;
    }

    return roomName;
  };
  return (
    <Box borderStyle="single" borderColor="cyan">
      <Box flexGrow={1} padding={1}>
        <Text>Username: </Text>
        <Text color="green">{username}</Text>
      </Box>
      <Box padding={1}>
        <Text>Room: </Text>
        <Text color="cyan">{formatRoomName(room)}</Text>
      </Box>
      <Box padding={1}>
        <Text>Peers: </Text>
        <Text color={peerCount > 0 ? "green" : "blue"}>{peerCount}</Text>
      </Box>
    </Box>
  );
};

export default StatusBar;
