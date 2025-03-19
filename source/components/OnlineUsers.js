// components/OnlineUsers.js
import React from 'react';
import { Box, Text } from 'ink';

const OnlineUsers = ({ users, isFocused, compact = false, width }) => {
  // Calculate available width for username display
  const usernameWidth = width ? Math.max(width - 8, 10) : 20; // 8 chars for padding, status indicator

  if (!users || users.length === 0) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor={isFocused ? "green" : "gray"}
        height={"100%"}
        width={width} // Use fixed width passed from parent
      >
        <Box padding={compact ? 0 : 1} backgroundColor="blue" width="100%">
          <Text bold color="white">Online Users</Text>
        </Box>
        <Box padding={compact ? 0 : 1}>
          <Text color="gray">No users online</Text>
        </Box>
      </Box>
    );
  }

  // Format username based on available space
  const formatUsername = (username, isCurrentUser) => {
    if (!username) return `User`;

    const suffix = isCurrentUser && !compact ? " (you)" : "";
    const maxLength = usernameWidth - suffix.length;

    if (username.length > maxLength) {
      return `${username.slice(0, maxLength - 3)}...${suffix}`;
    }

    return `${username}${suffix}`;
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={isFocused ? "green" : "gray"}
      height={"100%"}
      width={width} // Use fixed width passed from parent
      overflowY="scroll"
    >
      <Box padding={compact ? 0 : 1} backgroundColor="blue" width="100%">
        <Text bold color="white">Online Users ({users.length})</Text>
      </Box>
      {users.map((user, index) => (
        <Box key={index} padding={compact ? 0 : 1}>
          <Text color={user.isCurrentUser ? "green" : "white"}>
            {user.isCurrentUser ? "● " : "○ "}
            {formatUsername(user.username || `User ${user.id.slice(0, 6)}`, user.isCurrentUser)}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default OnlineUsers;
