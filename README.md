# DeltaX — From a single point

The current scroll-driven DeltaX animation, including all nine chaos effects,
the thin DeltaX title font, and equations for each effect.

## Open it

1. Extract this ZIP.
2. Open the DeltaX folder.
3. Double-click index.html to open it in your browser.
4. Wait briefly on the black screen, then scroll down slowly.

No installation, npm, React, backend, API keys, or internet connection is needed.
The equations and animations are generated locally by the code.

## Optional local server

If you prefer localhost, install Python 3, then:

- Linux/macOS: run `bash start.sh` from this folder.
- Windows: double-click start.bat.

Open http://localhost:8000 in your browser. Press Ctrl+C in the terminal to stop.
The server accepts connections only from your own computer.

## Files

- index.html: page structure, styling, and scroll navigation.
- experience.js: animations, mathematical models, equations, and title reveal.
- start.sh / start.bat: optional Python local-server launchers.

## Editing

Edit either source file in any text editor, save it, and refresh the browser.
Search experience.js for `equationCards` to change the displayed equations.
The `bounds` array sets the scroll ranges for the nine effects.
The #journey rule in index.html sets the total scroll length.

The sequence uses Canvas 2D and plain JavaScript. It includes mobile particle
limits and respects reduced-motion preferences. Some middle effects are
stylised visual models, identified in their equation captions.
