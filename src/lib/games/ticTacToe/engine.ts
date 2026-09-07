export type Player = "X" | "O";
export type Cell = Player | null;
export type Board = Cell[]; // length 9, row-major

export const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6], // diagonals
] as const;

export function createEmptyBoard(): Board {
  return Array<Cell>(9).fill(null);
}

export function getWinner(board: Board): { winner: Player | null; line: readonly number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line };
    }
  }
  return { winner: null, line: null };
}

export function isDraw(board: Board): boolean {
  return board.every((cell) => cell !== null) && getWinner(board).winner === null;
}

export function isGameOver(board: Board): boolean {
  return getWinner(board).winner !== null || isDraw(board);
}

export function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => (cell === null ? [...acc, i] : acc), []);
}

export type Difficulty = "easy" | "medium" | "hard";

/** Full minimax — Tic Tac Toe's search space (≤9! states) is tiny, so no pruning/depth-limit is needed for perfect play. */
function minimax(board: Board, player: Player, ai: Player, human: Player): number {
  const { winner } = getWinner(board);
  if (winner === ai) return 1;
  if (winner === human) return -1;
  if (isDraw(board)) return 0;

  const scores = getEmptyCells(board).map((cell) => {
    const next = [...board];
    next[cell] = player;
    return minimax(next, player === ai ? human : ai, ai, human);
  });

  return player === ai ? Math.max(...scores) : Math.min(...scores);
}

function findBestMove(board: Board, ai: Player, human: Player): number {
  let bestScore = -Infinity;
  let bestMove = getEmptyCells(board)[0];

  for (const cell of getEmptyCells(board)) {
    const next = [...board];
    next[cell] = ai;
    const score = minimax(next, human, ai, human);
    if (score > bestScore) {
      bestScore = score;
      bestMove = cell;
    }
  }
  return bestMove;
}

/**
 * Returns the AI's move for a given difficulty:
 * - hard: always plays the optimal minimax move (unbeatable)
 * - medium: optimal move 65% of the time, random the rest
 * - easy: optimal move 20% of the time, random the rest
 */
export function getAIMove(board: Board, ai: Player, human: Player, difficulty: Difficulty): number {
  const empty = getEmptyCells(board);
  if (empty.length === 0) throw new Error("No empty cells available for AI move");

  const optimalChance = difficulty === "hard" ? 1 : difficulty === "medium" ? 0.65 : 0.2;

  if (Math.random() < optimalChance) {
    return findBestMove(board, ai, human);
  }
  return empty[Math.floor(Math.random() * empty.length)];
}
