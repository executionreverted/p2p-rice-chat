#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import App from './App.js';

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  let topic, username;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--topic' || args[i] === '-t') {
      topic = args[i + 1];
      i++;
    } else if (args[i] === '--username' || args[i] === '--name' || args[i] === '-u') {
      username = args[i + 1];
      i++;
    }
  }

  return { username, topic };
};

// Start the application
const { username, topic } = parseArgs();
render(<App initialUsername={username} initialTopic={topic} />);
