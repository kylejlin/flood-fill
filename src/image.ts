import Option from "@kylejlin/option";
import { RGBColor } from "react-color";

import { ColorComparisonOptions, Queue, RgbaU8, Fill } from "./types";

export function getImgData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export function doesTargetColorEqualReplacementColor(
  imgData: ImageData,
  floodStartLocation: { x: number; y: number },
  replacementRgbColor: RGBColor
): boolean {
  const replacementColor = getRgbaU8FromRgb(replacementRgbColor);
  const targetColor = getPixelColorAt(imgData, floodStartLocation);
  return areColorsEqual(replacementColor, targetColor);
}

export function getImgDataAfterFloodFill(
  originalData: ImageData,
  fill: Fill
): ImageData {
  const {
    startLocation,
    replacementColor: replacementRgbColor,
    colorComparisonOptions
  } = fill;
  const newData = cloneImgData(originalData);
  const replacementColor = getRgbaU8FromRgb(replacementRgbColor);
  const targetColor = getPixelColorAt(newData, startLocation);
  const isColorCloseEnoughToTarget = getColorComparator(
    targetColor,
    colorComparisonOptions
  );

  if (areColorsEqual(replacementColor, targetColor)) {
    return newData;
  }

  const { width: imgWidth, height: imgHeight } = originalData;

  writePixel(newData, startLocation, replacementColor);

  const queue: Queue<{ x: number; y: number }> = Queue.empty();
  queue.enqueue(startLocation);

  while (queue.hasItem()) {
    const location = queue.dequeue();
    getWestNeighbor(location).ifSome(neighbor => {
      const neighborColor = getPixelColorAt(newData, neighbor);
      if (
        isColorCloseEnoughToTarget(neighborColor) &&
        !areColorsEqual(replacementColor, neighborColor)
      ) {
        writePixel(newData, neighbor, replacementColor);
        queue.enqueue(neighbor);
      }
    });
    getNorthNeighbor(location).ifSome(neighbor => {
      const neighborColor = getPixelColorAt(newData, neighbor);
      if (
        isColorCloseEnoughToTarget(neighborColor) &&
        !areColorsEqual(replacementColor, neighborColor)
      ) {
        writePixel(newData, neighbor, replacementColor);
        queue.enqueue(neighbor);
      }
    });
    getEastNeighbor(location, imgWidth).ifSome(neighbor => {
      const neighborColor = getPixelColorAt(newData, neighbor);
      if (
        isColorCloseEnoughToTarget(neighborColor) &&
        !areColorsEqual(replacementColor, neighborColor)
      ) {
        writePixel(newData, neighbor, replacementColor);
        queue.enqueue(neighbor);
      }
    });
    getSouthNeighbor(location, imgHeight).ifSome(neighbor => {
      const neighborColor = getPixelColorAt(newData, neighbor);
      if (
        isColorCloseEnoughToTarget(neighborColor) &&
        !areColorsEqual(replacementColor, neighborColor)
      ) {
        writePixel(newData, neighbor, replacementColor);
        queue.enqueue(neighbor);
      }
    });
  }

  return newData;
}

function cloneImgData(original: ImageData): ImageData {
  return new ImageData(original.data.slice(), original.width, original.height);
}

function getRgbaU8FromRgb(rgb: RGBColor): RgbaU8 {
  return {
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
    a: Math.floor(255 * (rgb.a === undefined ? 1.0 : rgb.a))
  };
}

function getPixelColorAt(
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

function getColorComparator(
  targetColor: RgbaU8,
  options: ColorComparisonOptions
): (color: RgbaU8) => boolean {
  const { tolerance, shouldCompareAlpha } = options;
  const tolSq = tolerance * tolerance;

  if (shouldCompareAlpha) {
    return function isColorCloseEnoughToTarget(color: RgbaU8): boolean {
      const dr = targetColor.r - color.r;
      const dg = targetColor.g - color.g;
      const db = targetColor.b - color.b;
      const da = targetColor.a - color.a;
      const distSq = dr * dr + dg * dg + db * db + da * da;
      return distSq <= tolSq;
    };
  } else {
    return function isColorCloseEnoughToTarget(color: RgbaU8): boolean {
      const dr = targetColor.r - color.r;
      const dg = targetColor.g - color.g;
      const db = targetColor.b - color.b;
      const distSq = dr * dr + dg * dg + db * db;
      return distSq <= tolSq;
    };
  }
}

function areColorsEqual(c1: RgbaU8, c2: RgbaU8): boolean {
  return c1.r === c2.r && c1.g === c2.g && c1.b === c2.b && c1.a === c2.a;
}

function writePixel(
  imgData: ImageData,
  { x, y }: { x: number; y: number },
  color: RgbaU8
): void {
  const { width, height, data } = imgData;

  if (x >= width) {
    throw new RangeError("X coordinate exceeded image width.");
  }
  if (y >= height) {
    throw new RangeError("Y coordinate exceeded image height.");
  }

  const i = 4 * (y * width + x);

  data[i] = color.r;
  data[i + 1] = color.g;
  data[i + 2] = color.b;
  data[i + 3] = color.a;
}

function getWestNeighbor({
  x,
  y
}: {
  x: number;
  y: number;
}): Option<{ x: number; y: number }> {
  if (x > 0) {
    return Option.some({ x: x - 1, y });
  } else {
    return Option.none();
  }
}

function getNorthNeighbor({
  x,
  y
}: {
  x: number;
  y: number;
}): Option<{ x: number; y: number }> {
  if (y > 0) {
    return Option.some({ x, y: y - 1 });
  } else {
    return Option.none();
  }
}

function getEastNeighbor(
  {
    x,
    y
  }: {
    x: number;
    y: number;
  },
  width: number
): Option<{ x: number; y: number }> {
  if (x < width - 1) {
    return Option.some({ x: x + 1, y });
  } else {
    return Option.none();
  }
}

function getSouthNeighbor(
  {
    x,
    y
  }: {
    x: number;
    y: number;
  },
  height: number
): Option<{ x: number; y: number }> {
  if (y < height - 1) {
    return Option.some({ x, y: y + 1 });
  } else {
    return Option.none();
  }
}
