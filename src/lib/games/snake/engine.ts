export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";
export interface Position {
  x: number;
  y: number;
}

export interface SnakeState {
  snake: Position[]; // index 0 = head
  direction: Direction;
  pendingDirection: Direction; // buffers the next input so a fast double-press can't reverse into itself mid-tick
  food: Position;
  score: number;
  isGameOver: boolean;
  gridSize: number;
}

const OPPOSITES: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
};

export const POINTS_PER_FOOD = 10;
/** Every N foods eaten, tick speed increases (see getSpeedMs). */
const SPEED_UP_EVERY_N_FOODS = 5;
const BASE_TICK_MS = 160;
const MIN_TICK_MS = 70;

export function createInitialState(gridSize = 20): SnakeState {
  const center = Math.floor(gridSize / 2);
  return {
    snake: [
      { x: center, y: center },
      { x: center - 1, y: center },
      { x: center - 2, y: center },
    ],
    direction: "RIGHT",
    pendingDirection: "RIGHT",
    food: spawnFood([{ x: center, y: center }], gridSize),
    score: 0,
    isGameOver: false,
    gridSize,
  };
}

export function spawnFood(snake: Position[], gridSize: number): Position {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`));
  const free: Position[] = [];
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
    }
  }
  if (free.length === 0) return snake[0]; // board full — extremely rare in practice
  return free[Math.floor(Math.random() * free.length)];
}

/** Queues a direction change; ignored if it would immediately reverse the snake into itself. */
export function queueDirection(state: SnakeState, direction: Direction): SnakeState {
  if (OPPOSITES[direction] === state.direction) return state;
  return { ...state, pendingDirection: direction };
}

/** Advances the game by one tick. Pure function — returns a new state, never mutates. */
export function tick(state: SnakeState): SnakeState {
  if (state.isGameOver) return state;

  const direction = state.pendingDirection;
  const head = state.snake[0];
  const nextHead: Position = {
    x: head.x + (direction === "LEFT" ? -1 : direction === "RIGHT" ? 1 : 0),
    y: head.y + (direction === "UP" ? -1 : direction === "DOWN" ? 1 : 0),
  };

  const hitWall = nextHead.x < 0 || nextHead.x >= state.gridSize || nextHead.y < 0 || nextHead.y >= state.gridSize;
  const willEat = nextHead.x === state.food.x && nextHead.y === state.food.y;
  // Tail cell is excluded from self-collision check when not eating, since it will move out of the way this tick.
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  const hitSelf = bodyToCheck.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y);

  if (hitWall || hitSelf) {
    return { ...state, direction, isGameOver: true };
  }

  const newSnake = willEat ? [nextHead, ...state.snake] : [nextHead, ...state.snake.slice(0, -1)];

  return {
    ...state,
    snake: newSnake,
    direction,
    food: willEat ? spawnFood(newSnake, state.gridSize) : state.food,
    score: willEat ? state.score + POINTS_PER_FOOD : state.score,
  };
}

/** Tick interval in ms — speeds up as the score climbs, floored at MIN_TICK_MS. */
export function getSpeedMs(score: number): number {
  const foodsEaten = Math.floor(score / POINTS_PER_FOOD);
  const speedLevel = Math.floor(foodsEaten / SPEED_UP_EVERY_N_FOODS);
  return Math.max(MIN_TICK_MS, BASE_TICK_MS - speedLevel * 12);
}
