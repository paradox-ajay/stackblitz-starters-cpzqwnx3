'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SocketManager from '@/lib/socket';
import { GameState, Player, ChatMessage, DrawData } from '@/types/game';
import Canvas from '@/components/Canvas';
import Chat from '@/components/Chat';
import PlayerList from '@/components/PlayerList';
import GameHeader from '@/components/GameHeader';
import WordSelection from '@/components/WordSelection';
import GameResults from '@/components/GameResults';
import { Socket } from 'socket.io-client';

function GameContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<{ id: string; name: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const action = searchParams.get('action');
  const playerName = searchParams.get('name');
  const roomId = searchParams.get('room');

  const initializeSocket = useCallback(() => {
    const socketManager = SocketManager.getInstance();
    const newSocket = socketManager.connect();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      
      if (action === 'create' && playerName) {
        newSocket.emit('create-room', playerName);
      } else if (action === 'join' && playerName && roomId) {
        newSocket.emit('join-room', { roomId, playerName });
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('room-created', ({ roomId, player, gameState }) => {
      setCurrentPlayer(player);
      setGameState(gameState);
      router.replace(`/game?room=${roomId}`);
    });

    newSocket.on('room-joined', ({ player, gameState }) => {
      setCurrentPlayer(player);
      setGameState(gameState);
    });

    newSocket.on('player-joined', ({ gameState }) => {
      setGameState(gameState);
    });

    newSocket.on('player-left', ({ gameState }) => {
      setGameState(gameState);
    });

    newSocket.on('game-started', (newGameState) => {
      setGameState(newGameState);
    });

    newSocket.on('word-selected', (newGameState) => {
      setGameState(newGameState);
    });

    newSocket.on('draw', (drawData: DrawData) => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          drawingData: [...prev.drawingData, drawData]
        };
      });
    });

    newSocket.on('clear-canvas', () => {
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          drawingData: []
        };
      });
    });

    newSocket.on('chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, { ...message, timestamp: Date.now() }]);
    });

    newSocket.on('correct-guess', ({ message, gameState }) => {
      setChatMessages(prev => [...prev, {
        playerId: 'system',
        playerName: 'System',
        message,
        isGuess: false,
        timestamp: Date.now()
      }]);
      setGameState(gameState);
    });

    newSocket.on('game-state-update', (newGameState) => {
      setGameState(newGameState);
    });

    newSocket.on('error', (errorMessage) => {
      setError(errorMessage);
    });

    // Request game state updates every second
    const interval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('get-game-state');
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('room-created');
      newSocket.off('room-joined');
      newSocket.off('player-joined');
      newSocket.off('player-left');
      newSocket.off('game-started');
      newSocket.off('word-selected');
      newSocket.off('draw');
      newSocket.off('clear-canvas');
      newSocket.off('chat-message');
      newSocket.off('correct-guess');
      newSocket.off('game-state-update');
      newSocket.off('error');
    };
  }, [action, playerName, roomId, router]);

  useEffect(() => {
    const cleanup = initializeSocket();
    return cleanup;
  }, [initializeSocket]);

  const handleStartGame = () => {
    if (socket) {
      socket.emit('start-game');
    }
  };

  const handleSelectWord = (word: string) => {
    if (socket) {
      socket.emit('select-word', word);
    }
  };

  const handleDraw = (drawData: DrawData) => {
    if (socket) {
      socket.emit('draw', drawData);
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          drawingData: [...prev.drawingData, drawData]
        };
      });
    }
  };

  const handleClearCanvas = () => {
    if (socket) {
      socket.emit('clear-canvas');
      setGameState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          drawingData: []
        };
      });
    }
  };

  const handleSendMessage = (message: string) => {
    if (socket) {
      socket.emit('chat-message', message);
    }
  };

  const handleGuess = (guess: string) => {
    if (socket) {
      socket.emit('guess', guess);
    }
  };

  const handlePlayAgain = () => {
    router.push('/');
  };

  if (error) {
    return (
      <div className="min-h-screen bg-red-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!isConnected || !gameState || !currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to game...</p>
        </div>
      </div>
    );
  }

  const isCurrentPlayerDrawing = currentPlayer.id === gameState.currentDrawer;

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <GameHeader gameState={gameState} currentPlayer={currentPlayer} />
        
        {gameState.gameState === 'waiting' && (
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Waiting for players...</h2>
            <p className="text-gray-600 mb-6">
              {gameState.players.length < 2 
                ? 'Need at least 2 players to start'
                : 'Ready to start!'}
            </p>
            {gameState.players.length >= 2 && (
              <button
                onClick={handleStartGame}
                className="px-8 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
              >
                Start Game
              </button>
            )}
          </div>
        )}

        {gameState.gameState === 'choosing' && isCurrentPlayerDrawing && (
          <WordSelection
            words={gameState.wordChoices}
            onSelectWord={handleSelectWord}
          />
        )}

        {gameState.gameState === 'choosing' && !isCurrentPlayerDrawing && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">
              {gameState.players.find(p => p.id === gameState.currentDrawer)?.name} is choosing a word...
            </h2>
            <div className="animate-pulse text-gray-600">Please wait...</div>
          </div>
        )}

        {gameState.gameState === 'drawing' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <Canvas
                isDrawing={isCurrentPlayerDrawing}
                onDraw={handleDraw}
                onClear={handleClearCanvas}
                drawingData={gameState.drawingData}
              />
            </div>
            
            <div className="space-y-6">
              <PlayerList
                players={gameState.players}
                currentDrawer={gameState.currentDrawer}
              />
              
              <Chat
                messages={chatMessages}
                onSendMessage={handleSendMessage}
                onGuess={handleGuess}
                isDrawing={isCurrentPlayerDrawing}
              />
            </div>
          </div>
        )}

        {gameState.gameState === 'finished' && (
          <GameResults
            players={gameState.players}
            onPlayAgain={handlePlayAgain}
          />
        )}
      </div>
    </div>
  );
}

export default function Game() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading game...</p>
        </div>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}