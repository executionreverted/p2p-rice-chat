import React from 'react';
import { Box } from 'ink';
import SelectInput from 'ink-select-input';

const CommandMenu = ({ onSelect, isFocused }) => {
  const items = [
    { label: 'Help', value: 'help' },
    { label: 'Change Username', value: 'nick' },
    { label: 'Share File', value: 'share' },
    { label: 'Show Peers', value: 'peers' },
    { label: 'Show Transfers', value: 'transfers' },
    { label: 'Clear Messages', value: 'clear' },
    { label: 'Exit', value: 'exit' },
  ];

  return (
    <Box borderStyle="single" borderColor={isFocused ? "green" : "gray"}>
      <SelectInput
        items={items}
        onSelect={onSelect}
        isFocused={isFocused}
      />
    </Box>
  );
};

export default CommandMenu;
