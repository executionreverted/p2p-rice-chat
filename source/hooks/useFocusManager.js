import { useState, useCallback } from 'react';

// Define focus areas
export const FOCUS_AREAS = {
  ROOMS: 'rooms',
  CHAT_INPUT: 'chat_input',
  USERS: 'users',
  MENU: 'menu'
};

/**
 * Hook for managing focus across components
 * Handles focus cycling, focus state, and UI visibility
 */
export function useFocusManager(initialFocus = FOCUS_AREAS.CHAT_INPUT) {
  const [focusedArea, setFocusedArea] = useState(initialFocus);
  const [showMenu, setShowMenu] = useState(false);
  const [showRooms, setShowRooms] = useState(true);

  // Change focused area
  const changeFocus = useCallback((area) => {
    setFocusedArea(area);
  }, []);

  // Function to cycle to the next focus area
  const cycleFocus = useCallback((reverse = false) => {
    // Define the order of focus cycling
    const focusOrder = [
      FOCUS_AREAS.ROOMS,
      FOCUS_AREAS.CHAT_INPUT,
      showMenu ? FOCUS_AREAS.MENU : FOCUS_AREAS.USERS
    ];

    // If rooms are hidden, remove from cycle
    const availableFocusAreas = showRooms
      ? focusOrder
      : focusOrder.filter(area => area !== FOCUS_AREAS.ROOMS);

    const currentIndex = availableFocusAreas.indexOf(focusedArea);
    let nextIndex;

    if (reverse) {
      // Cycle backwards
      nextIndex = currentIndex <= 0 ? availableFocusAreas.length - 1 : currentIndex - 1;
    } else {
      // Cycle forwards
      nextIndex = (currentIndex + 1) % availableFocusAreas.length;
    }

    setFocusedArea(availableFocusAreas[nextIndex]);
  }, [focusedArea, showMenu, showRooms]);

  // Toggle menu and update focus
  const toggleMenu = useCallback(() => {
    const newMenuState = !showMenu;
    setShowMenu(newMenuState);

    if (newMenuState) {
      setFocusedArea(FOCUS_AREAS.MENU);
    } else {
      setFocusedArea(FOCUS_AREAS.CHAT_INPUT);
    }

    return newMenuState;
  }, [showRooms]);

  // Toggle rooms visibility
  const toggleRooms = useCallback(() => {
    const newRoomsState = !showRooms;
    setShowRooms(newRoomsState);
    return newRoomsState;
  }, [showRooms]);

  return {
    focusedArea,
    showMenu,
    showRooms,
    changeFocus,
    cycleFocus: () => cycleFocus(false),
    cycleBackward: () => cycleFocus(true),
    toggleMenu,
    toggleRooms,
    setShowMenu,
    setShowRooms
  };
}

export default useFocusManager;
