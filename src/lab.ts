import { Fill, ColorComparisonOptions, RgbaU8 } from "./types";

let queue = new Uint32Array(3);

export function getImgDataAfterFloodFill_experimental(
  originalData: ImageData,
  fill: Fill
): ImageData {
  const { width, height } = originalData;
  const { startLocation, replacementColor, colorComparisonOptions } = fill;
  const newData = cloneImgData(originalData);
  const newDataBytes = newData.data;
  const startLocationAsByteIndex =
    4 * (startLocation.y * width + startLocation.x);
  const isColorCloseEnoughToTarget = getColorComparator(
    {
      r: newDataBytes[startLocationAsByteIndex],
      g: newDataBytes[startLocationAsByteIndex + 1],
      b: newDataBytes[startLocationAsByteIndex + 2],
      a: newDataBytes[startLocationAsByteIndex + 3],
    },
    colorComparisonOptions,
    newDataBytes
  );
  const isColorSameAsReplacementColor = getColorEqualityChecker(
    replacementColor,
    newDataBytes
  );

  if (
    replacementColor.r === newDataBytes[startLocationAsByteIndex] &&
    replacementColor.g === newDataBytes[startLocationAsByteIndex + 1] &&
    replacementColor.b === newDataBytes[startLocationAsByteIndex + 2] &&
    replacementColor.a === newDataBytes[startLocationAsByteIndex + 3]
  ) {
    return newData;
  }

  const widthTimes4 = width * 4;
  const widthMinus1 = width - 1;
  const heightMinus1 = height - 1;

  const replacementColorR = replacementColor.r;
  const replacementColorG = replacementColor.g;
  const replacementColorB = replacementColor.b;
  const replacementColorA = replacementColor.a;
  newDataBytes[startLocationAsByteIndex] = replacementColorR;
  newDataBytes[startLocationAsByteIndex + 1] = replacementColorG;
  newDataBytes[startLocationAsByteIndex + 2] = replacementColorB;
  newDataBytes[startLocationAsByteIndex + 3] = replacementColorA;

  queue.set([startLocation.x, startLocation.y, startLocationAsByteIndex]);
  let dequeueIndex = 0;
  /**
   * This equals one plus the last index in the queue.
   * For example, if the queue has 3 items, then the last index
   * is `2`, which means `queueEndIndex` is `3`.
   */
  let queueEndIndex = 3;

  function enqueue(x: number, y: number, byteIndex: number): void {
    let remainingSpace = queue.length - queueEndIndex;

    if (remainingSpace >= 3) {
      queue[queueEndIndex] = x;
      queue[queueEndIndex + 1] = y;
      queue[queueEndIndex + 2] = byteIndex;
      queueEndIndex += 3;
      return;
    }

    const newQueue = new Uint32Array(2 * queue.length);
    newQueue.set(queue.subarray(dequeueIndex, queueEndIndex));
    queueEndIndex -= dequeueIndex;
    dequeueIndex = 0;
    queue = newQueue;

    queue[queueEndIndex] = x;
    queue[queueEndIndex + 1] = y;
    queue[queueEndIndex + 2] = byteIndex;
    queueEndIndex += 3;
  }

  while (dequeueIndex < queueEndIndex) {
    const x = queue[dequeueIndex];
    const y = queue[dequeueIndex + 1];
    const byteIndex = queue[dequeueIndex + 2];
    dequeueIndex += 3;

    // West neighbor
    if (
      x > 0 &&
      isColorCloseEnoughToTarget(byteIndex - 4) &&
      !isColorSameAsReplacementColor(byteIndex - 4)
    ) {
      const neighborByteIndex = byteIndex - 4;
      newDataBytes[neighborByteIndex] = replacementColorR;
      newDataBytes[neighborByteIndex + 1] = replacementColorG;
      newDataBytes[neighborByteIndex + 2] = replacementColorB;
      newDataBytes[neighborByteIndex + 3] = replacementColorA;

      enqueue(x - 1, y, neighborByteIndex);
    }

    // North neighbor
    if (
      y > 0 &&
      isColorCloseEnoughToTarget(byteIndex - widthTimes4) &&
      !isColorSameAsReplacementColor(byteIndex - widthTimes4)
    ) {
      const neighborByteIndex = byteIndex - widthTimes4;
      newDataBytes[neighborByteIndex] = replacementColorR;
      newDataBytes[neighborByteIndex + 1] = replacementColorG;
      newDataBytes[neighborByteIndex + 2] = replacementColorB;
      newDataBytes[neighborByteIndex + 3] = replacementColorA;

      enqueue(x, y - 1, neighborByteIndex);
    }

    // East neighbor
    if (
      x < widthMinus1 &&
      isColorCloseEnoughToTarget(byteIndex + 4) &&
      !isColorSameAsReplacementColor(byteIndex + 4)
    ) {
      const neighborByteIndex = byteIndex + 4;
      newDataBytes[neighborByteIndex] = replacementColorR;
      newDataBytes[neighborByteIndex + 1] = replacementColorG;
      newDataBytes[neighborByteIndex + 2] = replacementColorB;
      newDataBytes[neighborByteIndex + 3] = replacementColorA;

      enqueue(x + 1, y, neighborByteIndex);
    }

    // South neighbor
    if (
      y < heightMinus1 &&
      isColorCloseEnoughToTarget(byteIndex + widthTimes4) &&
      !isColorSameAsReplacementColor(byteIndex + widthTimes4)
    ) {
      const neighborByteIndex = byteIndex + widthTimes4;
      newDataBytes[neighborByteIndex] = replacementColorR;
      newDataBytes[neighborByteIndex + 1] = replacementColorG;
      newDataBytes[neighborByteIndex + 2] = replacementColorB;
      newDataBytes[neighborByteIndex + 3] = replacementColorA;

      enqueue(x, y + 1, neighborByteIndex);
    }
  }

  return newData;
}

function cloneImgData(original: ImageData): ImageData {
  return new ImageData(original.data.slice(), original.width, original.height);
}

function getColorComparator(
  lhs: RgbaU8,
  options: ColorComparisonOptions,
  imgDataBytes: Uint8ClampedArray
): (index: number) => boolean {
  const { tolerance, shouldCompareAlpha } = options;
  const tolSq = tolerance * tolerance;
  const { r, g, b, a } = lhs;

  if (shouldCompareAlpha) {
    return function isColorCloseEnoughToTarget(index: number): boolean {
      const dr = r - imgDataBytes[index];
      const dg = g - imgDataBytes[index + 1];
      const db = b - imgDataBytes[index + 2];
      const da = a - imgDataBytes[index + 3];
      const distSq = dr * dr + dg * dg + db * db + da * da;
      return distSq <= tolSq;
    };
  } else {
    return function isColorCloseEnoughToTarget(index: number): boolean {
      const dr = r - imgDataBytes[index];
      const dg = g - imgDataBytes[index + 1];
      const db = b - imgDataBytes[index + 2];
      const distSq = dr * dr + dg * dg + db * db;
      return distSq <= tolSq;
    };
  }
}

function getColorEqualityChecker(
  lhs: RgbaU8,
  imgDataBytes: Uint8ClampedArray
): (index: number) => boolean {
  const { r, g, b, a } = lhs;
  return function isColorCloseEnoughToTarget(index: number): boolean {
    return (
      r === imgDataBytes[index] &&
      g === imgDataBytes[index + 1] &&
      b === imgDataBytes[index + 2] &&
      a === imgDataBytes[index + 3]
    );
  };
}
