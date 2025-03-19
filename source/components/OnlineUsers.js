import React from 'react';
import { Box, Text } from 'ink';

const OnlineUsers = ({ users, isFocused }) => {
  if (!users || users.length === 0) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor={isFocused ? "green" : "gray"}
        height={"100%"}
      >
        <Box padding={1} backgroundColor="blue">
          <Text bold color="white">Online Users</Text>
        </Box>
        <Box padding={1}>
          <Text color="gray">No users online</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={isFocused ? "green" : "gray"}
      height={"100%"}
      overflowY="scroll"
    >
      <Box padding={1} backgroundColor="blue">
        <Text bold color="white">Online Users ({users.length})</Text>
      </Box>
      {users.map((user, index) => (
        <Box key={index} padding={1}>
          <Text color={user.isCurrentUser ? "green" : "white"}>
            {user.isCurrentUser ? "● " : "○ "}
            {user.username || `User ${user.id.slice(0, 6)}`}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default OnlineUsers;
