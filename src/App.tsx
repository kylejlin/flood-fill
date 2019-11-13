import React from "react";
import Option from "@kylejlin/option";
import { SketchPicker, ColorResult, RGBColor } from "react-color";

import "./App.css";

import Canvas from "./components/Canvas";

import { History } from "./types";

import readFileAsHtmlImage from "./readFileAsHtmlImage";
import {
  doesTargetColorEqualReplacementColor,
  getImgData,
  getImgDataAfterFloodFill
} from "./image";

export default class App extends React.Component<{}, State> {
  private mainCanvasRef: React.RefObject<HTMLCanvasElement>;
  private snapshotsRef: React.RefObject<HTMLDivElement>;
  private currentSnapshotRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: {}) {
    super(props);

    // @ts-ignore
    window.app = this;

    this.state = {
      originalImg: Option.none(),
      fileName: Option.none(),
      shouldBackdropBeCheckered: true,
      backdropColorHex: "#222222",
      history: Option.none(),
      replacementColor: Option.none(),
      toleranceStr: "0",
      shouldCompareAlpha: false
    };

    this.bindMethods();

    this.mainCanvasRef = React.createRef();
    this.snapshotsRef = React.createRef();
    this.currentSnapshotRef = React.createRef();
  }

  bindMethods() {
    this.onKeyDown = this.onKeyDown.bind(this);

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
    this.onBackdropColorChangeComplete = this.onBackdropColorChangeComplete.bind(
      this
    );
    this.onShouldBackdropBeCheckeredChange = this.onShouldBackdropBeCheckeredChange.bind(
      this
    );
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  onKeyDown(event: KeyboardEvent) {
    if (
      document.activeElement === document.body &&
      event.key.toLowerCase() === "z" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      if (event.shiftKey) {
        this.state.history.ifSome(history => {
          if (history.canRedo()) {
            this.redo();
          }
        });
      } else {
        this.state.history.ifSome(history => {
          if (history.canUndo()) {
            this.undo();
          }
        });
      }
    }
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

                <section>
                  <h3>Backdrop</h3>
                  <label>
                    Use checkerboard:{" "}
                    <input
                      type="checkbox"
                      checked={this.state.shouldBackdropBeCheckered}
                      onChange={this.onShouldBackdropBeCheckeredChange}
                    />
                    {!this.state.shouldBackdropBeCheckered && (
                      <label>
                        Color:
                        <SketchPicker
                          disableAlpha
                          color={this.state.backdropColorHex}
                          onChangeComplete={this.onBackdropColorChangeComplete}
                        />
                      </label>
                    )}
                  </label>
                </section>

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
                <div
                  className={
                    "MainCanvasContainer" +
                    (this.state.shouldBackdropBeCheckered
                      ? " Checkerboard"
                      : "")
                  }
                  {...(this.state.shouldBackdropBeCheckered
                    ? {}
                    : {
                        style: {
                          backgroundColor: this.state.backdropColorHex
                        }
                      })}
                >
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

                <button
                  onClick={this.onUndoClick}
                  disabled={!history.canUndo()}
                >
                  Undo
                </button>

                <button
                  onClick={this.onRedoClick}
                  disabled={!history.canRedo()}
                >
                  Redo
                </button>

                <p>
                  You can also Undo by pressing <kbd>Ctrl-Z</kbd> or{" "}
                  <kbd>Cmd-Z</kbd> and Redo by pressing <kbd>Ctrl-Shift-Z</kbd>{" "}
                  or <kbd>Cmd-Shift-Z</kbd>.
                </p>

                <div className="Snapshots" ref={this.snapshotsRef}>
                  {history.past().map((imgData, i) => (
                    <Canvas
                      key={i}
                      imgData={imgData}
                      className="HistorySnapshot NonFinalSnapshot"
                    />
                  ))}
                  {history.current().match({
                    none: () => null,
                    some: imgData => (
                      <Canvas
                        imgData={imgData}
                        className={
                          "HistorySnapshot CurrentSnapshot" +
                          (history.future().length > 0
                            ? " NonFinalSnapshot"
                            : "")
                        }
                        canvasRef={this.currentSnapshotRef}
                      />
                    )
                  })}
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
    this.undo();
  }

  undo() {
    this.state.history
      .expect("Cannot call onUndoClick if history is none")
      .undo();
    this.forceUpdate(() => {
      this.scrollHistoryToCurrentSnapshot();
    });
  }

  onRedoClick() {
    this.redo();
  }

  redo() {
    this.state.history
      .expect("Cannot call onRedoClick if history is none")
      .redo();
    this.forceUpdate(() => {
      this.scrollHistoryToCurrentSnapshot();
    });
  }

  onBackdropColorChangeComplete(color: ColorResult) {
    this.setState({ backdropColorHex: color.hex });
  }

  onShouldBackdropBeCheckeredChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    this.setState({ shouldBackdropBeCheckered: event.target.checked });
  }

  scrollHistoryToCurrentSnapshot() {
    const currentSnapshot = this.currentSnapshotRef.current;
    if (currentSnapshot !== null) {
      const snapshotsContainer = this.snapshotsRef.current!;
      const snapshotsContainerWidth = snapshotsContainer.getBoundingClientRect()
        .width;
      const currentSnapshotRight = currentSnapshot.getBoundingClientRect()
        .right;
      snapshotsContainer.scroll(
        currentSnapshotRight +
          snapshotsContainer.scrollLeft -
          snapshotsContainerWidth,
        0
      );
    }
  }
}

interface State {
  originalImg: Option<HTMLImageElement>;
  fileName: Option<string>;
  shouldBackdropBeCheckered: boolean;
  backdropColorHex: string;
  history: Option<History<ImageData>>;
  replacementColor: Option<RGBColor>;
  toleranceStr: string;
  shouldCompareAlpha: boolean;
}
