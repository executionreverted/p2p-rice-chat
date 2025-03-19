// components/CollapsibleSection.js
import React, { useState } from 'react';
import { Box, Text } from 'ink';

const CollapsibleSection = ({
  title,
  children,
  initiallyExpanded = true,
  height = "30%",
  borderColor = "blue",
  isFocused = false,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={isFocused ? "green" : borderColor}
      height={expanded ? height : "auto"}
    >
      <Box
        padding={compact ? 0 : 1}
        backgroundColor={isFocused ? "green" : borderColor}
        justifyContent="space-between"
        width="100%"
      >
        <Text bold color="white">{title}</Text>
        <Text
          color="white"
          bold
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "[-]" : "[+]"}
        </Text>
      </Box>

      {expanded && (
        <Box flex={1} overflowY="scroll">
          {children}
        </Box>
      )}
    </Box>
  );
};

export default CollapsibleSection;
