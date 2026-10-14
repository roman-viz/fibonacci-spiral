import type { SpiralTile } from './fibonacciLayout';

export interface CameraPose {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const radiansToDegrees = 180 / Math.PI;
export function shortestAngle(from: number, to: number): number {
  let difference = (to - from) % 360;
  if (difference > 180) difference -= 360;
  if (difference < -180) difference += 360;
  return difference;
}

function getPositionTangent(tiles: SpiralTile[], index: number): { x: number; y: number } {
  const previous = tiles[Math.max(0, index - 1)];
  const current = tiles[index];
  const next = tiles[Math.min(tiles.length - 1, index + 1)];
  let x = index === 0
    ? next.centerX - current.centerX
    : index === tiles.length - 1
      ? current.centerX - previous.centerX
      : (next.centerX - previous.centerX) / 2;
  let y = index === 0
    ? next.centerY - current.centerY
    : index === tiles.length - 1
      ? current.centerY - previous.centerY
      : (next.centerY - previous.centerY) / 2;

  if (index > 0 && index < tiles.length - 1) {
    const previousLength = Math.hypot(
      current.centerX - previous.centerX,
      current.centerY - previous.centerY,
    );
    const nextLength = Math.hypot(
      next.centerX - current.centerX,
      next.centerY - current.centerY,
    );
    const tangentLength = Math.hypot(x, y);
    const maxTangentLength = 2 * Math.min(previousLength, nextLength);
    if (tangentLength > maxTangentLength) {
      const scale = maxTangentLength / tangentLength;
      x *= scale;
      y *= scale;
    }
  }

  return { x, y };
}

function interpolateSpiralPosition(tiles: SpiralTile[], progress: number): { x: number; y: number } {
  if (tiles.length === 1) {
    return { x: tiles[0].centerX, y: tiles[0].centerY };
  }

  const segment = Math.min(tiles.length - 2, Math.floor(progress));
  const amount = progress - segment;
  const start = tiles[segment];
  const end = tiles[segment + 1];
  const startTangent = getPositionTangent(tiles, segment);
  const endTangent = getPositionTangent(tiles, segment + 1);
  const amountSquared = amount * amount;
  const amountCubed = amountSquared * amount;
  const startWeight = 2 * amountCubed - 3 * amountSquared + 1;
  const startTangentWeight = amountCubed - 2 * amountSquared + amount;
  const endWeight = -2 * amountCubed + 3 * amountSquared;
  const endTangentWeight = amountCubed - amountSquared;

  return {
    x: startWeight * start.centerX
      + startTangentWeight * startTangent.x
      + endWeight * end.centerX
      + endTangentWeight * endTangent.x,
    y: startWeight * start.centerY
      + startTangentWeight * startTangent.y
      + endWeight * end.centerY
      + endTangentWeight * endTangent.y,
  };
}

function interpolatePageScale(
  tiles: SpiralTile[],
  progress: number,
  viewportWidth: number,
  viewportHeight: number,
): number {
  if (tiles.length === 1) {
    return Math.min(viewportWidth, viewportHeight) / tiles[0].side;
  }

  const segment = Math.min(tiles.length - 2, Math.floor(progress));
  const amount = progress - segment;
  const values = tiles.map((tile) => 1 / tile.side);
  const tangentAt = (index: number) => index === 0
    ? values[1] - values[0]
    : index === values.length - 1
      ? values[index] - values[index - 1]
      : (values[index + 1] - values[index - 1]) / 2;
  const amountSquared = amount * amount;
  const amountCubed = amountSquared * amount;
  const value = (2 * amountCubed - 3 * amountSquared + 1) * values[segment]
    + (amountCubed - 2 * amountSquared + amount) * tangentAt(segment)
    + (-2 * amountCubed + 3 * amountSquared) * values[segment + 1]
    + (amountCubed - amountSquared) * tangentAt(segment + 1);

  return Math.min(viewportWidth, viewportHeight) * value;
}

export function getCameraPose(
  tiles: SpiralTile[],
  progress: number,
  viewportWidth: number,
  viewportHeight: number,
): CameraPose {
  if (tiles.length === 0) {
    return { x: 0, y: 0, scale: 1, rotation: 0 };
  }

  const value = Math.max(0, Math.min(tiles.length - 1, progress));
  const rotationDirection = tiles.length > 1 && tiles[1].rotationTravelDegrees < 0 ? 1 : -1;
  const rotation = value * rotationDirection * 90;
  const radians = rotation / radiansToDegrees;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const pathPosition = interpolateSpiralPosition(tiles, value);
  const scale = interpolatePageScale(tiles, value, viewportWidth, viewportHeight);
  const fittedSide = Math.min(viewportWidth, viewportHeight);
  const offsetX = (viewportWidth - fittedSide) / 2;
  const offsetY = (viewportHeight - fittedSide) / 2;

  return {
    x: pathPosition.x + (cosine * offsetX + sine * offsetY) / scale,
    y: pathPosition.y + (-sine * offsetX + cosine * offsetY) / scale,
    scale,
    rotation,
  };
}

export function interpolateCamera(
  from: CameraPose,
  to: CameraPose,
  amount: number,
): CameraPose {
  const t = Math.max(0, Math.min(1, amount));
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
    scale: from.scale + (to.scale - from.scale) * t,
    rotation: from.rotation + shortestAngle(from.rotation, to.rotation) * t,
  };
}

export function getCameraTransitionDuration(
  fromProgress: number,
  toProgress: number,
  millisecondsPerPage = 900,
): number {
  return Math.abs(toProgress - fromProgress) * millisecondsPerPage;
}

export function getCameraProgress(
  fromProgress: number,
  toProgress: number,
  elapsedMilliseconds: number,
  millisecondsPerPage = 900,
): number {
  const duration = getCameraTransitionDuration(fromProgress, toProgress, millisecondsPerPage);
  if (duration === 0) return toProgress;

  const raw = Math.max(0, Math.min(1, elapsedMilliseconds / duration));
  const eased = raw < 0.5
    ? 4 * raw * raw * raw
    : 1 - ((-2 * raw + 2) ** 3) / 2;
  return fromProgress + (toProgress - fromProgress) * eased;
}

export function cameraTransform(
  pose: CameraPose,
  viewportWidth: number,
  viewportHeight: number,
): string {
  const rotation = pose.rotation / radiansToDegrees;
  return [
    `translate(${viewportWidth / 2}px, ${viewportHeight / 2}px)`,
    `rotate(${rotation}rad)`,
    `scale(${pose.scale})`,
    `translate(${-pose.x}px, ${-pose.y}px)`,
  ].join(' ');
}
