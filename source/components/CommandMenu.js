// components/CommandMenu.js
import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';

// Accept compact mode as a prop instead of using the hook directly
const CommandMenu = ({ onSelect, isFocused, compact = false }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [highlightedItem, setHighlightedItem] = useState(null);

  // Short labels for compact mode
  const shortLabels = {
    help: 'Help',
    nick: 'Username',
    share: 'Share',
    peers: 'Peers',
    transfers: 'Transfers',
    clear: 'Clear',
    invite: 'Invite',
    join: 'Join',
    room: 'New Room',
    exit: 'Exit'
  };

  // Use useMemo to avoid recreating items array on every render
  const items = useMemo(() => {
    const baseItems = [
      { label: 'Help', value: 'help' },
      { label: 'Change Username', value: 'nick' },
      { label: 'Share File', value: 'share' },
      { label: 'Show Peers', value: 'peers' },
      { label: 'Show Transfers', value: 'transfers' },
      { label: 'Clear Messages', value: 'clear' },
      { label: 'Generate Invite', value: 'invite' },
      { label: 'Join Room', value: 'join' },
      { label: 'Create Room', value: 'room' },
      { label: 'Exit', value: 'exit' },
    ];

    // For compact mode, use shorter labels
    if (compact) {
      return baseItems.map(item => ({
        ...item,
        label: shortLabels[item.value] || item.label
      }));
    }

    return baseItems;
  }, [compact]); // Only recalculate when compact changes

  // Handle keyboard navigation
  useInput((input, key) => {
    if (!isFocused) return;

    if (key.return) {
      onSelect(items[selectedIndex]);
    }
  });

  // Update highlighted item when selected index changes
  // Use a proper dependency array to prevent infinite updates
  useEffect(() => {
    if (items[selectedIndex]) {
      setHighlightedItem(items[selectedIndex]);
    }
  }, [selectedIndex, items]);

  // Custom item renderer
  const itemComponent = ({ isSelected, label }) => (
    <Box>
      <Text color={isSelected ? 'green' : 'white'}>
        {label}
      </Text>
    </Box>
  );

  const indicatorComponent = ({ isSelected }) => (
    <Box>
      <Text color={isSelected ? 'green' : 'white'}>
        {isSelected ? '››' : '  '}
      </Text>
    </Box>
  );

  return (
    <Box
      borderStyle="single"
      borderColor={isFocused ? "green" : "gray"}
      flexDirection="column"
      height={"100%"}
      alignItems={"flex-start"}
      overflowY="scroll"
      width={"100%"}
      padding={compact ? 0 : 1}
    >
      <Box paddingRight={compact ? 0 : 1} backgroundColor="blue" width="100%">
        <Text bold color="white">Menu</Text>
      </Box>
      <SelectInput
        indicatorComponent={indicatorComponent}
        items={items}
        onSelect={onSelect}
        isFocused={isFocused}
        initialIndex={selectedIndex}
        itemComponent={itemComponent}
        highlightedValue={highlightedItem?.value}
        onHighlight={(item) => {
          setHighlightedItem(item);
          setSelectedIndex(items.findIndex(i => i.value === item.value));
        }}
      />
    </Box>
  );
};

export default CommandMenu;
