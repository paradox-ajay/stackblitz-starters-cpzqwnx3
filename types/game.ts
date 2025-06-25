export interface Player {
  id: string;
  name: string;
  score: number;
  isDrawing: boolean;
  hasGuessed: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  currentDrawer: string | null;
  currentWord: string | null;
  wordChoices: string[];
  gameState: 'waiting' | 'choosing' | 'drawing' | 'finished';
  timeLeft: number;
  round: number;
  maxRounds: number;
  drawingData: DrawData[];
}

export interface DrawData {
  type: 'start' | 'draw' | 'end';
  x: number;
  y: number;
  color: string;
  size: number;
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  message: string;
  isGuess: boolean;
  timestamp?: number;
}