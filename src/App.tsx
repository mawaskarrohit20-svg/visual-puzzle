/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Play, RotateCcw, Zap } from 'lucide-react';

// Constants
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 0.95; // 5% faster

type Point = { x: number; y: number };
type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [gameState, setGameState] = useState<GameState>('START');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const lastDirectionRef = useRef<Point>(INITIAL_DIRECTION);

  // Generate random food position
  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food is on snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    lastDirectionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setFood(generateFood(INITIAL_SNAKE));
    setGameState('PLAYING');
  };

  const gameOver = () => {
    setGameState('GAME_OVER');
    if (score > highScore) {
      setHighScore(score);
    }
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
  };

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      // Collision with walls
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        gameOver();
        return prevSnake;
      }

      // Collision with self
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        gameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check if food eaten
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + 1;
          // Difficulty scaling: 5% faster every 5 pieces
          if (newScore % 5 === 0) {
            setSpeed(prevSpeed => prevSpeed * SPEED_INCREMENT);
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      lastDirectionRef.current = direction;
      return newSnake;
    });
  }, [direction, food, generateFood]);

  // Game Loop
  useEffect(() => {
    if (gameState === 'PLAYING') {
      gameLoopRef.current = setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameState, moveSnake, speed]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const lastDir = lastDirectionRef.current;

      if (gameState === 'START' || gameState === 'GAME_OVER') {
        if (e.code === 'Space') resetGame();
        return;
      }

      switch (key) {
        case 'arrowup':
        case 'w':
          if (lastDir.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'arrowdown':
        case 's':
          if (lastDir.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'arrowleft':
        case 'a':
          if (lastDir.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'arrowright':
        case 'd':
          if (lastDir.x === 0) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-cyan-500/30">
      {/* Header Stats */}
      <div className="w-full max-w-[500px] flex justify-between items-center mb-6 px-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-cyan-400/60 font-bold">Score</span>
          <span className="text-3xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            {score.toString().padStart(3, '0')}
          </span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] uppercase tracking-widest text-fuchsia-400/60 font-bold">High Score</span>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-fuchsia-400" />
            <span className="text-3xl font-black text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]">
              {highScore.toString().padStart(3, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Game Board Container */}
      <div className="relative p-1 bg-gradient-to-br from-cyan-500 via-purple-500 to-fuchsia-500 rounded-xl shadow-[0_0_50px_rgba(139,92,246,0.3)]">
        <div 
          className="bg-[#0f0f1a] rounded-lg overflow-hidden relative"
          style={{
            width: 'min(90vw, 500px)',
            height: 'min(90vw, 500px)',
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
          }}
        >
          {/* Grid Background Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-5">
            {Array.from({ length: GRID_SIZE }).map((_, i) => (
              <React.Fragment key={i}>
                <div className="absolute w-full h-px bg-white" style={{ top: `${(i / GRID_SIZE) * 100}%` }} />
                <div className="absolute h-full w-px bg-white" style={{ left: `${(i / GRID_SIZE) * 100}%` }} />
              </React.Fragment>
            ))}
          </div>

          {/* Snake Rendering */}
          {snake.map((segment, i) => (
            <motion.div
              key={`${segment.x}-${segment.y}-${i}`}
              initial={false}
              animate={{
                gridColumnStart: segment.x + 1,
                gridRowStart: segment.y + 1,
              }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }}
              className={`
                rounded-sm z-10
                ${i === 0 
                  ? 'bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]' 
                  : 'bg-cyan-600/80'
                }
              `}
              style={{
                gridColumnStart: segment.x + 1,
                gridRowStart: segment.y + 1,
              }}
            />
          ))}

          {/* Food Rendering */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="bg-fuchsia-500 rounded-full shadow-[0_0_15px_rgba(232,121,249,1)] z-20"
            style={{
              gridColumnStart: food.x + 1,
              gridRowStart: food.y + 1,
              margin: '15%',
            }}
          />

          {/* Overlays */}
          <AnimatePresence>
            {gameState === 'START' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8"
              >
                <motion.h1 
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  className="text-5xl font-black mb-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-fuchsia-500 italic uppercase tracking-tighter"
                >
                  Neon Snake
                </motion.h1>
                <p className="text-cyan-400/60 text-sm mb-8 font-medium tracking-wide">MASTER THE GRID. ESCAPE THE VOID.</p>
                <button 
                  onClick={resetGame}
                  className="group relative px-8 py-4 bg-cyan-500 text-[#0a0a0f] font-black rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className="relative flex items-center gap-2">
                    <Play size={20} fill="currentColor" />
                    START MISSION
                  </span>
                </button>
                <div className="mt-8 flex gap-4 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  <span className="px-2 py-1 border border-white/10 rounded">WASD / ARROWS</span>
                  <span className="px-2 py-1 border border-white/10 rounded">SPACE TO RESTART</span>
                </div>
              </motion.div>
            )}

            {gameState === 'GAME_OVER' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-50 bg-red-500/20 backdrop-blur-md flex flex-col items-center justify-center text-center p-8"
              >
                <h2 className="text-6xl font-black text-white mb-2 italic tracking-tighter drop-shadow-lg">CRASHED</h2>
                <div className="bg-black/40 px-6 py-3 rounded-2xl mb-8 border border-white/10">
                  <p className="text-white/60 text-xs uppercase tracking-widest font-bold mb-1">Final Score</p>
                  <p className="text-4xl font-black text-cyan-400">{score}</p>
                </div>
                <button 
                  onClick={resetGame}
                  className="group flex items-center gap-2 px-8 py-4 bg-white text-black font-black rounded-full transition-all hover:bg-cyan-400 hover:scale-105 active:scale-95"
                >
                  <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                  RETRY MISSION
                </button>
                <p className="mt-4 text-white/40 text-[10px] font-bold uppercase tracking-widest animate-pulse">Press Space to Restart</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-12 flex items-center gap-8 opacity-40">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-yellow-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Speed: {Math.round(150/speed * 100)}%</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Grid: {GRID_SIZE}x{GRID_SIZE}</span>
      </div>
    </div>
  );
}
