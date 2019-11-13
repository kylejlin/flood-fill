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
