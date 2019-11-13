# flood-fill

A TypeScript implementation of [flood-fill](https://en.wikipedia.org/wiki/Flood_fill) that supports setting custom alpha values for the replacement color.

Click [here](https://kylejlin.github.io/flood-fill) to try it out!

## Usage

1. Open the [web page](https://kylejlin.github.io/flood-fill).
2. Upload an image.
3. Choose your replacement color.
4. Choose your tolerance.

   - Tolerance is defined as the Euclidean distance threshold under which the algorithm will continue filling.
   - Tolerance defaults to `0`, meaning the algorithm will only continue filling the adjacent pixels that exactly match the target color.

5. Click to flood-fill.

## Motivation

If you Google "online fill bucket", you can find a plethora of existing flood-fill tools.
However, I have yet to see one that allows you to configure the alpha value of the replacement color.
This is problematic, as my primary use case for flood-fill is to remove opaque backgrounds.

## License

MIT

Copyright (c) 2019 Kyle Lin
