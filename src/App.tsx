import React from "react";
import Option from "@kylejlin/option";
import { SketchPicker, ColorResult, RGBColor } from "react-color";

import "./App.css";

import Canvas from "./components/Canvas";

import {
  History,
  Snapshot,
  Fill,
  ColorComparisonOptions,
  FillUpdate
} from "./types";

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
      fileName: Option.none(),
      shouldBackdropBeCheckered: true,
      backdropColorHex: "#222222",
      history: Option.none(),
      replacementColor: Option.none(),
      toleranceStr: "0",
      shouldCompareAlpha: false,
      isAdjustingPreviousFill: false
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
    this.onStopAdjustingPreviousFillClick = this.onStopAdjustingPreviousFillClick.bind(
      this
    );
    this.onAdjustPreviousFillClick = this.onAdjustPreviousFillClick.bind(this);
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
      (event.ctrlKey || event.metaKey) &&
      !this.state.isAdjustingPreviousFill
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
              some: fileName =>
                this.state.history.match({
                  none: () => <p>Loading {fileName}...</p>,
                  some: () => (
                    <>
                      <p>Successfully uploaded {fileName}</p>
                      <label>
                        Choose another image{" "}
                        <input
                          type="file"
                          accept="image/png, image/jpg, image/jpeg, image/gif"
                          onChange={this.onFileChange}
                        />
                      </label>
                    </>
                  )
                })
            })}
          </div>

          {this.state.replacementColor.match({
            none: () => null,
            some: color => (
              <div>
                {this.state.isAdjustingPreviousFill ? (
                  <div>
                    <h3>Adjusting the previous fill</h3>
                    <p>
                      Any changes you make to the fill settings (including
                      changing the flood start location by clicking on the
                      image) will adjust the previous fill.
                    </p>
                    <button onClick={this.onStopAdjustingPreviousFillClick}>
                      Stop adjusting
                    </button>
                  </div>
                ) : (
                  <div>
                    <h3>Adjusting next fill</h3>
                    <p>
                      Any changes you make to the fill settings will apply to
                      the next fill performed. Clicking on the image will cause
                      a new fill to be performed.
                    </p>
                    <button
                      onClick={this.onAdjustPreviousFillClick}
                      disabled={this.state.history
                        .andThen(history =>
                          history.current().andThen(current => current.fill)
                        )
                        .isNone()}
                    >
                      Adjust previous fill
                    </button>
                  </div>
                )}

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
                  <input
                    type="range"
                    value={this.state.toleranceStr}
                    onChange={this.onToleranceChange}
                    min={0}
                    max={Math.ceil(
                      getMaxEuclideanDistance(this.state.shouldCompareAlpha)
                    )}
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
              some: snapshot => (
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
                    imgData={snapshot.imgDataAfterFill}
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

                {this.state.isAdjustingPreviousFill && (
                  <p>
                    You cannot undo or redo because you are adjusting the
                    previous fill. To be able to undo and redo, stop adjusting
                    the previous fill.
                  </p>
                )}

                <button
                  onClick={this.onUndoClick}
                  disabled={
                    !history.canUndo() || this.state.isAdjustingPreviousFill
                  }
                >
                  Undo
                </button>

                <button
                  onClick={this.onRedoClick}
                  disabled={
                    !history.canRedo() || this.state.isAdjustingPreviousFill
                  }
                >
                  Redo
                </button>

                {!this.state.isAdjustingPreviousFill && (
                  <p>
                    You can also Undo by pressing <kbd>Ctrl-Z</kbd> or{" "}
                    <kbd>Cmd-Z</kbd> and Redo by pressing{" "}
                    <kbd>Ctrl-Shift-Z</kbd> or <kbd>Cmd-Shift-Z</kbd>.
                  </p>
                )}

                <div className="Snapshots" ref={this.snapshotsRef}>
                  {history.past().map((snapshot, i) => (
                    <Canvas
                      key={i}
                      imgData={snapshot.imgDataAfterFill}
                      className="HistorySnapshot NonFinalSnapshot"
                    />
                  ))}
                  {history.current().match({
                    none: () => null,
                    some: snapshot => (
                      <Canvas
                        imgData={snapshot.imgDataAfterFill}
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
                  {history.future().map((snapshot, i, { length }) => (
                    <Canvas
                      key={i}
                      imgData={snapshot.imgDataAfterFill}
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
        this.setState({
          fileName: Option.some(file.name),
          history: Option.none(),
          replacementColor: this.state.replacementColor.or(
            Option.some({ r: 0, g: 0, b: 0, a: 0 })
          ),
          isAdjustingPreviousFill: false
        });

        readFileAsHtmlImage(file).then(img => {
          const imgDataAfterFill = getImgData(img);
          const snapshot: Snapshot = {
            fill: Option.none(),
            imgDataAfterFill
          };

          this.setState({
            history: Option.some(History.fromCurrent(snapshot))
          });
        });
      }
    }
  }

  onReplacementColorChangeComplete(color: ColorResult) {
    const replacementColor = color.rgb;
    this.setState({ replacementColor: Option.some(replacementColor) });

    if (this.state.isAdjustingPreviousFill) {
      this.adjustPreviousFill({ replacementColor });
    }
  }

  onCanvasClick(event: React.MouseEvent<HTMLCanvasElement>) {
    Option.all([
      this.state.replacementColor,
      this.state.history,
      this.state.history.andThen(history => history.current())
    ]).ifSome(([replacementColor, history, currentSnapshot]) => {
      const { clientX, clientY } = event;
      const canvas = this.mainCanvasRef.current!;
      const dataBefore = currentSnapshot.imgDataAfterFill;

      const box = canvas.getBoundingClientRect();
      const localX = Math.round(clientX - box.left);
      const localY = Math.round(clientY - box.top);
      const startLocation = { x: localX, y: localY };

      if (
        doesTargetColorEqualReplacementColor(
          dataBefore,
          startLocation,
          replacementColor
        )
      ) {
        return;
      }

      if (this.state.isAdjustingPreviousFill) {
        this.adjustPreviousFill({ startLocation });
      } else {
        const colorComparisonOptions: ColorComparisonOptions = {
          tolerance: parseInt(this.state.toleranceStr, 10),
          shouldCompareAlpha: this.state.shouldCompareAlpha
        };
        const fill: Fill = {
          startLocation,
          replacementColor,
          colorComparisonOptions
        };
        const imgDataAfterFill = getImgDataAfterFloodFill(dataBefore, fill);
        const newSnapshot: Snapshot = {
          fill: Option.some(fill),
          imgDataAfterFill
        };

        history.push(newSnapshot);
        this.forceUpdate();
      }
    });
  }

  onToleranceChange(event: React.ChangeEvent<HTMLInputElement>) {
    const toleranceStr = event.target.value;
    this.setState({ toleranceStr });

    if (this.state.isAdjustingPreviousFill) {
      this.adjustPreviousFill({
        colorComparisonOptions: { tolerance: parseInt(toleranceStr, 10) }
      });
    }
  }

  onShouldCompareAlphaChange(event: React.ChangeEvent<HTMLInputElement>) {
    const shouldCompareAlpha = event.target.checked;
    this.setState({ shouldCompareAlpha });

    if (this.state.isAdjustingPreviousFill) {
      this.adjustPreviousFill({
        colorComparisonOptions: { shouldCompareAlpha }
      });
    }
  }

  adjustPreviousFill(fillUpdate: FillUpdate) {
    const history = this.state.history.expect(
      "Cannot call adjustPreviousFill if there is no history"
    );
    const currentSnapshot = history
      .current()
      .expect("Cannot call adjustPreviousFill if there is no current snapshot");
    const previousSnapshot = history
      .prev()
      .expect(
        "Cannot call adjustPreviousFill if there is no previous snapshot"
      );
    const previousFill = currentSnapshot.fill.expect(
      "Cannot call adjustPreviousFill if the current snapshot was not created by flood-fill"
    );
    const updatedFill = applyFillUpdate(previousFill, fillUpdate);

    currentSnapshot.fill = Option.some(updatedFill);
    currentSnapshot.imgDataAfterFill = getImgDataAfterFloodFill(
      previousSnapshot.imgDataAfterFill,
      updatedFill
    );
    this.forceUpdate();
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

  onStopAdjustingPreviousFillClick() {
    this.setState({ isAdjustingPreviousFill: false });
  }

  onAdjustPreviousFillClick() {
    this.setState({ isAdjustingPreviousFill: true });
  }
}

interface State {
  fileName: Option<string>;
  shouldBackdropBeCheckered: boolean;
  backdropColorHex: string;
  history: Option<History<Snapshot>>;
  replacementColor: Option<RGBColor>;
  toleranceStr: string;
  shouldCompareAlpha: boolean;
  isAdjustingPreviousFill: boolean;
}

function applyFillUpdate(prevFill: Fill, update: FillUpdate): Fill {
  const newTolerance =
    update.colorComparisonOptions && update.colorComparisonOptions.tolerance;
  const newShouldCompareAlpha =
    update.colorComparisonOptions &&
    update.colorComparisonOptions.shouldCompareAlpha;
  return {
    startLocation: update.startLocation || prevFill.startLocation,
    replacementColor: update.replacementColor || prevFill.replacementColor,
    colorComparisonOptions: {
      tolerance:
        newTolerance !== undefined
          ? newTolerance
          : prevFill.colorComparisonOptions.tolerance,
      shouldCompareAlpha:
        newShouldCompareAlpha !== undefined
          ? newShouldCompareAlpha
          : prevFill.colorComparisonOptions.shouldCompareAlpha
    }
  };
}

function getMaxEuclideanDistance(shouldCompareAlpha: boolean): number {
  if (shouldCompareAlpha) {
    return Math.hypot(255, 255, 255, 255);
  } else {
    return Math.hypot(255, 255, 255);
  }
}
