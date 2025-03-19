// components/InputArea.js
import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout.js';

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

// Enhanced InputArea component with interactive auto-completion
const InputArea = ({ value, onChange, onSubmit, placeholder, isFocused, availableCommands = [] }) => {
  const layout = useResponsiveLayout();
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isNavigatingSuggestions, setIsNavigatingSuggestions] = useState(false);

  const { addToHistory, getPreviousCommand, getNextCommand } = useCommandHistory();

  // Keep local and parent state in sync
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Handle input changes
  const handleChange = (newValue) => {
    if (!isFocused) return
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
      setIsNavigatingSuggestions(false);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle input submission
  const handleSubmit = (submitValue) => {
    // If navigating suggestions and pressing enter, use the selected suggestion
    if (isNavigatingSuggestions && showSuggestions && suggestions.length > 0) {
      const suggestion = suggestions[selectedSuggestion];
      const newValue = `/${suggestion} `;
      setInputValue(newValue);
      onChange(newValue);
      setShowSuggestions(false);
      setIsNavigatingSuggestions(false);
      return;
    }

    // Add to history if it's not empty
    if (submitValue.trim()) {
      addToHistory(submitValue);
    }

    // Reset suggestions
    setSuggestions([]);
    setShowSuggestions(false);
    setIsNavigatingSuggestions(false);

    // Call parent onSubmit
    onSubmit(submitValue);
  };

  // Use Ink's useInput hook for better key handling
  useInput((input, key) => {
    if (!isFocused) return;

    // Tab completion
    if (key.tab && showSuggestions && suggestions.length > 0) {
      const suggestion = suggestions[selectedSuggestion];
      const newValue = `/${suggestion} `;
      setInputValue(newValue);
      onChange(newValue);
      setShowSuggestions(false);
      setIsNavigatingSuggestions(false);
    }

    // Up arrow for navigating suggestions or command history
    if (key.upArrow) {
      if (showSuggestions) {
        setSelectedSuggestion(
          (selectedSuggestion + suggestions.length - 1) % suggestions.length
        );
        setIsNavigatingSuggestions(true);
      } else {
        const prevCmd = getPreviousCommand();
        if (prevCmd) {
          setInputValue(prevCmd);
          onChange(prevCmd);
        }
      }
    }

    // Down arrow for navigating suggestions or command history
    if (key.downArrow) {
      if (showSuggestions) {
        setSelectedSuggestion(
          (selectedSuggestion + 1) % suggestions.length
        );
        setIsNavigatingSuggestions(true);
      } else {
        const nextCmd = getNextCommand();
        setInputValue(nextCmd);
        onChange(nextCmd);
      }
    }

    // Enter key to select suggestion or submit input
    if (key.return && isNavigatingSuggestions && showSuggestions && suggestions.length > 0) {
      const suggestion = suggestions[selectedSuggestion];
      const newValue = `/${suggestion} `;
      setInputValue(newValue);
      onChange(newValue);
      setShowSuggestions(false);
      setIsNavigatingSuggestions(false);
    }

    // Escape to clear suggestions
    if (key.escape) {
      setShowSuggestions(false);
      setIsNavigatingSuggestions(false);
    }
  });

  // Mini mode for very small terminals
  if (layout.miniMode) {
    return (
      <Box width="100%">
        <Text>›</Text>
        <TextInput
          value={inputValue}
          onChange={handleChange}
          onSubmit={handleSubmit}
          placeholder={placeholder || ">"}
          focus={isFocused}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%">
      <Box
        borderStyle="single"
        borderColor={isFocused ? "green" : "gray"}
        width="100%"
        flexDirection="row"
        padding={layout.compact ? 0 : 1}
      >
        <Text>›</Text>
        <Box flexGrow={1}>
          <TextInput
            value={inputValue}
            onChange={handleChange}
            onSubmit={handleSubmit}
            placeholder={placeholder || "Type your message..."}
            focus={isFocused && !isNavigatingSuggestions}
            showCursor={isFocused}
          />
        </Box>
      </Box>

      {
        showSuggestions && (
          <Box
            borderStyle="single"
            borderColor="blue"
            flexDirection="column"
            width={20}
            position="absolute"
            bottom={layout.compact ? 1 : 2}
            left={layout.compact ? 1 : 2}
            backgroundColor="black"
            zIndex={10}
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
            {suggestions.length > 0 && !layout.miniMode && (
              <Box padding={layout.compact ? 0 : 1} borderStyle="single" borderColor="gray">
                <Text dim>↑/↓: Navigate • Enter: Select</Text>
              </Box>
            )}
          </Box>
        )
      }
    </Box >
  );
};

export default InputArea;
