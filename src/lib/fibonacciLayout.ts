export type SpiralDirection = 'right' | 'down' | 'left' | 'up';

export interface SpiralTile {
  index: number;
  side: number;
  x: number;
  y: number;
  centerX: number;
  centerY: number;
  direction: SpiralDirection;
  directionDegrees: number;
  rotationTravelDegrees: number;
}

export interface LayoutBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export type SpiralAxis = 'horizontal' | 'vertical';

function rotateVector(x: number, y: number, degrees: number): { x: number; y: number } {
  switch (degrees) {
    case -90:
      return { x: y, y: -x };
    case 90:
      return { x: -y, y: x };
    case 180:
      return { x: -x, y: -y };
    default:
      return { x, y };
  }
}

const directions: SpiralDirection[] = ['right', 'down', 'left', 'up'];
const directionDegrees: Record<SpiralDirection, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270,
};

export function fibonacciNumbers(count: number): number[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('Page count must be a non-negative integer.');
  }
  if (count === 0) return [];
  if (count === 1) return [1];

  const values = [1, 1];
  while (values.length < count) {
    values.push(values[values.length - 1] + values[values.length - 2]);
  }
  return values.slice(0, count);
}

export function buildFibonacciLayout(
  count: number,
  unitSize = 256,
  axis: SpiralAxis = 'vertical',
): SpiralTile[] {
  if (!Number.isFinite(unitSize) || unitSize <= 0) {
    throw new RangeError('Unit size must be a positive finite number.');
  }
  const sides = fibonacciNumbers(count);
  if (count === 0) return [];

  let minX = 0;
  let minY = 0;
  let maxX = sides[0];
  let maxY = sides[0];

  const outwardTiles = sides.map((side, index) => {
    let x = 0;
    let y = 0;
    const direction = index === 0
      ? 'right'
      : directions[(index + directions.length - 1) % directions.length];

    if (index > 0) {
      switch (direction) {
        case 'right':
          x = maxX;
          y = minY;
          break;
        case 'down':
          x = minX;
          y = maxY;
          break;
        case 'left':
          x = minX - side;
          y = minY;
          break;
        case 'up':
          x = minX;
          y = minY - side;
          break;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + side);
      maxY = Math.max(maxY, y + side);
    }

    return { side, x, y, direction };
  });

  return outwardTiles.reverse().map((tile, index) => {
    const x = axis === 'horizontal' ? tile.y : tile.x;
    const y = axis === 'horizontal' ? tile.x : tile.y;
    const rotationDirection = axis === 'horizontal' ? 1 : -1;

    return {
      index,
      side: tile.side * unitSize,
      x: x * unitSize,
      y: y * unitSize,
      centerX: (x + tile.side / 2) * unitSize,
      centerY: (y + tile.side / 2) * unitSize,
      direction: tile.direction,
      directionDegrees: directionDegrees[tile.direction],
      rotationTravelDegrees: index * rotationDirection * 90,
    };
  });
}

export function buildStableFibonacciLayout(
  count: number,
  unitSize = 256,
  axis: SpiralAxis = 'vertical',
): SpiralTile[] {
  const tiles = buildFibonacciLayout(count, unitSize, axis);
  if (tiles.length < 2) return tiles;

  const first = tiles[0];
  const second = tiles[1];
  const bounds = getLayoutBounds(tiles);
  const matchesAxis = (angle: number) => {
    const delta = rotateVector(
      second.centerX - first.centerX,
      second.centerY - first.centerY,
      angle,
    );
    const isQuarterTurn = Math.abs(angle) === 90;
    const width = isQuarterTurn ? bounds.height : bounds.width;
    const height = isQuarterTurn ? bounds.width : bounds.height;
    return axis === 'horizontal'
      ? delta.x > 0 && delta.y <= 0 && width >= height
      : delta.y > 0 && height >= width;
  };
  const alignment = [0, -90, 90, 180].find(matchesAxis) ?? 0;
  if (alignment === 0) return tiles;

  const rotated = tiles.map((tile) => {
    const relativeX = tile.centerX - first.centerX;
    const relativeY = tile.centerY - first.centerY;
    const relative = rotateVector(relativeX, relativeY, alignment);
    const centerX = first.centerX + relative.x;
    const centerY = first.centerY + relative.y;

    return {
      ...tile,
      x: centerX - tile.side / 2,
      y: centerY - tile.side / 2,
      centerX,
      centerY,
    };
  });

  return rotated;
}

export function getLayoutBounds(tiles: SpiralTile[]): LayoutBounds {
  if (tiles.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0 };
  }

  const minX = Math.min(...tiles.map((tile) => tile.x));
  const minY = Math.min(...tiles.map((tile) => tile.y));
  const maxX = Math.max(...tiles.map((tile) => tile.x + tile.side));
  const maxY = Math.max(...tiles.map((tile) => tile.y + tile.side));
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    x: minX,
    y: minY,
    width,
    height,
    centerX: minX + width / 2,
    centerY: minY + height / 2,
  };
}
