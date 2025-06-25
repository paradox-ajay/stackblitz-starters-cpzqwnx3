'use client';

import React from 'react';
import { Player } from '@/types/game';
import { Trophy, Medal, Award } from 'lucide-react';

interface GameResultsProps {
  players: Player[];
  onPlayAgain: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({ players, onPlayAgain }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  const getIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="text-yellow-500" size={24} />;
      case 1:
        return <Medal className="text-gray-400" size={24} />;
      case 2:
        return <Award className="text-orange-500" size={24} />;
      default:
        return null;
    }
  };

  const getPositionText = (position: number) => {
    switch (position) {
      case 0:
        return '1st Place';
      case 1:
        return '2nd Place';
      case 2:
        return '3rd Place';
      default:
        return `${position + 1}th Place`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-3xl font-bold text-center mb-6">Game Over!</h2>
        
        <div className="space-y-3 mb-6">
          {sortedPlayers.map((player, index) => (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-lg ${
                index === 0
                  ? 'bg-yellow-100 border-2 border-yellow-400'
                  : index === 1
                  ? 'bg-gray-100 border-2 border-gray-400'
                  : index === 2
                  ? 'bg-orange-100 border-2 border-orange-400'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                {getIcon(index)}
                <div>
                  <div className="font-bold">{player.name}</div>
                  <div className="text-sm text-gray-600">{getPositionText(index)}</div>
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600">{player.score}</div>
            </div>
          ))}
        </div>

        <button
          onClick={onPlayAgain}
          className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
        >
          Play Again
        </button>
      </div>
    </div>
  );
};

export default GameResults;