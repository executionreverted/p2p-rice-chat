import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

// Command history feature
const useCommandHistory = (initialHistory = []) => {
  const [history, setHistory] = useState(initialHistory);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = (command) => {
    // Don't add empty commands or duplicates of the last command
    if (!command.trim() || (history.length > 0 && history[0] === command)) {
      return;
    }

    setHistory([command, ...history.slice(0, 49)]); // Keep last 50 commands
    setHistoryIndex(-1);
  };

  const getPreviousCommand = () => {
    if (history.length === 0) return '';

    const newIndex = Math.min(historyIndex + 1, history.length - 1);
    setHistoryIndex(newIndex);
    return history[newIndex];
  };

  const getNextCommand = () => {
    if (historyIndex <= 0) {
      setHistoryIndex(-1);
      return '';
    }

    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    return history[newIndex];
  };

  return {
    addToHistory,
    getPreviousCommand,
    getNextCommand,
    historyIndex
  };
};

// Enhanced InputArea component with auto-completion and history
const InputArea = ({ value, onChange, onSubmit, placeholder, isFocused, availableCommands = [] }) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);

  const { addToHistory, getPreviousCommand, getNextCommand } = useCommandHistory();

  // Keep local and parent state in sync
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Handle input changes
  const handleChange = (newValue) => {
    setInputValue(newValue);
    onChange(newValue);

    // Generate suggestions for commands
    if (newValue.startsWith('/')) {
      const commandPart = newValue.slice(1).toLowerCase();

      // Default commands
      const defaultCommands = [
        'help', 'exit', 'quit', 'nick', 'name', 'share',
        'peers', 'transfers', 'topic', 'clear', 'invite',
        'join', 'room'
      ];

      // Combine with any additional commands
      const allCommands = [...new Set([...defaultCommands, ...availableCommands])];

      // Filter commands that match the input
      const matchingCommands = allCommands.filter(cmd =>
        cmd.toLowerCase().startsWith(commandPart)
      );

      setSuggestions(matchingCommands);
      suggestionsRef.current = matchingCommands;
      setShowSuggestions(matchingCommands.length > 0);
      setSelectedSuggestion(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle input submission
  const handleSubmit = (submitValue) => {
    // Add to history if it's not empty
    if (submitValue.trim()) {
      addToHistory(submitValue);
    }

    // Reset suggestions
    setSuggestions([]);
    setShowSuggestions(false);

    // Call parent onSubmit
    onSubmit(submitValue);
  };

  // Handle special key events
  const handleSpecialKeys = (key) => {
    // Tab completion
    if (key === 'tab' && showSuggestions && suggestions.length > 0) {
      const suggestion = suggestions[selectedSuggestion];
      const newValue = `/${suggestion} `;
      setInputValue(newValue);
      onChange(newValue);
      setShowSuggestions(false);
      return true;
    }

    // Up arrow for previous command or suggestion
    if (key === 'up') {
      if (showSuggestions) {
        setSelectedSuggestion(
          (selectedSuggestion + suggestions.length - 1) % suggestions.length
        );
      } else {
        const prevCmd = getPreviousCommand();
        if (prevCmd) {
          setInputValue(prevCmd);
          onChange(prevCmd);
        }
      }
      return true;
    }

    // Down arrow for next command or suggestion
    if (key === 'down') {
      if (showSuggestions) {
        setSelectedSuggestion(
          (selectedSuggestion + 1) % suggestions.length
        );
      } else {
        const nextCmd = getNextCommand();
        setInputValue(nextCmd);
        onChange(nextCmd);
      }
      return true;
    }

    // Escape to clear suggestions
    if (key === 'escape') {
      setShowSuggestions(false);
      return false; // Allow escape to bubble up
    }

    return false;
  };

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor={isFocused ? "green" : "gray"}>
        <Text>›</Text>
        <TextInput
          value={inputValue}
          onChange={handleChange}
          onSubmit={handleSubmit}
          placeholder={placeholder || "Type your message..."}
          focus={isFocused}
        // Add TextInput-specific props for key handling here if needed
        />
      </Box>

      {showSuggestions && (
        <Box
          borderStyle="single"
          borderColor="blue"
          flexDirection="column"
          width={20}
          position="absolute"
          bottom={2}
          left={2}
        >
          {suggestions.map((suggestion, index) => (
            <Text
              key={suggestion}
              backgroundColor={index === selectedSuggestion ? "blue" : undefined}
              color={index === selectedSuggestion ? "white" : undefined}
            >
              {suggestion}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default InputArea;
