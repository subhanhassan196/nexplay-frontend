"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "@/components/games/GameShell";
import { GameOverOverlay } from "@/components/games/GameOverOverlay";
import { Select } from "@/components/ui/Select";
import { useGameSession } from "@/hooks/useGameSession";
import { audioManager } from "@/lib/gameEngine/AudioManager";
import {
  createEmptyBoard,
  dropDisc,
  getWinner,
  isBoardFull,
  getValidColumns,
  getAIMove,
  ROWS,
  COLS,
  type Board,
  type Difficulty,
} from "@/lib/games/connectFour/engine";
import { cn } from "@/lib/utils";

const HUMAN = "RED";
const AI = "YELLOW";
const AI_THINK_DELAY_MS = 550;

const difficultyOptions = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export function ConnectFourGame() {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [isPaused, setIsPaused] = useState(false);
  const [isHumanTurnState, setIsHumanTurnState] = useState(true);
  const [wins, setWins] = useState(0);

  const { elapsedSeconds, startSession, endSession, pauseTimer, resumeTimer } = useGameSession({
    gameSlug: "connect-four",
  });

  const { winner, cells } = getWinner(board);
  const draw = !winner && isBoardFull(board);
  const isGameOver = winner !== null || draw;
  const canHumanClick = !isGameOver && !isPaused && isHumanTurnState;

  const newGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setIsHumanTurnState(true);
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
    if (isGameOver || isPaused || isHumanTurnState) return;

    const timeout = setTimeout(() => {
      const col = getAIMove(board, AI, HUMAN, difficulty);
      const result = dropDisc(board, col, AI);
      if (result) {
        setBoard(result.board);
        audioManager.play("move");
      }
      setIsHumanTurnState(true);
    }, AI_THINK_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [board, isHumanTurnState, difficulty, isGameOver, isPaused]);

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

  function handleColumnClick(col: number) {
    if (!canHumanClick) return;
    const result = dropDisc(board, col, HUMAN);
    if (!result) {
      audioManager.play("error");
      return;
    }
    setBoard(result.board);
    audioManager.play("move");
    setIsHumanTurnState(false);
  }

  function handlePause() {
    setIsPaused(true);
    pauseTimer();
  }
  function handleResume() {
    setIsPaused(false);
    resumeTimer();
  }

  const validColumns = new Set(getValidColumns(board));
  const isCellWinning = (col: number, row: number) => cells?.some(([c, r]) => c === col && r === row) ?? false;

  const statusLabel = isGameOver
    ? winner === HUMAN
      ? "You Won!"
      : winner === AI
        ? "AI Won"
        : "Draw"
    : isHumanTurnState
      ? "Your Turn"
      : "AI Thinking...";

  return (
    <GameShell
      title="Connect Four"
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
      <div className="relative mx-auto w-full max-w-lg">
        {isGameOver && (
          <GameOverOverlay
            outcome={winner === HUMAN ? "win" : winner === AI ? "lose" : "draw"}
            title={winner === HUMAN ? "You Won!" : winner === AI ? "AI Wins" : "It's a Draw"}
            description={
              winner === HUMAN ? "Four in a row!" : winner === AI ? "Better luck next round." : "Board's full."
            }
            onPlayAgain={newGame}
          />
        )}

        <div className="rounded-2xl bg-primary/10 p-3">
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: COLS }).map((_, col) => (
              <button
                key={col}
                onClick={() => handleColumnClick(col)}
                disabled={!canHumanClick || !validColumns.has(col)}
                aria-label={`Drop disc in column ${col + 1}`}
                className={cn(
                  "flex flex-col gap-2 rounded-xl p-1 transition-colors",
                  canHumanClick && validColumns.has(col) && "cursor-pointer hover:bg-white/5"
                )}
              >
                {/* Render bottom-to-top visually: row 0 (bottom) should appear at the bottom of the column */}
                {Array.from({ length: ROWS })
                  .map((_, i) => ROWS - 1 - i)
                  .map((row) => {
                    const cell = board[col * ROWS + row];
                    return (
                      <div
                        key={row}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-full bg-background",
                          isCellWinning(col, row) && "ring-2 ring-accent"
                        )}
                      >
                        {cell && (
                          <motion.span
                            initial={{ y: -240, opacity: 0.5 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 22 }}
                            className={cn(
                              "h-full w-full rounded-full",
                              cell === "RED" ? "bg-danger shadow-glow-primary" : "bg-accent"
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-danger" /> You
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-accent" /> AI
          </span>
        </div>
      </div>
    </GameShell>
  );
}
