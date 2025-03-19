import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

const InputArea = ({ value, onChange, onSubmit, placeholder, isFocused }) => {
  return (
    <Box borderStyle="single" borderColor={isFocused ? "green" : "gray"}>
      <Text>›</Text>
      <TextInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder={placeholder || "Type your message..."}
        focus={isFocused}
      />
    </Box>
  );
};

export default InputArea;
