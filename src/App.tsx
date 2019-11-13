import React from "react";
import Option from "@kylejlin/option";
import { SketchPicker, ColorResult, RGBColor } from "react-color";

import "./App.css";

import Canvas from "./components/Canvas";

import readFileAsHtmlImage from "./readFileAsHtmlImage";

export default class App extends React.Component<{}, State> {
  private mainCanvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: {}) {
    super(props);

    // @ts-ignore
    window.app = this;

    this.state = {
      originalImg: Option.none(),
      fileName: Option.none(),
      history: Option.none(),
      replacementColor: Option.none(),
      toleranceStr: "0",
      shouldCompareAlpha: false
    };

    this.bindMethods();

    this.mainCanvasRef = React.createRef();
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
    this.onUndoClick = this.onUndoClick.bind(this);
    this.onRedoClick = this.onRedoClick.bind(this);
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

          {this.state.history
            .andThen(history => history.current())
            .match({
              none: () => null,
              some: imgData => (
                <div className="MainCanvasContainer">
                  <Canvas
                    imgData={imgData}
                    canvasRef={this.mainCanvasRef}
                    className={"MainCanvas"}
                    onClick={this.onCanvasClick}
                  />
                </div>
              )
            })}

          {this.state.history.match({
            none: () => null,
            some: history => (
              <div>
                <h3>History</h3>
                <div>
                  <h4>Past</h4>

                  <button
                    onClick={this.onUndoClick}
                    disabled={!history.canUndo()}
                  >
                    Undo
                  </button>

                  <div>
                    {history.past().map((imgData, i, { length }) => (
                      <Canvas
                        key={i}
                        imgData={imgData}
                        className={
                          "HistorySnapshot" +
                          (i < length - 1 ? " NonFinalSnapshot" : "")
                        }
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <h4>Future</h4>

                  <button
                    onClick={this.onRedoClick}
                    disabled={!history.canRedo()}
                  >
                    Redo
                  </button>

                  <div>
                    {history.future().map((imgData, i, { length }) => (
                      <Canvas
                        key={i}
                        imgData={imgData}
                        className={
                          "HistorySnapshot" +
                          (i < length - 1 ? " NonFinalSnapshot" : "")
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
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
          const imgData = getImgData(img);

          this.setState({
            originalImg: Option.some(img),
            fileName: Option.some(file.name),
            history: Option.some(History.fromCurrent(imgData)),
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
    Option.all([
      this.state.replacementColor,
      this.state.history,
      this.state.history.andThen(history => history.current())
    ]).ifSome(([replacementColor, history, currentImgData]) => {
      const { clientX, clientY } = event;
      const canvas = this.mainCanvasRef.current!;
      const dataBefore = currentImgData;

      const box = canvas.getBoundingClientRect();
      const localX = Math.round(clientX - box.left);
      const localY = Math.round(clientY - box.top);
      const location = { x: localX, y: localY };

      if (
        doesTargetColorEqualReplacementColor(
          dataBefore,
          location,
          replacementColor
        )
      ) {
        return;
      }

      const options = {
        tolerance: parseInt(this.state.toleranceStr, 10),
        shouldCompareAlpha: this.state.shouldCompareAlpha
      };

      const dataAfter = getImgDataAfterFloodFill(
        dataBefore,
        location,
        replacementColor,
        options
      );

      history.push(dataAfter);
      this.forceUpdate();
    });
  }

  onToleranceChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ toleranceStr: event.target.value });
  }

  onShouldCompareAlphaChange(event: React.ChangeEvent<HTMLInputElement>) {
    this.setState({ shouldCompareAlpha: event.target.checked });
  }

  onUndoClick() {
    this.state.history
      .expect("Cannot call onUndoClick if history is none")
      .undo();
    this.forceUpdate();
  }

  onRedoClick() {
    this.state.history
      .expect("Cannot call onRedoClick if history is none")
      .redo();
    this.forceUpdate();
  }
}

interface State {
  originalImg: Option<HTMLImageElement>;
  fileName: Option<string>;
  history: Option<History<ImageData>>;
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

class History<T> {
  private undoStack: T[];
  private redoStack: T[];

  static fromCurrent<T>(current: T): History<T> {
    const history: History<T> = History.empty();
    history.push(current);
    return history;
  }

  static empty<T>(): History<T> {
    return new History();
  }

  private constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  undo(): T {
    if (!this.canUndo()) {
      throw new Error("Cannot undo nothing.");
    }

    const undone = this.undoStack.pop()!;
    this.redoStack.push(undone);
    return undone;
  }

  canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  redo(): T {
    if (!this.canRedo()) {
      throw new Error("Cannot redo nothing.");
    }

    const redone = this.redoStack.pop()!;
    this.undoStack.push(redone);
    return redone;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  push(item: T) {
    this.undoStack.push(item);
    this.redoStack = [];
  }

  current(): Option<T> {
    if (this.undoStack.length === 0) {
      return Option.none();
    } else {
      return Option.some(this.undoStack[this.undoStack.length - 1]);
    }
  }

  past(): T[] {
    return this.undoStack.slice(0, -1);
  }

  future(): T[] {
    return this.redoStack.slice().reverse();
  }
}

function getImgData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function doesTargetColorEqualReplacementColor(
  imgData: ImageData,
  floodStartLocation: { x: number; y: number },
  replacementRgbColor: RGBColor
): boolean {
  const replacementColor = getRgbaU8FromRgb(replacementRgbColor);
  const targetColor = getPixelColorAt(imgData, floodStartLocation);
  return areColorsEqual(replacementColor, targetColor);
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
