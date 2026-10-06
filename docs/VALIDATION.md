# Validation

- Seven core tests passed locally: exclusions, normalization, file limits, deterministic layouts, non-overlapping districts, metadata-only processing, hit testing and formatting.
- The app was opened in the Codex browser. Keyboard building selection, rotation, day/night switching and reset were checked.
- Folder selection was tested with this project's real directory. The inspector used file names and sizes and the city updated successfully.
- PNG export was triggered and the app confirmed a successfully generated image. The browser automation download-event callback did not complete; the downloaded file itself was not inspected.
- The narrow layout was checked at a browser-reported width of 375 pixels: document width matched the viewport, with the city immediately below the header.
- Node.js is needed only for the optional local server and tests. The UI has no dependency install or build step.
