// Cleanup effect to clear any pending throttle timers
import React, { useState, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout.js';

// Maximum message length
const MAX_MESSAGE_LENGTH = 200;

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

// Enhanced InputArea component with interactive auto-completion and better input handling
const InputArea = ({ value, onChange, onSubmit, placeholder, isFocused, availableCommands = [] }) => {
  const layout = useResponsiveLayout();
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [isNavigatingSuggestions, setIsNavigatingSuggestions] = useState(false);
  const [isOverLimit, setIsOverLimit] = useState(false);

  // Debounce timer reference
  const debounceTimerRef = useRef(null);
  // Track backspace pressed state
  const backspacePressedRef = useRef(false);

  const { addToHistory, getPreviousCommand, getNextCommand } = useCommandHistory();

  // Keep local and parent state in sync - with safeguards against unnecessary re-renders
  useEffect(() => {
    if (value !== inputValue && value !== undefined) {
      setInputValue(value || '');
    }
  }, [value]);

  // Handle input changes with debouncing to prevent UI glitches
  const handleChange = (newValue) => {
    if (!isFocused) return;

    // Apply character limit on input - slice if over the limit
    const truncatedValue = newValue.slice(0, MAX_MESSAGE_LENGTH);

    // Check if the input was truncated
    const overLimit = newValue.length > MAX_MESSAGE_LENGTH;

    // Update state optimally to prevent UI glitches
    if (truncatedValue !== inputValue) {
      setInputValue(truncatedValue);
    }

    if (overLimit !== isOverLimit) {
      setIsOverLimit(overLimit);
    }

    // Update parent state
    onChange(truncatedValue);

    // Generate suggestions for commands after updating state
    if (truncatedValue.startsWith('/')) {
      const commandPart = truncatedValue.slice(1).toLowerCase();

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

      // Only update suggestions if they've changed to prevent UI thrashing
      const suggestionsChanged =
        matchingCommands.length !== suggestions.length ||
        matchingCommands.some((cmd, i) => suggestions[i] !== cmd);

      if (suggestionsChanged) {
        setSuggestions(matchingCommands);
        suggestionsRef.current = matchingCommands;
        setShowSuggestions(matchingCommands.length > 0);
        setSelectedSuggestion(0);
        setIsNavigatingSuggestions(false);
      }
    } else if (showSuggestions) {
      // Only clear suggestions if they're currently shown
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle paste event with TextInput
  // Note: ink-text-input doesn't directly expose paste events,
  // but handleChange will still apply our limit

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
    setIsOverLimit(false);

    // Call parent onSubmit
    onSubmit(submitValue);
  };

  // Use Ink's useInput hook for better key handling
  useInput((input, key) => {
    if (!isFocused) return;
    // Track backspace key state
    if (input.backspace) {
      backspacePressedRef.current = true;

      // If holding backspace, we use this to throttle processing
      if (debounceTimerRef.current) {
        return; // Skip if we're already processing a backspace event
      }

      // Set up throttling for backspace key
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
      }, 30); // 30ms throttle for backspace
    } else {
      backspacePressedRef.current = false;
    }

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
      <Box width="100%" flexDirection="column">
        <Box width="100%" flexDirection="row">
          <Text>›</Text>
          <Box flexGrow={1} width="80%" flexShrink={1} overflowX="hidden">
            <TextInput
              value={inputValue}
              onChange={handleChange}
              onSubmit={handleSubmit}
              placeholder={placeholder || ">"}
              focus={isFocused}
            />
          </Box>
          {isOverLimit && (
            <Box marginLeft={1}>
              <Text color="yellow">{inputValue.length}/{MAX_MESSAGE_LENGTH}</Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width="100%">

      {
        showSuggestions && (
          <Box
            borderStyle="single"
            borderColor="blue"
            gap={1}
            flexWrap="wrap"
            width={"100%"}
            backgroundColor="black"
            zIndex={10}
          >
            {suggestions.length > 0 && !layout.miniMode && (
              <Text alignSelf="flex-end" justifySelf={"flex-end"} dim>↑/↓ • Enter</Text>
            )}
            <Text>||</Text>
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
        )
      }
      <Box
        borderStyle="single"
        borderColor={isFocused ? (isOverLimit ? "yellow" : "green") : "gray"}
        width="100%"
        flexDirection="row"
        padding={layout.compact ? 0 : 1}
      >
        <Text>›</Text>
        <Box flexGrow={1} width="90%" flexShrink={1} overflowX="hidden">
          <TextInput
            value={inputValue}
            onChange={handleChange}
            onSubmit={handleSubmit}
            placeholder={placeholder || "Type your message..."}
            focus={isFocused && !isNavigatingSuggestions}
            showCursor={isFocused}
          />
        </Box>
        {isOverLimit && (
          <Box marginLeft={1}>
            <Text color="yellow">{inputValue.length}/{MAX_MESSAGE_LENGTH}</Text>
          </Box>
        )}
      </Box>

    </Box >
  );
};

export default InputArea;
