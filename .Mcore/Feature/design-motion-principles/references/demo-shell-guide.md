# Demo shell guide

Use `demo-shell.html` as the visual and CSS template for one demo card per Critical or Important audit finding. Opportunities appear in text only.

## Per-finding setup

For each finding number `{n}`, counted from 1 across the full report:

1. Copy the shell's `<style>` block once into the report `<head>`. Keep its shared tokens, layout, stage colors, controls, and reduced-motion guard together; do not duplicate them per finding.
2. Add one uniquely named `@keyframes m{n}` block and a `.demo-{n}__mt` selector. Use the same `{n}` in the matching motion-target class so demos cannot collide.
3. Replace the sample motion target inside `.demo__stage` with the finding's preview. Use the stage tokens `--st-bg`, `--st-fg`, `--st-line`, and `--st-dim` for the target and its UI primitives.
4. Add each finding's `@keyframes` and `.demo-{n}__mt` rule inside a `prefers-reduced-motion: no-preference` guard. Set `.demo__title` and `.demo__timing` for each card, and give its radio controls unique IDs and matching labels.
5. Keep each card non-interactive. The stage theme radios are the only interactive controls.

## Motion and accessibility

- Use a 3-second loop with motion from 0% to about 60%, then hold the final state through 100%.
- The `@keyframes` 100% state must match the target's default static rendering.
- Preserve the shell's `prefers-reduced-motion` behavior; do not add per-finding overrides to that guard.
- Opening `demo-shell.html` by itself shows a placeholder preview, not a real finding-specific animation.
