import { RGBColor } from "react-color";

import { ColorComparisonOptions, RgbaU8, Fill } from "./types";

let queue = new Uint32Array(3);

export function getImgData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function applyFloodFillInPlace(
  imgData: ImageData,
  fill: Fill
): ImageData {
  const { width, height, data: imgDataBytes } = imgData;
  const { startLocation, replacementColor, colorComparisonOptions } = fill;
  const startLocationAsByteIndex =
    4 * (startLocation.y * width + startLocation.x);
  const isColorCloseEnoughToTarget = getColorComparator(
    {
      r: imgDataBytes[startLocationAsByteIndex],
      g: imgDataBytes[startLocationAsByteIndex + 1],
      b: imgDataBytes[startLocationAsByteIndex + 2],
      a: imgDataBytes[startLocationAsByteIndex + 3],
    },
    colorComparisonOptions,
    imgDataBytes
  );
  const isColorSameAsReplacementColor = getColorEqualityChecker(
    replacementColor,
    imgDataBytes
  );

  if (
    replacementColor.r === imgDataBytes[startLocationAsByteIndex] &&
    replacementColor.g === imgDataBytes[startLocationAsByteIndex + 1] &&
    replacementColor.b === imgDataBytes[startLocationAsByteIndex + 2] &&
    replacementColor.a === imgDataBytes[startLocationAsByteIndex + 3]
  ) {
    return imgData;
  }

  const widthTimes4 = width * 4;
  const widthMinus1 = width - 1;
  const heightMinus1 = height - 1;

  const replacementColorR = replacementColor.r;
  const replacementColorG = replacementColor.g;
  const replacementColorB = replacementColor.b;
  const replacementColorA = replacementColor.a;
  imgDataBytes[startLocationAsByteIndex] = replacementColorR;
  imgDataBytes[startLocationAsByteIndex + 1] = replacementColorG;
  imgDataBytes[startLocationAsByteIndex + 2] = replacementColorB;
  imgDataBytes[startLocationAsByteIndex + 3] = replacementColorA;

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
      imgDataBytes[neighborByteIndex] = replacementColorR;
      imgDataBytes[neighborByteIndex + 1] = replacementColorG;
      imgDataBytes[neighborByteIndex + 2] = replacementColorB;
      imgDataBytes[neighborByteIndex + 3] = replacementColorA;

      enqueue(x - 1, y, neighborByteIndex);
    }

    // North neighbor
    if (
      y > 0 &&
      isColorCloseEnoughToTarget(byteIndex - widthTimes4) &&
      !isColorSameAsReplacementColor(byteIndex - widthTimes4)
    ) {
      const neighborByteIndex = byteIndex - widthTimes4;
      imgDataBytes[neighborByteIndex] = replacementColorR;
      imgDataBytes[neighborByteIndex + 1] = replacementColorG;
      imgDataBytes[neighborByteIndex + 2] = replacementColorB;
      imgDataBytes[neighborByteIndex + 3] = replacementColorA;

      enqueue(x, y - 1, neighborByteIndex);
    }

    // East neighbor
    if (
      x < widthMinus1 &&
      isColorCloseEnoughToTarget(byteIndex + 4) &&
      !isColorSameAsReplacementColor(byteIndex + 4)
    ) {
      const neighborByteIndex = byteIndex + 4;
      imgDataBytes[neighborByteIndex] = replacementColorR;
      imgDataBytes[neighborByteIndex + 1] = replacementColorG;
      imgDataBytes[neighborByteIndex + 2] = replacementColorB;
      imgDataBytes[neighborByteIndex + 3] = replacementColorA;

      enqueue(x + 1, y, neighborByteIndex);
    }

    // South neighbor
    if (
      y < heightMinus1 &&
      isColorCloseEnoughToTarget(byteIndex + widthTimes4) &&
      !isColorSameAsReplacementColor(byteIndex + widthTimes4)
    ) {
      const neighborByteIndex = byteIndex + widthTimes4;
      imgDataBytes[neighborByteIndex] = replacementColorR;
      imgDataBytes[neighborByteIndex + 1] = replacementColorG;
      imgDataBytes[neighborByteIndex + 2] = replacementColorB;
      imgDataBytes[neighborByteIndex + 3] = replacementColorA;

      enqueue(x, y + 1, neighborByteIndex);
    }
  }

  return imgData;
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

export function cloneImgData(original: ImageData): ImageData {
  return new ImageData(original.data.slice(), original.width, original.height, {
    colorSpace: original.colorSpace,
  });
}

export function getRgbaU8FromRgb(rgb: RGBColor): RgbaU8 {
  return {
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
    a: Math.floor(255 * (rgb.a === undefined ? 1.0 : rgb.a)),
  };
}

export function getPixelColorAt(
  imgData: ImageData,
  { x, y }: { x: number; y: number }
): RgbaU8 {
  const { width, height, data } = imgData;
  if (x >= width) {
    throw new RangeError("X coordinate exceeded image width.");
  }
  if (y >= height) {
    throw new RangeError("Y coordinate exceeded image height.");
  }
  const i = 4 * (y * width + x);
  return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
}

export function areColorsEqual(c1: RgbaU8, c2: RgbaU8): boolean {
  return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
}
