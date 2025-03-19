import clipboard from 'clipboardy';  // Correctly import with reference

export const copyToClipboard = (text) => {
  return new Promise((resolve, reject) => {
    try {
      clipboard.writeSync(text);
      resolve(true);
    } catch (err) {
      console.error('Clipboard error:', err);  // Log for debugging
      reject(new Error(`Clipboard operation failed: ${err.message}`));
    }
  });
};
