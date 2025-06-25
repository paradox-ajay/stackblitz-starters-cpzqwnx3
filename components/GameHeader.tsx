'use client';

import React from 'react';
import { GameState } from '@/types/game';
import { Clock, Users } from 'lucide-react';

interface GameHeaderProps {
  gameState: GameState;
  currentPlayer: { id: string; name: string } | null;
}

const GameHeader: React.FC<GameHeaderProps> = ({ gameState, currentPlayer }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordDisplay = () => {
    if (!gameState.currentWord) return '';
    
    if (currentPlayer?.id === gameState.currentDrawer) {
      return gameState.currentWord;
    }
    
    return gameState.currentWord
      .split('')
      .map(char => char === ' ' ? ' ' : '_')
      .join(' ');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users size={20} className="text-blue-500" />
            <span className="font-medium">Room: {gameState.id}</span>
          </div>
          
          {gameState.gameState !== 'waiting' && (
            <div className="text-sm text-gray-600">
              Round {gameState.round} of {gameState.maxRounds}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {gameState.gameState === 'drawing' && (
            <>
              <div className="flex items-center space-x-2">
                <Clock size={20} className="text-red-500" />
                <span className={`font-bold ${gameState.timeLeft <= 10 ? 'text-red-500' : 'text-gray-700'}`}>
                  {formatTime(gameState.timeLeft)}
                </span>
              </div>
              
              <div className="text-lg font-bold text-blue-600">
                {getWordDisplay()}
              </div>
            </>
          )}
        </div>
      </div>

      {gameState.gameState === 'drawing' && gameState.currentDrawer && (
        <div className="mt-2 text-center text-sm text-gray-600">
          {currentPlayer?.id === gameState.currentDrawer
            ? "You are drawing!"
            : `${gameState.players.find(p => p.id === gameState.currentDrawer)?.name} is drawing`}
        </div>
      )}
    </div>
  );
};

export default GameHeader;