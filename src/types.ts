import Option from "@kylejlin/option";

export interface RgbaU8 {
  r: number;
  b: number;
  g: number;
  a: number;
}

export interface ColorComparisonOptions {
  tolerance: number;
  shouldCompareAlpha: boolean;
}

export interface Fill {
  startLocation: { x: number; y: number };
  replacementColor: RgbaU8;
  colorComparisonOptions: ColorComparisonOptions;
}

export interface FillUpdate {
  startLocation?: Fill["startLocation"];
  replacementColor?: Fill["replacementColor"];
  colorComparisonOptions?: Partial<Fill["colorComparisonOptions"]>;
}

export interface Snapshot {
  fill: Option<Fill>;
  imgDataAfterFill: ImageData;
}

export class Queue<T> {
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
