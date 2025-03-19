// components/HelpOverlay.js
import React from 'react';
import { Box, Text } from 'ink';

// Instead of using the hook directly inside the component,
// we'll accept layout information as props
const HelpOverlay = ({
  show,
  onClose,
  terminalSize = { columns: 80, rows: 24 },
  layoutMode = 'normal'
}) => {
  if (!show) return null;

  // Determine if we're in compact mode based on props
  const isCompact = layoutMode === 'compact' || layoutMode === 'stacked' || layoutMode === 'mini';

  return (
    <Box
      position="absolute"
      top={0}
      left={0}
      width="100%"
      height="100%"
      flexDirection="column"
      borderStyle="double"
      borderColor="green"
      padding={1}
      backgroundColor="black"
    >
      <Box padding={1} backgroundColor="green" width="100%">
        <Text bold color="black">HyperChat Help</Text>
      </Box>

      <Box flexDirection="column" padding={1} flexGrow={1} overflowY="scroll">
        <Text bold>Keyboard Shortcuts:</Text>
        <Text>Tab/Shift+Tab: Cycle through UI elements</Text>
        <Text>ESC: Toggle menu</Text>
        <Text>Alt+R: Toggle rooms sidebar</Text>
        <Text>Alt+M: Toggle users/menu panel</Text>
        {!isCompact && <Text>Alt+1-9: Quick switch to rooms 1-9</Text>}
        <Text>Alt+0: Toggle mini mode</Text>
        <Text>F1 or Ctrl+H: Toggle this help</Text>

        <Text bold marginTop={1}>Commands:</Text>
        <Text>/help: Show all commands</Text>
        <Text>/nick [name]: Change username</Text>
        <Text>/share [file]: Share a file</Text>
        <Text>/accept [id]: Accept file transfer</Text>
        <Text>/room [name]: Create a new room</Text>
        <Text>/invite: Generate room invite</Text>
        <Text>/join [code]: Join room from invite</Text>

        <Text bold marginTop={1}>Terminal Size:</Text>
        <Text>Current size: {terminalSize.columns}x{terminalSize.rows}</Text>
        <Text>Layout mode: {layoutMode}</Text>
        {
          layoutMode === 'mini' &&
          <Text color="yellow">Your terminal is very small. Consider resizing for a better experience.</Text>
        }

        <Text marginTop={1} color="gray">Press ESC to close help</Text>
      </Box>
    </Box>
  );
};

export default HelpOverlay;
