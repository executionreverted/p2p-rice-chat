import React, { useState } from 'react';
import { useApp } from 'ink';
import MainLayout from './components/MainLayout.js';
import { SwarmProvider } from './hooks/useSwarm.js';
import { FileTransferProvider } from './hooks/useFileTransfer.js';
import { MessageProvider } from './hooks/useMessages.js';
import { ResponsiveLayoutProvider } from './hooks/useResponsiveLayout.js';
/**
 * Main App Component
 * Acts as a coordinator and provider container for the application
 */
const App = ({ initialUsername, initialTopic }) => {
  const [username, setUsername] = useState(initialUsername || process.env.USER || 'anonymous');

  return (
    <ResponsiveLayoutProvider>
      <MessageProvider>
        <SwarmProvider username={username}>
          <FileTransferProvider username={username}>
            <MainLayout
              initialUsername={username}
              setUsername={setUsername}
              initialTopic={initialTopic}
            />
          </FileTransferProvider>
        </SwarmProvider>
      </MessageProvider>
    </ResponsiveLayoutProvider>
  );
};

export default App;
