// components/RoomManager.js
import React, { useEffect, useCallback } from 'react';
import { Box } from 'ink';
import RoomDrawer from './RoomDrawer.js';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout.js';

/**
 * RoomManager Component
 * Handles room management logic and wraps the RoomDrawer component
 */
const RoomManager = ({
  rooms = [],
  setRooms,
  activeRoomIndex,
  setActiveRoomIndex,
  isFocused,
  initialTopic,
  createRoom,
  joinRoom,
  currentRoom,
  width = "20%"
}) => {
  const layout = useResponsiveLayout();

  // Add a room to the list
  const addRoom = useCallback((roomData) => {
    if (!roomData || !roomData.topic) {
      return false;
    }

    const newRoom = {
      name: roomData.name || `Room ${roomData.topic.slice(0, 8)}`,
      description: roomData.description || "",
      topic: roomData.topic
    };

    // Check if room already exists
    const exists = rooms.some(room => room.topic === roomData.topic);

    if (!exists) {
      setRooms(prev => [...prev, newRoom]);
      // Set active index to the last item (new room)
      setActiveRoomIndex(rooms.length);
    } else {
      // Find and focus the existing room
      const roomIndex = rooms.findIndex(room => room.topic === roomData.topic);
      setActiveRoomIndex(roomIndex >= 0 ? roomIndex : 0);
    }

    return true;
  }, [rooms, setRooms, setActiveRoomIndex]);

  // Handle switching rooms
  const handleRoomSelect = useCallback((index) => {
    if (index >= 0 && index < rooms.length) {
      const selectedRoom = rooms[index];
      setActiveRoomIndex(index);
      joinRoom(selectedRoom);
    }
  }, [rooms, setActiveRoomIndex, joinRoom]);

  // Effect to update room list when currentRoom changes
  useEffect(() => {
    if (currentRoom) {
      // Check if the current room is already in our list
      const roomExists = rooms.some(room => room.topic === currentRoom.topic);

      if (!roomExists && currentRoom.topic !== initialTopic) {
        // Only add the room if it's not the initial room we already joined
        addRoom(currentRoom);
      }
    }
  }, [currentRoom, initialTopic, rooms, addRoom]);
  return (
    <RoomDrawer
      rooms={rooms}
      activeRoomIndex={activeRoomIndex}
      onRoomSelect={handleRoomSelect}
      isFocused={isFocused}
      width={layout.roomsWidth} // Pass numerical width from layout
      compact={layout.compact}
    />
  );
};

export default RoomManager;
