'use client';

import React from 'react';
import { Player } from '@/types/game';
import { Crown, Pencil } from 'lucide-react';

interface PlayerListProps {
  players: Player[];
  currentDrawer: string | null;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, currentDrawer }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-bold mb-4 text-center">Players</h3>
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-3 rounded-lg ${
              player.isDrawing
                ? 'bg-yellow-100 border-2 border-yellow-400'
                : player.hasGuessed
                ? 'bg-green-100'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              {index === 0 && <Crown className="text-yellow-500" size={16} />}
              {player.isDrawing && <Pencil className="text-blue-500" size={16} />}
              <span className={`font-medium ${player.isDrawing ? 'text-yellow-700' : ''}`}>
                {player.name}
              </span>
              {player.hasGuessed && (
                <span className="text-green-600 text-sm font-medium">✓ Guessed!</span>
              )}
            </div>
            <span className="font-bold text-blue-600">{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;