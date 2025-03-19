#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './App.js';

import { SwarmProvider } from './hooks/useSwarm.js';
import { FileTransferProvider } from './hooks/useFileTransfer.js';
import { MessageProvider } from './hooks/useMessages.js';

const parseArgs = () => {
  const args = process.argv.slice(2);
  let topic, username;
  let errors = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' || args[i] === '-t') {
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        topic = args[i + 1];
        i++;
      } else {
        errors.push('Missing value for --topic/-t argument');
      }
    } else if (args[i] === '--username' || args[i] === '--name' || args[i] === '-u') {
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        username = args[i + 1];
        i++;
      } else {
        errors.push('Missing value for --username/--name/-u argument');
      }
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
HyperChat - P2P Terminal Chat Application

Usage:
  hyperchat [options]

Options:
  -u, --username, --name <n>  Set your display name
  -t, --topic <topic>         Join a specific room by topic
  -h, --help                  Display this help message

Examples:
  hyperchat --username Alice
  hyperchat -t abcdef1234567890... --name Bob
      `);
      process.exit(0);
    } else {
      errors.push(`Unknown argument: ${args[i]}`);
    }
  }

  if (errors.length > 0) {
    console.error('Error parsing arguments:');
    errors.forEach(err => console.error(`- ${err}`));
    console.error('\nUse --help for usage information');
  }

  return { username, topic };
};

// Start the application
const { username, topic } = parseArgs();
render(
  <MessageProvider>
    <SwarmProvider
      username={username}
    >
      <FileTransferProvider
        username={username}
      >
        <App initialUsername={username} initialTopic={topic} />
      </FileTransferProvider>
    </SwarmProvider>
  </MessageProvider>
);
