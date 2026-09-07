export type Player = "RED" | "YELLOW";
export type Cell = Player | null;

export const ROWS = 6;
export const COLS = 7;

/** Column-major flat array: board[col * ROWS + row]. Row 0 = bottom. */
export type Board = Cell[];

export function createEmptyBoard(): Board {
  return Array<Cell>(ROWS * COLS).fill(null);
}

function at(board: Board, col: number, row: number): Cell {
  return board[col * ROWS + row];
}

/** Returns the row a disc would land on in `col`, or -1 if the column is full. */
export function getLandingRow(board: Board, col: number): number {
  for (let row = 0; row < ROWS; row++) {
    if (at(board, col, row) === null) return row;
  }
  return -1;
}

export function dropDisc(board: Board, col: number, player: Player): { board: Board; row: number } | null {
  const row = getLandingRow(board, col);
  if (row === -1) return null;
  const next = [...board];
  next[col * ROWS + row] = player;
  return { board: next, row };
}

const DIRECTIONS = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal /
  [1, -1], // diagonal \
] as const;

export function getWinner(board: Board): { winner: Player | null; cells: [number, number][] | null } {
  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const player = at(board, col, row);
      if (!player) continue;

      for (const [dc, dr] of DIRECTIONS) {
        const cells: [number, number][] = [[col, row]];
        for (let step = 1; step < 4; step++) {
          const c = col + dc * step;
          const r = row + dr * step;
          if (c < 0 || c >= COLS || r < 0 || r >= ROWS || at(board, c, r) !== player) break;
          cells.push([c, r]);
        }
        if (cells.length === 4) return { winner: player, cells };
      }
    }
  }
  return { winner: null, cells: null };
}

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export function isGameOver(board: Board): boolean {
  return getWinner(board).winner !== null || isBoardFull(board);
}

export function getValidColumns(board: Board): number[] {
  const cols: number[] = [];
  for (let col = 0; col < COLS; col++) if (getLandingRow(board, col) !== -1) cols.push(col);
  return cols;
}

export type Difficulty = "easy" | "medium" | "hard";

/** Heuristic score of a 4-cell window for the given player — favors near-complete lines. */
function scoreWindow(cells: Cell[], player: Player, opponent: Player): number {
  const playerCount = cells.filter((c) => c === player).length;
  const opponentCount = cells.filter((c) => c === opponent).length;
  const emptyCount = cells.filter((c) => c === null).length;

  if (playerCount === 4) return 100;
  if (playerCount === 3 && emptyCount === 1) return 5;
  if (playerCount === 2 && emptyCount === 2) return 2;
  if (opponentCount === 3 && emptyCount === 1) return -4; // block opponent's near-win
  return 0;
}

function evaluateBoard(board: Board, player: Player, opponent: Player): number {
  let score = 0;

  // Center column control is strategically valuable in Connect Four.
  for (let row = 0; row < ROWS; row++) {
    if (at(board, Math.floor(COLS / 2), row) === player) score += 3;
  }

  for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      for (const [dc, dr] of DIRECTIONS) {
        const endCol = col + dc * 3;
        const endRow = row + dr * 3;
        if (endCol < 0 || endCol >= COLS || endRow < 0 || endRow >= ROWS) continue;
        const window = [0, 1, 2, 3].map((i) => at(board, col + dc * i, row + dr * i));
        score += scoreWindow(window, player, opponent);
      }
    }
  }

  return score;
}

function alphaBeta(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  maximizing: boolean,
  ai: Player,
  human: Player
): number {
  const { winner } = getWinner(board);
  if (winner === ai) return 1_000_000 + depth;
  if (winner === human) return -1_000_000 - depth;
  if (isBoardFull(board) || depth === 0) return evaluateBoard(board, ai, human);

  const columns = getValidColumns(board);

  if (maximizing) {
    let value = -Infinity;
    for (const col of columns) {
      const result = dropDisc(board, col, ai);
      if (!result) continue;
      value = Math.max(value, alphaBeta(result.board, depth - 1, alpha, beta, false, ai, human));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  }

  let value = Infinity;
  for (const col of columns) {
    const result = dropDisc(board, col, human);
    if (!result) continue;
    value = Math.min(value, alphaBeta(result.board, depth - 1, alpha, beta, true, ai, human));
    beta = Math.min(beta, value);
    if (alpha >= beta) break;
  }
  return value;
}

/**
 * Returns the AI's chosen column. Search depth scales with difficulty
 * — deeper search plays stronger but costs more CPU; depth 5 stays
 * comfortably under a frame budget in modern browsers for a 7x6 board.
 */
export function getAIMove(board: Board, ai: Player, human: Player, difficulty: Difficulty): number {
  const depth = difficulty === "hard" ? 5 : difficulty === "medium" ? 3 : 1;
  const columns = getValidColumns(board);
  if (columns.length === 0) throw new Error("No valid columns available for AI move");

  // Easy difficulty occasionally plays randomly instead of the evaluated best move.
  if (difficulty === "easy" && Math.random() < 0.4) {
    return columns[Math.floor(Math.random() * columns.length)];
  }

  let bestScore = -Infinity;
  let bestCol = columns[Math.floor(columns.length / 2)]; // prefer center as tiebreak default

  for (const col of columns) {
    const result = dropDisc(board, col, ai);
    if (!result) continue;
    const score = alphaBeta(result.board, depth - 1, -Infinity, Infinity, false, ai, human);
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }
  return bestCol;
}
