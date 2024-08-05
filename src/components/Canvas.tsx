import React from "react";

export default class Canvas extends React.Component<Props> {
  private canvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: Props) {
    super(props);

    this.canvasRef = props.canvasRef || React.createRef();
  }

  render(): React.ReactElement {
    const { imgData } = this.props;
    return (
      <canvas
        {...omitNonNormalProps(this.props)}
        ref={this.canvasRef}
        width={imgData.width}
        height={imgData.height}
      />
    );
  }

  componentDidMount(): void {
    this.renderImgData();
  }

  componentDidUpdate(): void {
    this.renderImgData();
  }

  renderImgData(): void {
    const canvas = this.canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(this.props.imgData, 0, 0);
  }
}

interface Props extends React.CanvasHTMLAttributes<HTMLCanvasElement> {
  imgData: ImageData;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

function omitNonNormalProps(
  props: Props
): React.CanvasHTMLAttributes<HTMLCanvasElement> {
  const clone = { ...props };

  delete (clone as any).imgData;
  delete clone.canvasRef;

  return clone;
}
