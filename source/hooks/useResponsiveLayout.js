// hooks/useResponsiveLayout.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Define breakpoints
const BREAKPOINTS = {
  MINI: { columns: 40, rows: 12 },
  SMALL: { columns: 60, rows: 15 },
  MEDIUM: { columns: 100, rows: 20 },
  LARGE: { columns: 150, rows: 40 }
};

// Layout modes
export const LAYOUTS = {
  MINI: 'mini',         // Extremely small terminals
  STACKED: 'stacked',   // Small terminals, vertical layout
  COMPACT: 'compact',   // Medium terminals, horizontal but compact
  NORMAL: 'normal',     // Standard terminals, full features
  LARGE: 'large'        // Extra large terminals, more information
};

// Component minimum dimensions
const MIN_DIMS = {
  ROOM_WIDTH: 12,
  USERS_WIDTH: 12,
  CHAT_WIDTH: 30,
  MESSAGE_HEIGHT: 5,
  INPUT_HEIGHT: 3,
  STATUS_HEIGHT: 3,
  HELP_BAR_HEIGHT: 2
};

export function useResponsiveLayout() {
  // Terminal dimensions cache
  const lastKnownSize = useRef({
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24
  });

  // Debounced resize handler reference
  const resizeTimeoutRef = useRef(null);

  // Layout state
  const [layout, setLayout] = useState({
    // Terminal dimensions
    columns: process.stdout.columns || 80,
    rows: process.stdout.rows || 24,

    // Layout classification
    mode: LAYOUTS.NORMAL,

    // Feature flags
    showRooms: true,
    showUsers: true,
    showTransfers: true,
    showTimestamps: true,
    showStatusBar: true,

    // Sizing parameters - use absolute values for more predictable sizing
    roomsWidth: 20,  // columns, not percentage
    usersWidth: 25,  // columns, not percentage
    chatWidth: 35,   // columns, remaining space
    statusHeight: 3, // rows
    helpBarHeight: 2, // rows

    // Text truncation lengths
    maxUsernameLength: 20,
    maxRoomNameLength: 20,
    maxMessageLength: 1000,

    // Component parameters
    compact: false,
    miniMode: false
  });

  // Calculate layout dimensions based on terminal size
  const calculateLayout = useCallback(() => {
    // Get current terminal dimensions with fallback
    const columns = process.stdout.columns || lastKnownSize.current.columns;
    const rows = process.stdout.rows || lastKnownSize.current.rows;

    // Update last known size
    lastKnownSize.current = { columns, rows };

    // Safety margins to prevent overflow
    const safeColumns = Math.max(columns - 2, 40); // 2 columns safety margin
    const safeRows = Math.max(rows - 1, 15);
    // Determine layout mode based on available space
    let mode = LAYOUTS.NORMAL;
    if (columns < BREAKPOINTS.MINI.columns || rows < BREAKPOINTS.MINI.rows) {
      mode = LAYOUTS.MINI;
    } else if (columns < BREAKPOINTS.SMALL.columns || rows < BREAKPOINTS.SMALL.rows) {
      mode = LAYOUTS.STACKED;
    } else if (columns < BREAKPOINTS.MEDIUM.columns || rows < BREAKPOINTS.MEDIUM.rows) {
      mode = LAYOUTS.COMPACT;
    } else if (columns > BREAKPOINTS.LARGE.columns && rows > BREAKPOINTS.LARGE.rows) {
      mode = LAYOUTS.LARGE;
    }

    // Flag for compact UI elements
    const isCompact = mode === LAYOUTS.COMPACT || mode === LAYOUTS.STACKED;

    // Vertical space requirements
    const statusHeight = mode === LAYOUTS.LARGE ? 4 : MIN_DIMS.STATUS_HEIGHT;
    const helpBarHeight = MIN_DIMS.HELP_BAR_HEIGHT;
    const minMessageHeight = MIN_DIMS.MESSAGE_HEIGHT;
    const minInputHeight = MIN_DIMS.INPUT_HEIGHT;

    // Check if we have enough vertical space
    const requiredHeight = statusHeight + minMessageHeight + minInputHeight + helpBarHeight;
    if (safeRows < requiredHeight) {
      // Force mini mode when height is too small
      mode = LAYOUTS.MINI;
    }

    // Calculate room sidebar width based on available space
    // For NORMAL or LARGE, use 25% of width up to 25 columns
    // For COMPACT, use 30% of width up to 20 columns
    // For STACKED, make it full width
    let roomsWidth = 0;
    let usersWidth = 0;

    // Decision to show sidebars
    const showRooms = mode !== LAYOUTS.MINI;
    const showUsers = mode !== LAYOUTS.MINI && mode !== LAYOUTS.STACKED;

    // Calculate sidebar widths if shown
    if (showRooms) {
      if (mode === LAYOUTS.STACKED) {
        roomsWidth = safeColumns;
      } else if (mode === LAYOUTS.COMPACT) {
        roomsWidth = Math.min(Math.floor(safeColumns * 0.3), 20);
      } else {
        roomsWidth = Math.min(Math.floor(safeColumns * 0.25), 25);
      }
      // Ensure minimum width
      roomsWidth = Math.max(roomsWidth, MIN_DIMS.ROOM_WIDTH);
    }

    if (showUsers) {
      if (mode === LAYOUTS.COMPACT) {
        usersWidth = Math.min(Math.floor(safeColumns * 0.25), 20);
      } else {
        usersWidth = Math.min(Math.floor(safeColumns * 0.25), 30);
      }
      // Ensure minimum width
      usersWidth = Math.max(usersWidth, MIN_DIMS.USERS_WIDTH);
    }

    // Calculate remaining width for chat area
    // Account for margins between panels (1 column each)
    const marginsWidth = (showRooms ? 1 : 0) + (showUsers ? 1 : 0);
    let chatWidth = safeColumns - roomsWidth - usersWidth - marginsWidth;

    // Check if we have enough space for all panels
    if (chatWidth < MIN_DIMS.CHAT_WIDTH) {
      // Not enough space, adjust sidebar widths
      if (showRooms && showUsers) {
        // Reduce both sidebars proportionally
        const excess = MIN_DIMS.CHAT_WIDTH - chatWidth;
        const totalSidebars = roomsWidth + usersWidth;

        roomsWidth = Math.max(MIN_DIMS.ROOM_WIDTH,
          roomsWidth - Math.floor(excess * (roomsWidth / totalSidebars)));
        usersWidth = Math.max(MIN_DIMS.USERS_WIDTH,
          usersWidth - Math.floor(excess * (usersWidth / totalSidebars)));

        // Recalculate chat width
        chatWidth = safeColumns - roomsWidth - usersWidth - marginsWidth;
      } else if (showRooms) {
        // Only room sidebar visible, reduce it
        roomsWidth = Math.max(MIN_DIMS.ROOM_WIDTH, safeColumns - MIN_DIMS.CHAT_WIDTH - marginsWidth);
        chatWidth = safeColumns - roomsWidth - marginsWidth;
      } else if (showUsers) {
        // Only users sidebar visible, reduce it
        usersWidth = Math.max(MIN_DIMS.USERS_WIDTH, safeColumns - MIN_DIMS.CHAT_WIDTH - marginsWidth);
        chatWidth = safeColumns - usersWidth - marginsWidth;
      }

      // If still not enough space, force mini mode
      if (chatWidth < MIN_DIMS.CHAT_WIDTH) {
        mode = LAYOUTS.MINI;
        roomsWidth = 0;
        usersWidth = 0;
        chatWidth = safeColumns;
      }
    }

    // Text truncation lengths based on available space
    const maxUsernameLength = mode === LAYOUTS.COMPACT ? 10 :
      (mode === LAYOUTS.LARGE ? 30 : 20);
    const maxRoomNameLength = mode === LAYOUTS.COMPACT ? 10 :
      (mode === LAYOUTS.LARGE ? 30 : 20);

    // Return calculated layout
    return {
      columns,
      rows,
      safeColumns,
      safeRows,
      mode,

      // Feature flags based on mode
      showRooms: mode !== LAYOUTS.MINI,
      showUsers: mode !== LAYOUTS.MINI && mode !== LAYOUTS.STACKED,
      showTransfers: mode !== LAYOUTS.MINI && mode !== LAYOUTS.STACKED,
      showTimestamps: mode !== LAYOUTS.MINI && mode !== LAYOUTS.STACKED,
      showStatusBar: mode !== LAYOUTS.MINI,

      // Component dimensions
      roomsWidth,
      usersWidth,
      chatWidth,
      statusHeight,
      helpBarHeight,

      // Content sizing
      maxUsernameLength,
      maxRoomNameLength,
      maxMessageLength: mode === LAYOUTS.MINI ? 100 : 1000,

      // UI modes
      compact: isCompact,
      miniMode: mode === LAYOUTS.MINI
    };
  }, []);

  // Handle terminal resize with debouncing
  useEffect(() => {
    const handleResize = () => {
      // Clear any pending timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Debounce resize events
      resizeTimeoutRef.current = setTimeout(() => {
        const newLayout = calculateLayout();
        setLayout(newLayout);
        resizeTimeoutRef.current = null;
      }, 100); // 100ms debounce
    };

    // Initial calculation
    const initialLayout = calculateLayout();
    setLayout(initialLayout);

    // Listen for resize events
    process.stdout.on('resize', handleResize);

    // Cleanup on unmount
    return () => {
      process.stdout.removeListener('resize', handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [calculateLayout]);

  return layout;
}

export default useResponsiveLayout;
