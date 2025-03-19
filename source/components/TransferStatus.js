import React from 'react';
import { Box, Text } from 'ink';

const TransferStatus = ({ transfers }) => {
  if (transfers.size === 0) return null;

  return (
    <Box flexDirection="column" borderStyle="single" borderColor="blue" marginTop={1}>
      <Box padding={1}>
        <Text bold>Active Transfers</Text>
      </Box>
      {Array.from(transfers.entries()).map(([id, transfer]) => {
        const shortId = id.slice(0, 6);
        const progress = transfer.type === 'upload'
          ? Math.round((transfer.sentChunks / transfer.totalChunks) * 100)
          : Math.round((transfer.receivedChunks / transfer.totalChunks) * 100);

        return (
          <Box key={id} flexDirection="column" padding={1}>
            <Text>
              {transfer.type === 'upload' ? 'Upload: ' : 'Download: '}
              <Text color="cyan">{transfer.filename}</Text> ({shortId})
            </Text>
            <Text>
              Progress: <Text color="green">{progress}%</Text>
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default TransferStatus;
