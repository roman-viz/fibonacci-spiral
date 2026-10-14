import { describe, expect, it } from 'vitest';
import {
  cameraTransform,
  getCameraProgress,
  getCameraPose as calculateCameraPose,
  getCameraTransitionDuration,
  interpolateCamera,
  shortestAngle,
} from './cameraMath';
import {
  buildStableFibonacciLayout,
} from './fibonacciLayout';

function getCameraPose(
  tiles: ReturnType<typeof buildStableFibonacciLayout>,
  progress: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  return calculateCameraPose(tiles, progress, viewportWidth, viewportHeight);
}

describe('camera math', () => {
  it('uses the shortest angular path across the wrap boundary', () => {
    expect(shortestAngle(350, 10)).toBe(20);
    expect(shortestAngle(10, 350)).toBe(-20);
  });

  it('fits the active page while keeping its neighbors on the spiral path', () => {
    const tiles = buildStableFibonacciLayout(5, 256, 'horizontal');
    const pose = getCameraPose(tiles, 0, 1200, 800);

    expect(pose.scale * tiles[0].side).toBeCloseTo(800);
    expect(pose.scale * (tiles[0].centerX - pose.x)).toBeCloseTo(-200);
    expect(pose.scale * (tiles[0].centerY - pose.y)).toBeCloseTo(0);
  });

  it('anchors the active mobile page to the top-left of the viewport', () => {
    const tiles = buildStableFibonacciLayout(5, 256, 'vertical');
    const pose = getCameraPose(tiles, 0, 370, 692);

    expect(pose.scale * tiles[0].side).toBeCloseTo(370);
    expect(pose.scale * (tiles[0].centerX - pose.x)).toBeCloseTo(0);
    expect(pose.scale * (tiles[0].centerY - pose.y)).toBeCloseTo(-161);
  });

  it('centers each fitted page within the viewport', () => {
    expect(cameraTransform({ x: 0, y: 0, scale: 1, rotation: 0 }, 1200, 800))
      .toContain('translate(600px, 400px)');
    expect(cameraTransform({ x: 0, y: 0, scale: 1, rotation: 0 }, 390, 844))
      .toContain('translate(195px, 422px)');
  });

  it('keeps the active page consistently framed while the camera follows and turns', () => {
    const tiles = buildStableFibonacciLayout(5, 256, 'horizontal');
    const first = getCameraPose(tiles, 0, 1200, 800);
    const second = getCameraPose(tiles, 1, 1200, 800);
    const halfway = getCameraPose(tiles, 0.5, 1200, 800);

    expect(second.x).not.toBe(first.x);
    expect(second.y).not.toBe(first.y);
    expect(second.rotation - first.rotation).toBe(-90);
    expect(halfway).not.toEqual(interpolateCamera(first, second, 0.5));
    expect(first.scale * tiles[0].side).toBeCloseTo(800);
    expect(second.scale * tiles[1].side).toBeCloseTo(800);
  });

  it('anchors every active tile to the viewport corner on desktop and mobile', () => {
    for (const count of [3, 5, 8]) {
      for (const { axis, width, height } of [
        { axis: 'horizontal' as const, width: 1200, height: 800 },
        { axis: 'vertical' as const, width: 390, height: 768 },
      ]) {
        const tiles = buildStableFibonacciLayout(count, 256, axis);
        const fittedSide = Math.min(width, height);

        tiles.forEach((tile, index) => {
          const pose = getCameraPose(tiles, index, width, height);
          const radians = pose.rotation * Math.PI / 180;
          const cosine = Math.cos(radians);
          const sine = Math.sin(radians);
          const screenX = width / 2 + pose.scale * (
            cosine * (tile.centerX - pose.x) - sine * (tile.centerY - pose.y)
          );
          const screenY = height / 2 + pose.scale * (
            sine * (tile.centerX - pose.x) + cosine * (tile.centerY - pose.y)
          );

          expect(pose.scale * tile.side).toBeCloseTo(fittedSide);
          expect(screenX).toBeCloseTo(fittedSide / 2);
          expect(screenY).toBeCloseTo(fittedSide / 2);
        });
      }
    }
  });

  it('smoothly carries the camera through intermediate spiral corners', () => {
    const tiles = buildStableFibonacciLayout(5);
    const epsilon = 0.0001;

    for (const boundary of [1, 2, 3]) {
      const before = getCameraPose(tiles, boundary - epsilon, 1200, 800);
      const at = getCameraPose(tiles, boundary, 1200, 800);
      const after = getCameraPose(tiles, boundary + epsilon, 1200, 800);

      for (const key of ['x', 'y', 'scale'] as const) {
        const incomingVelocity = (at[key] - before[key]) / epsilon;
        const outgoingVelocity = (after[key] - at[key]) / epsilon;
        expect(Math.abs(outgoingVelocity - incomingVelocity)).toBeLessThan(2);
      }
    }
  });

  it('keeps camera motion smooth along one shared spiral axis at intermediate pages', () => {
    for (const axis of ['horizontal', 'vertical'] as const) {
      const tiles = buildStableFibonacciLayout(5, 256, axis);
      const epsilon = 0.0001;

      for (let boundary = 1; boundary < tiles.length - 1; boundary += 1) {
        const before = getCameraPose(tiles, boundary - epsilon, 1200, 800);
        const at = getCameraPose(tiles, boundary, 1200, 800);
        const after = getCameraPose(tiles, boundary + epsilon, 1200, 800);

        const incomingVelocity = {
          x: (at.x - before.x) / epsilon,
          y: (at.y - before.y) / epsilon,
        };
        const outgoingVelocity = {
          x: (after.x - at.x) / epsilon,
          y: (after.y - at.y) / epsilon,
        };
        expect(Math.hypot(
          outgoingVelocity.x - incomingVelocity.x,
          outgoingVelocity.y - incomingVelocity.y,
        )).toBeLessThan(2);
      }

      for (let progress = 0; progress <= tiles.length - 1; progress += 0.1) {
        const pose = getCameraPose(tiles, progress, 1200, 800);
        expect(Number.isFinite(pose.x)).toBe(true);
        expect(Number.isFinite(pose.y)).toBe(true);
      }
    }
  });

  it('keeps the camera rotating by a quarter turn for every page in a distant jump', () => {
    const tiles = buildStableFibonacciLayout(5);
    const start = getCameraPose(tiles, 0, 1200, 800);
    const middle = getCameraPose(tiles, 2, 1200, 800);
    const end = getCameraPose(tiles, 4, 1200, 800);

    expect(middle.rotation - start.rotation).toBe(180);
    expect(end.rotation - start.rotation).toBe(360);
    expect(Number.isFinite(end.x)).toBe(true);
    expect(Number.isFinite(end.y)).toBe(true);
  });

  it('preserves the shared path derivative through every intermediate page', () => {
    const tiles = buildStableFibonacciLayout(5, 256, 'horizontal');
    for (let boundary = 1; boundary < tiles.length - 1; boundary += 1) {
      const epsilon = 0.001;
      const before = getCameraPose(tiles, boundary - epsilon, 1200, 800);
      const at = getCameraPose(tiles, boundary, 1200, 800);
      const after = getCameraPose(tiles, boundary + epsilon, 1200, 800);
      const incoming = Math.atan2(at.y - before.y, at.x - before.x);
      const outgoing = Math.atan2(after.y - at.y, after.x - at.x);
      expect(Math.abs(shortestAngle(incoming * 180 / Math.PI, outgoing * 180 / Math.PI))).toBeLessThan(1);
    }
  });

  it('turns the camera by a full quarter turn for each page', () => {
    const tiles = buildStableFibonacciLayout(3);
    const rotationDirection = tiles[1].rotationTravelDegrees < 0 ? 1 : -1;
    tiles.forEach((tile, index) => {
      const camera = getCameraPose(tiles, index, 1200, 800);
      expect(camera.rotation).toBe(index * rotationDirection * 90);
      expect(camera.rotation + tile.rotationTravelDegrees).toBe(0);
    });
  });

  it('interpolates camera pose values continuously', () => {
    expect(interpolateCamera(
      { x: 0, y: 10, scale: 1, rotation: 0 },
      { x: 100, y: 20, scale: 2, rotation: 30 },
      0.5,
    )).toEqual({ x: 50, y: 15, scale: 1.5, rotation: 15 });
  });

  it('allocates one neighbor-transition duration for each page in a direct jump', () => {
    expect(getCameraTransitionDuration(0, 1)).toBe(900);
    expect(getCameraTransitionDuration(0, 2)).toBe(1800);
    expect(getCameraTransitionDuration(1, 4)).toBe(2700);
    expect(getCameraTransitionDuration(4, 1)).toBe(2700);
    expect(getCameraTransitionDuration(2, 2)).toBe(0);
  });

  it('eases a multi-page jump continuously without stopping at intermediate slides', () => {
    const millisecondsPerPage = 900;

    expect(getCameraProgress(0, 4, 0, millisecondsPerPage)).toBe(0);
    expect(getCameraProgress(0, 4, millisecondsPerPage * 2, millisecondsPerPage)).toBe(2);
    expect(getCameraProgress(0, 4, millisecondsPerPage * 4, millisecondsPerPage)).toBe(4);

    const beforeIntermediatePage = getCameraProgress(0, 4, millisecondsPerPage - 1, millisecondsPerPage);
    const atIntermediatePage = getCameraProgress(0, 4, millisecondsPerPage, millisecondsPerPage);
    const afterIntermediatePage = getCameraProgress(0, 4, millisecondsPerPage + 1, millisecondsPerPage);
    expect(beforeIntermediatePage).toBeLessThan(atIntermediatePage);
    expect(atIntermediatePage).toBeLessThan(afterIntermediatePage);
    expect(atIntermediatePage).not.toBe(1);

    const reverseBeforeIntermediatePage = getCameraProgress(4, 0, millisecondsPerPage - 1, millisecondsPerPage);
    const reverseAtIntermediatePage = getCameraProgress(4, 0, millisecondsPerPage, millisecondsPerPage);
    const reverseAfterIntermediatePage = getCameraProgress(4, 0, millisecondsPerPage + 1, millisecondsPerPage);
    expect(reverseBeforeIntermediatePage).toBeGreaterThan(reverseAtIntermediatePage);
    expect(reverseAtIntermediatePage).toBeGreaterThan(reverseAfterIntermediatePage);
    expect(reverseAtIntermediatePage).not.toBe(3);
  });

  it('resumes smoothly from an in-between position', () => {
    expect(getCameraProgress(1.4, 3, 0)).toBe(1.4);
    expect(getCameraProgress(1.4, 3, getCameraTransitionDuration(1.4, 3))).toBe(3);
    expect(getCameraProgress(1.4, 3, 720)).toBe(2.2);
  });
});
