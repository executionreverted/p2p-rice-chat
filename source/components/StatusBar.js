import React from 'react';
import { Box, Text } from 'ink';

const StatusBar = ({ peerCount, username, room }) => {
  return (
    <Box borderStyle="single" borderColor="cyan">
      <Box flexGrow={1} padding={1}>
        <Text>Username: </Text>
        <Text color="green">{username}</Text>
      </Box>
      <Box padding={1}>
        <Text>Room: </Text>
        <Text color="cyan">{room ? room.slice(0, 8) + '...' : 'Not connected'}</Text>
      </Box>
      <Box padding={1}>
        <Text>Peers: </Text>
        <Text color="blue">{peerCount}</Text>
      </Box>
    </Box>
  );
};

export default StatusBar;
