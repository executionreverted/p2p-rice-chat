import React from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';

const CommandMenu = ({ onSelect, isFocused }) => {
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

  return (
    <Box borderStyle="single" borderColor={isFocused ? "green" : "gray"}>
      <Box padding={1} backgroundColor="blue">
        <Text bold color="white">Menu</Text>
      </Box>
      <SelectInput
        items={items}
        onSelect={onSelect}
        isFocused={isFocused}
      />
    </Box>
  );
};

export default CommandMenu;
