# Mosaic
This was a small test project to work on some things that I hadn't worked with before. For example: request animation frame, Workers and everything had to be in native JS. No frameworks.

The idea was to take an image uploaded by the user, turn it into small mosaic tiles based on the average colour across the pixels of the size of the tile (e.g. 16x16). From this average colour, ask the node server for the SVG element for that colour and display it.
