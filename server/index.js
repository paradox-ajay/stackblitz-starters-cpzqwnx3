const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Game state
const rooms = new Map();
const words = [
  'cat', 'dog', 'house', 'tree', 'car', 'book', 'phone', 'computer', 'pizza', 'flower',
  'mountain', 'ocean', 'guitar', 'bicycle', 'camera', 'butterfly', 'rainbow', 'castle',
  'elephant', 'penguin', 'dragon', 'rocket', 'sandwich', 'umbrella', 'lighthouse',
  'dinosaur', 'spaceship', 'treasure', 'volcano', 'waterfall', 'keyboard', 'headphones',
  'telescope', 'microscope', 'hamburger', 'ice cream', 'birthday cake', 'christmas tree',
  'snowman', 'fireworks', 'balloon', 'roller coaster', 'ferris wheel', 'bike',
  'apple', 'mobile', 'chair', 'table', 'window', 'android'
];

class GameRoom {
  constructor(id) {
    this.id = id;
    this.players = new Map();
    this.currentDrawer = null;
    this.currentWord = null;
    this.wordChoices = [];
    this.gameState = 'waiting'; // waiting, choosing, drawing, finished
    this.roundTime = 80;
    this.timeLeft = 0;
    this.round = 1;
    this.maxRounds = 3;
    this.drawingData = [];
    this.timer = null;
    this.guessedPlayers = new Set();
  }

  addPlayer(socket, name) {
    const player = {
      id: socket.id,
      name: name,
      score: 0,
      isDrawing: false,
      hasGuessed: false
    };
    this.players.set(socket.id, player);
    return player;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    if (this.currentDrawer === socketId) {
      this.nextTurn();
    }
  }

  startGame() {
    if (this.players.size < 2) return false;
    
    this.gameState = 'choosing';
    this.round = 1;
    this.selectNextDrawer();
    return true;
  }

  selectNextDrawer() {
    const playerIds = Array.from(this.players.keys());
    if (playerIds.length === 0) return;

    if (!this.currentDrawer) {
      this.currentDrawer = playerIds[0];
    } else {
      const currentIndex = playerIds.indexOf(this.currentDrawer);
      const nextIndex = (currentIndex + 1) % playerIds.length;
      this.currentDrawer = playerIds[nextIndex];
      
      if (nextIndex === 0) {
        this.round++;
        if (this.round > this.maxRounds) {
          this.endGame();
          return;
        }
      }
    }

    this.players.forEach(player => {
      player.isDrawing = player.id === this.currentDrawer;
      player.hasGuessed = false;
    });

    this.guessedPlayers.clear();
    this.generateWordChoices();
    this.gameState = 'choosing';
  }

  generateWordChoices() {
    this.wordChoices = [];
    const shuffled = [...words].sort(() => 0.5 - Math.random());
    this.wordChoices = shuffled.slice(0, 3);
  }

