import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

const Notification = ({ message, duration = 3000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <Box
      position="absolute"
      right={2}
      top={1}
      borderStyle="round"
      borderColor="green"
      padding={1}
      backgroundColor="black"
    >
      <Text color="green" bold>{message}</Text>
    </Box>
  );
};

export default Notification;
