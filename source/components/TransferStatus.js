// components/TransferStatus.js
import React from 'react';
import { Box, Text } from 'ink';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout.js';

const TransferStatus = ({ transfers, version }) => {
  const layout = useResponsiveLayout();
  const compact = layout.compact;

  // Use the version prop to trigger re-renders

  // Handle case where transfers is undefined or not a Map
  if (!transfers || typeof transfers.entries !== 'function') {
    return null;
  }

  const transferArray = Array.from(transfers.entries());

  if (transferArray.length === 0) return null;

  // Helper to format transfer progress
  const formatProgress = (transfer) => {
    try {
      // Avoid division by zero
      if (!transfer.totalChunks) return '0%';

      const progress = transfer.type === 'upload'
        ? Math.round((transfer.sentChunks / transfer.totalChunks) * 100)
        : Math.round((transfer.receivedChunks / transfer.totalChunks) * 100);

      // Make sure progress is between 0 and 100
      return `${Math.max(0, Math.min(100, progress))}%`;
    } catch (err) {
      return 'Error';
    }
  };

  // Helper to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'green';
      case 'error': return 'red';
      case 'pending': return 'yellow';
      case 'transferring': return 'blue';
      default: return 'white';
    }
  };

  // Format filename based on available space
  const formatFilename = (filename) => {
    if (!filename) return 'Unknown';

    const maxLength = compact ? 15 : 25;
    if (filename.length > maxLength) {
      return `${filename.slice(0, maxLength - 3)}...`;
    }

    return filename;
  };

  return (

    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor="blue"
      marginTop={1}
      // Set a maximum height to prevent it from taking too much space
      height={Math.min(10, transferArray.length * 4 + 2)}
    >
      <Box padding={compact ? 0 : 1}>
        <Text bold>Active Transfers</Text>
      </Box>
      {transferArray.map(([id, transfer]) => {
        if (!transfer) return null; // Skip invalid transfers

        const shortId = id.slice(0, 6);
        const progress = formatProgress(transfer);

        return (
          <Box key={id} flexDirection="column" padding={compact ? 0 : 1} borderStyle="single" borderColor="gray">
            <Text>
              {transfer.type === 'upload' ? 'Up: ' : 'Down: '}
              <Text color="cyan">{formatFilename(transfer.filename)}</Text>
            </Text>
            {!compact && <Text>ID: {shortId}</Text>}
            <Text>
              <Text color={getStatusColor(transfer.status)}>{progress}</Text>
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default TransferStatus;
