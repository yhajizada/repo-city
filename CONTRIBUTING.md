# Contributing

Keep RepoCity local, quick to try, and small enough to understand.

Run `npm test`, open the app, and check the behavior your change affects. Renderer changes should be checked with a real folder, keyboard controls, both themes, rotation and PNG export. Check a narrow screen too.

Do not add file-content reads, telemetry or remote dependencies without discussing the change first. Insert imported file names into the UI with `textContent`, never HTML. Preserve deterministic layouts and keep large-folder limits clear to the user.

Describe the problem, the resulting behavior and how you tested it in your pull request. A screenshot helps with visual changes.
