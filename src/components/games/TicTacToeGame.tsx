"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Circle } from "lucide-react";
import { GameShell } from "@/components/games/GameShell";
import { GameOverOverlay } from "@/components/games/GameOverOverlay";
import { Select } from "@/components/ui/Select";
import { useGameSession } from "@/hooks/useGameSession";
import { audioManager } from "@/lib/gameEngine/AudioManager";
import {
  createEmptyBoard,
  getWinner,
  isDraw,
  getAIMove,
  type Board,
  type Difficulty,
} from "@/lib/games/ticTacToe/engine";
import { cn } from "@/lib/utils";

const HUMAN = "X";
const AI = "O";
const AI_THINK_DELAY_MS = 500;

const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard (Unbeatable)" },
];

export function TicTacToeGame() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isPaused, setIsPaused] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [wins, setWins] = useState(0);

  const { elapsedSeconds, startSession, endSession, pauseTimer, resumeTimer } = useGameSession({
    gameSlug: "tic-tac-toe",
  });

  const { winner, line } = getWinner(board);
  const draw = isDraw(board);
  const isGameOver = winner !== null || draw;
  const isHumanTurn = !isGameOver && !isPaused && !aiThinking;

  const newGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setAiThinking(false);
    setIsPaused(false);
    void startSession({ difficulty });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  useEffect(() => {
    newGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AI turn
  useEffect(() => {
    if (isGameOver || isPaused) return;
    const humanCells = board.filter((c) => c === HUMAN).length;
    const aiCells = board.filter((c) => c === AI).length;
    if (humanCells <= aiCells) return; // it's human's turn

    setAiThinking(true);
    const timeout = setTimeout(() => {
      const move = getAIMove(board, AI, HUMAN, difficulty);
      const next = [...board];
      next[move] = AI;
      setBoard(next);
      audioManager.play("move");
      setAiThinking(false);
    }, AI_THINK_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [board, difficulty, isGameOver, isPaused]);

  // Game-over side effects: sound + session end
  useEffect(() => {
    if (!isGameOver) return;

    if (winner === HUMAN) {
      audioManager.play("win");
      setWins((w) => w + 1);
      void endSession({ result: "WIN", score: 1 });
    } else if (winner === AI) {
      audioManager.play("lose");
      void endSession({ result: "LOSS", score: 0 });
    } else {
      audioManager.play("draw");
      void endSession({ result: "DRAW", score: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameOver]);

  function handleCellClick(index: number) {
    if (!isHumanTurn || board[index] !== null) {
      if (board[index] !== null) audioManager.play("error");
      return;
    }
    const next = [...board];
    next[index] = HUMAN;
    setBoard(next);
    audioManager.play("move");
  }

  function handlePause() {
    setIsPaused(true);
    pauseTimer();
  }
  function handleResume() {
    setIsPaused(false);
    resumeTimer();
  }

  const statusLabel = isGameOver
    ? winner === HUMAN
      ? "You Won!"
      : winner === AI
        ? "AI Won"
        : "Draw"
    : aiThinking
      ? "AI Thinking..."
      : "Your Turn";

  return (
    <GameShell
      title="Tic Tac Toe"
      score={wins}
      elapsedSeconds={elapsedSeconds}
      isPaused={isPaused}
      isGameOver={isGameOver}
      statusLabel={statusLabel}
      onPause={handlePause}
      onResume={handleResume}
      onRestart={newGame}
      toolbar={
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted">Difficulty</span>
          <Select
            options={difficultyOptions}
            value={difficulty}
            onChange={(v) => setDifficulty(v as Difficulty)}
            className="w-48"
          />
        </div>
      }
    >
      <div className="relative mx-auto grid w-full max-w-sm grid-cols-3 gap-3">
        {isGameOver && (
          <GameOverOverlay
            outcome={winner === HUMAN ? "win" : winner === AI ? "lose" : "draw"}
            title={winner === HUMAN ? "You Won!" : winner === AI ? "AI Wins" : "It's a Draw"}
            description={
              winner === HUMAN ? "Well played." : winner === AI ? "Better luck next round." : "Evenly matched."
            }
            onPlayAgain={newGame}
          />
        )}

        {board.map((cell, index) => (
          <button
            key={index}
            onClick={() => handleCellClick(index)}
            disabled={!isHumanTurn || cell !== null}
            aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ", empty"}`}
            className={cn(
              "flex aspect-square items-center justify-center rounded-2xl border transition-colors",
              line?.includes(index)
                ? "border-accent/60 bg-accent/10"
                : "border-white/10 bg-white/[0.02] hover:bg-white/5",
              isHumanTurn && cell === null && "cursor-pointer"
            )}
          >
            {cell && (
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                {cell === "X" ? (
                  <X className="h-10 w-10 text-primary sm:h-14 sm:w-14" strokeWidth={3} />
                ) : (
                  <Circle className="h-10 w-10 text-secondary sm:h-14 sm:w-14" strokeWidth={3} />
                )}
              </motion.span>
            )}
          </button>
        ))}
      </div>
    </GameShell>
  );
}
