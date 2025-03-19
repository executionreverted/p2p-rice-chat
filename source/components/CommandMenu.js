import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';

const CommandMenu = ({ onSelect, isFocused }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [highlightedItem, setHighlightedItem] = useState(null);

  const items = [
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

  // Handle keyboard navigation for better selection experience
  useInput((input, key) => {
    if (!isFocused) return;

    if (key.return) {
      console.log(items[selectedIndex])
      onSelect(items[selectedIndex]);
    }
  });

  // Update highlighted item when selected index changes
  useEffect(() => {
    setHighlightedItem(items[selectedIndex]);
  }, [selectedIndex]);

  // Custom item renderer for better visual feedback
  const itemComponent = ({ isSelected, label }) => (
    <Box>
      <Text color={isSelected ? 'green' : 'white'}>
        {label}
      </Text>
    </Box>
  );

  const indicatorComponent = ({ isSelected, label }) => (
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
      padding={1}
    >
      <Box paddingRight={1} backgroundColor="blue" width="100%">
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