  selectWord(word) {
    this.currentWord = word;
    this.gameState = 'drawing';
    this.timeLeft = this.roundTime;
    this.drawingData = [];
    this.startTimer();
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      this.timeLeft--;
      
      if (this.timeLeft <= 0) {
        this.nextTurn();
      }
    }, 1000);
  }

  nextTurn() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.selectNextDrawer();
  }

  endGame() {
    this.gameState = 'finished';
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  makeGuess(playerId, guess) {
    if (this.gameState !== 'drawing' || playerId === this.currentDrawer) {
      return { correct: false, message: null };
    }

    const player = this.players.get(playerId);
    if (!player || player.hasGuessed) {
      return { correct: false, message: null };
    }

    const isCorrect = guess.toLowerCase().trim() === this.currentWord.toLowerCase();
    
    if (isCorrect) {
      player.hasGuessed = true;
      this.guessedPlayers.add(playerId);
      
      // Award points
      const drawerPoints = 10;
      const guesserPoints = Math.max(10, Math.floor(this.timeLeft / 2));
      
      player.score += guesserPoints;
      const drawer = this.players.get(this.currentDrawer);
      if (drawer) {
        drawer.score += drawerPoints;
      }

      // Check if all players have guessed
      const nonDrawerCount = this.players.size - 1;
      if (this.guessedPlayers.size === nonDrawerCount) {
        setTimeout(() => this.nextTurn(), 2000);
      }

      return { correct: true, message: `${player.name} guessed the word!` };
    }

    return { correct: false, message: null };
  }

  getGameState() {
    return {
      id: this.id,
      players: Array.from(this.players.values()),
      currentDrawer: this.currentDrawer,
      currentWord: this.currentWord,
      wordChoices: this.wordChoices,
      gameState: this.gameState,
      timeLeft: this.timeLeft,
      round: this.round,
      maxRounds: this.maxRounds,
      drawingData: this.drawingData
    };
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (playerName) => {
    const roomId = uuidv4().substring(0, 6).toUpperCase();
    const room = new GameRoom(roomId);
    rooms.set(roomId, room);
    
    const player = room.addPlayer(socket, playerName);
    socket.join(roomId);
    socket.roomId = roomId;
    
    socket.emit('room-created', { roomId, player, gameState: room.getGameState() });
  });

  socket.on('join-room', ({ roomId, playerName }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.players.size >= 8) {
      socket.emit('error', 'Room is full');
      return;
    }

    const player = room.addPlayer(socket, playerName);
    socket.join(roomId);
    socket.roomId = roomId;
    
    socket.emit('room-joined', { player, gameState: room.getGameState() });
    socket.to(roomId).emit('player-joined', { player, gameState: room.getGameState() });
  });

  socket.on('start-game', () => {
    const room = rooms.get(socket.roomId);
    if (!room) return;

    if (room.startGame()) {
      io.to(socket.roomId).emit('game-started', room.getGameState());
    }
  });

  socket.on('select-word', (word) => {
    const room = rooms.get(socket.roomId);
    if (!room || room.currentDrawer !== socket.id) return;

    room.selectWord(word);
    io.to(socket.roomId).emit('word-selected', room.getGameState());
  });

  socket.on('draw', (drawData) => {
    const room = rooms.get(socket.roomId);
    if (!room || room.currentDrawer !== socket.id) return;

    room.drawingData.push(drawData);
    socket.to(socket.roomId).emit('draw', drawData);
  });

  socket.on('clear-canvas', () => {
    const room = rooms.get(socket.roomId);
    if (!room || room.currentDrawer !== socket.id) return;

    room.drawingData = [];
    socket.to(socket.roomId).emit('clear-canvas');
  });

  socket.on('guess', (guess) => {
    const room = rooms.get(socket.roomId);
    if (!room) return;

    const result = room.makeGuess(socket.id, guess);
    
    if (result.correct) {
      io.to(socket.roomId).emit('correct-guess', {
        playerId: socket.id,
        message: result.message,
        gameState: room.getGameState()
      });
    } else {
      const player = room.players.get(socket.id);
      if (player) {
        io.to(socket.roomId).emit('chat-message', {
          playerId: socket.id,
          playerName: player.name,
          message: guess,
          isGuess: true
        });
      }
    }
  });

  socket.on('chat-message', (message) => {
    const room = rooms.get(socket.roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (player) {
      io.to(socket.roomId).emit('chat-message', {
        playerId: socket.id,
        playerName: player.name,
        message: message,
        isGuess: false
      });
    }
  });

  socket.on('get-game-state', () => {
    const room = rooms.get(socket.roomId);
    if (room) {
      socket.emit('game-state-update', room.getGameState());
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      if (room) {
        room.removePlayer(socket.id);
        
        if (room.players.size === 0) {
          rooms.delete(socket.roomId);
        } else {
          socket.to(socket.roomId).emit('player-left', {
            playerId: socket.id,
            gameState: room.getGameState()
          });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
  console.log(`CORS enabled for all origins`);
});