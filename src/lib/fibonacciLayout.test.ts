import { describe, expect, it } from 'vitest';
import { getCameraPose } from './cameraMath';
import {
  buildFibonacciLayout,
  buildStableFibonacciLayout,
  fibonacciNumbers,
  getLayoutBounds,
} from './fibonacciLayout';

describe('Fibonacci layout', () => {
  it('starts with non-zero Fibonacci side lengths', () => {
    expect(fibonacciNumbers(8)).toEqual([1, 1, 2, 3, 5, 8, 13, 21]);
  });

  it('returns no tiles for an empty page set', () => {
    expect(buildFibonacciLayout(0)).toEqual([]);
    expect(getLayoutBounds([])).toEqual({
      x: 0, y: 0, width: 0, height: 0, centerX: 0, centerY: 0,
    });
  });

  it('places the largest page outside and decreases page sizes toward the center', () => {
    const tiles = buildFibonacciLayout(12, 10);

    expect(new Set(tiles.map((tile) => `${tile.centerX},${tile.centerY}`)).size).toBe(tiles.length);
    expect(tiles.map((tile) => tile.side)).toEqual(
      [144, 89, 55, 34, 21, 13, 8, 5, 3, 2, 1, 1].map((side) => side * 10),
    );

    for (let first = 0; first < tiles.length; first += 1) {
      for (let second = first + 1; second < tiles.length; second += 1) {
        const a = tiles[first];
        const b = tiles[second];
        const overlapX = Math.min(a.x + a.side, b.x + b.side) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.side, b.y + b.side) - Math.max(a.y, b.y);
        expect(overlapX > 0 && overlapY > 0).toBe(false);
      }
    }

    for (let index = 0; index < tiles.length - 1; index += 1) {
      const current = tiles[index];
      const next = tiles[index + 1];
      const sharesVerticalEdge = (
        current.x + current.side === next.x || next.x + next.side === current.x
      ) && Math.min(current.y + current.side, next.y + next.side) > Math.max(current.y, next.y);
      const sharesHorizontalEdge = (
        current.y + current.side === next.y || next.y + next.side === current.y
      ) && Math.min(current.x + current.side, next.x + next.side) > Math.max(current.x, next.x);
      expect(sharesVerticalEdge || sharesHorizontalEdge).toBe(true);
    }

    expect(tiles[0].rotationTravelDegrees).toBeCloseTo(0);
    expect(tiles[1].rotationTravelDegrees).toBe(-90);
  });

  it('turns the spiral up and right on wide viewports', () => {
    for (const count of [3, 5, 8]) {
      const tiles = buildStableFibonacciLayout(count, 10, 'horizontal');
      const first = tiles[0];
      const second = tiles[1];

      expect(second.centerX).toBeGreaterThan(first.centerX);
      expect(second.centerY).toBeLessThan(first.centerY);
      expect(tiles[1].rotationTravelDegrees).toBe(90);
    }
  });

  it('continues downward on tall viewports', () => {
    for (const count of [3, 5, 8]) {
      const tiles = buildStableFibonacciLayout(count, 10, 'vertical');

      expect(tiles[1].centerY).toBeGreaterThan(tiles[0].centerY);
      expect(tiles[1].rotationTravelDegrees).toBe(-90);
    }
  });

  it('packs each supported page count without gaps or overlaps', () => {
    for (const axis of ['horizontal', 'vertical'] as const) {
      for (const count of [3, 5, 8]) {
        const tiles = buildStableFibonacciLayout(count, 10, axis);
        const bounds = getLayoutBounds(tiles);
        const totalTileArea = tiles.reduce((total, tile) => total + tile.side ** 2, 0);

        expect(totalTileArea).toBeCloseTo(bounds.width * bounds.height);

        for (let first = 0; first < tiles.length; first += 1) {
          for (let second = first + 1; second < tiles.length; second += 1) {
            const a = tiles[first];
            const b = tiles[second];
            const overlapX = Math.min(a.x + a.side, b.x + b.side) - Math.max(a.x, b.x);
            const overlapY = Math.min(a.y + a.side, b.y + b.side) - Math.max(a.y, b.y);
            expect(overlapX > 0 && overlapY > 0).toBe(false);
          }
        }
      }
    }
  });

  it('builds the same number of tiles as there are pages', () => {
    for (const count of [3, 5, 8]) {
      expect(buildStableFibonacciLayout(count)).toHaveLength(count);
    }
  });

  it('keeps active pages upright and turns the mobile spiral downward', () => {
    const verticalTiles = buildFibonacciLayout(5, 10, 'vertical');
    const wideTiles = buildFibonacciLayout(5, 10, 'horizontal');

    expect(getCameraPose(verticalTiles, 1, 390, 844).rotation).toBe(90);
    expect(getCameraPose(wideTiles, 1, 1200, 800).rotation).toBe(-90);

    for (const tiles of [verticalTiles, wideTiles]) {
      tiles.forEach((tile, index) => {
        const pose = getCameraPose(tiles, index, 1200, 800);
        expect(pose.rotation + tile.rotationTravelDegrees).toBe(0);
      });
    }
  });

  it('rejects invalid counts and unit sizes', () => {
    expect(() => buildFibonacciLayout(-1)).toThrow(RangeError);
    expect(() => buildFibonacciLayout(2, 0)).toThrow(RangeError);
  });

});
