import React from "react";
import Option from "@kylejlin/option";
import { SketchPicker, ColorResult, RGBColor } from "react-color";

import "./App.css";

import readFileAsHtmlImage from "./readFileAsHtmlImage";

export default class App extends React.Component<{}, State> {
  private canvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: {}) {
    super(props);

    // @ts-ignore
    window.app = this;

    this.state = {
      originalImg: Option.none(),
      fileName: Option.none(),
      replacementColor: Option.none(),
      toleranceStr: "0",
      shouldCompareAlpha: false
    };

    this.canvasRef = React.createRef();

    this.bindMethods();
  }

  bindMethods() {
    this.onFileChange = this.onFileChange.bind(this);
    this.onReplacementColorChangeComplete = this.onReplacementColorChangeComplete.bind(
      this
    );
    this.onCanvasClick = this.onCanvasClick.bind(this);
    this.onToleranceChange = this.onToleranceChange.bind(this);
    this.onShouldCompareAlphaChange = this.onShouldCompareAlphaChange.bind(
      this
    );
  }

  render() {
    return (
      <>
        <header>
          <h1>Flood fill</h1>
        </header>
        <main>
          <div>
            {this.state.fileName.match({
              none: () => (
                <label>
                  Upload an image{" "}
                  <input
                    type="file"
                    accept="image/png, image/jpg, image/jpeg, image/gif"
                    onChange={this.onFileChange}
                  />
                </label>
              ),
              some: fileName => <p>Successfully uploaded {fileName}</p>
            })}
          </div>

          {this.state.replacementColor.match({
            none: () => null,
            some: color => (
              <div>
                <label>
                  Replacement color:
                  <SketchPicker
                    color={color}
                    onChangeComplete={this.onReplacementColorChangeComplete}
                  />
                </label>
                <label>
                  Tolerance:{" "}
                  <input
                    type="number"
                    value={this.state.toleranceStr}
                    onChange={this.onToleranceChange}
                  />
                </label>
                <label>
                  Compare alpha values:{" "}
                  <input
                    type="checkbox"
                    checked={this.state.shouldCompareAlpha}
                    onChange={this.onShouldCompareAlphaChange}
                  />
                </label>
              </div>
            )
          })}

          <div className="CanvasContainer">
            <canvas ref={this.canvasRef} onClick={this.onCanvasClick} />
          </div>
        </main>
      </>
    );
  }

  onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { files } = event.target;
    if (files !== null) {
      const file = files[0];
      if (file instanceof File && /\.(jpe?g|png|gif)$/i.test(file.name)) {
        readFileAsHtmlImage(file).then(img => {
          const canvas = this.canvasRef.current!;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);

          this.setState({
            originalImg: Option.some(img),
            fileName: Option.some(file.name),
            replacementColor: Option.some({ r: 0, g: 0, b: 0, a: 0 })
          });
        });
      }
    }
  }

  onReplacementColorChangeComplete(color: ColorResult) {
    this.setState({ replacementColor: Option.some(color.rgb) });
  }

  onCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    this.state.replacementColor.ifSome(replacementColor => {
      const { clientX, clientY } = event;
      const canvas = this.canvasRef.current!;
      const ctx = canvas.getContext("2d")!;
      const dataBefore = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const box = canvas.getBoundingClientRect();
      const localX = Math.round(clientX - box.left);
      const localY = Math.round(clientY - box.top);

      const dataAfter = getImgDataAfterFloodFill(
        dataBefore,
        { x: localX, y: localY },
        replacementColor,
        {
          tolerance: parseInt(this.state.toleranceStr, 10),
          shouldCompareAlpha: this.state.shouldCompareAlpha
        }
      );

      canvas.getContext("2d")!.putImageData(dataAfter, 0, 0);
    });
  }

  onToleranceChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ toleranceStr: event.target.value });
  }

  onShouldCompareAlphaChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ shouldCompareAlpha: event.target.checked });
  }
}

interface State {
  originalImg: Option<HTMLImageElement>;
  fileName: Option<string>;
  replacementColor: Option<RGBColor>;
  toleranceStr: string;
  shouldCompareAlpha: boolean;
}

interface RgbaU8 {
  r: number;
  b: number;
  g: number;
  a: number;
}

interface ColorComparisonOptions {
  tolerance: number;
  shouldCompareAlpha: boolean;
}

class Queue<T> {
  private data: (T | undefined)[];
  private dequeueIndex: number;

  static empty<T>(): Queue<T> {
    return new Queue([]);
  }

  private constructor(data: T[]) {
    this.data = data;
    this.dequeueIndex = 0;
  }

  enqueue(item: T): void {
    this.data.push(item);
  }

  dequeue(): T {
    if (this.hasItem()) {
      const item = this.data[this.dequeueIndex];
      this.data[this.dequeueIndex] = undefined;
      this.dequeueIndex++;
      return item!;
    } else {
      throw new Error("Cannot dequeue an item from an empty queue.");
    }
  }

  hasItem(): boolean {
    return this.dequeueIndex < this.data.length;
  }
}

function getImgDataAfterFloodFill(
  originalData: ImageData,
  floodStartLocation: { x: number; y: number },
  replacementRgbColor: RGBColor,
  options: ColorComparisonOptions
): ImageData {
  const newData = cloneImgData(originalData);
  const replacementColor = getRgbaU8FromRgb(replacementRgbColor);
  const targetColor = getPixelColorAt(newData, floodStartLocation);
  const isColorCloseEnoughToTarget = getColorComparator(targetColor, options);

  if (areColorsEqual(replacementColor, targetColor)) {
    return newData;
  }

  const { width: imgWidth, height: imgHeight } = originalData;

  writePixel(newData, floodStartLocation, replacementColor);

  const queue: Queue<{ x: number; y: number }> = Queue.empty();
  queue.enqueue(floodStartLocation);

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
