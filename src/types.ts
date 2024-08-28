import Option from "@kylejlin/option";

export interface RgbaU8 {
  readonly r: number;
  readonly b: number;
  readonly g: number;
  readonly a: number;
}

export interface ColorComparisonOptions {
  readonly tolerance: number;
  readonly shouldCompareAlpha: boolean;
}

export interface Fill {
  readonly startLocation: Vec2;
  readonly replacementColor: RgbaU8;
  readonly colorComparisonOptions: ColorComparisonOptions;
}

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface FillUpdate {
  readonly startLocation?: Fill["startLocation"];
  readonly replacementColor?: Fill["replacementColor"];
  readonly colorComparisonOptions?: Partial<Fill["colorComparisonOptions"]>;
}

export interface MutableSnapshot {
  fill: Option<Fill>;
  imgDataAfterFill: ImageData;
}

export class History<T> {
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

  push(item: T): void {
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

  prev(): Option<T> {
    const past = this.past();
    if (past.length > 0) {
      return Option.some(past[past.length - 1]);
    } else {
      return Option.none();
    }
  }
}
