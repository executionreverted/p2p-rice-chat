import React from 'react';
import { Box, Text } from 'ink';

const TransferStatus = ({ transfers, version }) => {
  // Use the version prop to trigger re-renders

  // Handle case where transfers is undefined or not a Map
  if (!transfers || typeof transfers.entries !== 'function') {
    console.error('TransferStatus: transfers is not a Map', transfers);
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
      console.error('Error formatting progress:', err);
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

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="blue" marginTop={1}>
      <Box padding={1}>
        <Text bold>Active Transfers</Text>
      </Box>
      {transferArray.map(([id, transfer]) => {
        if (!transfer) return null; // Skip invalid transfers

        const shortId = id.slice(0, 6);
        const progress = formatProgress(transfer);

        return (
          <Box key={id} flexDirection="column" padding={1} borderStyle="single" borderColor="gray">
            <Text>
              {transfer.type === 'upload' ? 'Upload: ' : 'Download: '}
              <Text color="cyan">{transfer.filename || 'Unknown'}</Text>
            </Text>
            <Text>ID: {shortId}</Text>
            <Text>
              Status: <Text color={getStatusColor(transfer.status)}>{transfer.status || 'unknown'}</Text>
            </Text>
            <Text>
              Progress: <Text color="green">{progress}</Text>
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default TransferStatus;
