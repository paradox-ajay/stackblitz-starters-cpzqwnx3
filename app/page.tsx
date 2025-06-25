'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, Users, Play } from 'lucide-react';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const router = useRouter();

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    setIsCreating(true);
    router.push(`/game?action=create&name=${encodeURIComponent(playerName)}`);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) return;
    setIsJoining(true);
    router.push(`/game?action=join&name=${encodeURIComponent(playerName)}&room=${roomId.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Palette className="text-purple-600 mr-2" size={40} />
            <h1 className="text-4xl font-bold text-gray-800">Scribble.io</h1>
          </div>
          <p className="text-gray-600">Draw, guess, and have fun with friends!</p>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={20}
            />
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCreateRoom}
              disabled={!playerName.trim() || isCreating}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Users size={20} />
              <span>{isCreating ? 'Creating...' : 'Create Room'}</span>
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                disabled={!playerName.trim() || !roomId.trim() || isJoining}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={20} />
                <span>{isJoining ? 'Joining...' : 'Join Room'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Up to 8 players • Real-time drawing • Multiple rounds</p>
        </div>
      </div>
    </div>
  );
}