# Design, visualization and media

## Match the destination

Determine whether the result is production UI, a prototype, an inline explainer, a standalone report, a slide deck, an image, a 3D model or a rendered video. Use its appropriate format and the actual rendering environment. Runtimes have different contracts; do not apply a proprietary Design Component syntax, CSS token set, browser-storage restriction or starter engine to a different host.

For existing products, inspect source code, design files, `toolbox/` assets (`toolbox/logo.png`) and established tokens before changing appearance. Preserve exact source values and component behavior when fidelity is requested. For new designs, choose a coherent direction from audience, purpose and brand. Use Hallmark-Design/UI-UX-Pro-Max and the Agency Frontend/UI-UX specialist lens when applicable. A small requested edit changes the targeted content, not the whole layout.

## UI and design systems

Use real assets from `toolbox/` and existing icon systems. Do not invent a missing company's logo or imply unverified branding. Document necessary substitutions. Keep typography, spacing, colors, interaction states and responsive behavior coherent. Check contrast, keyboard navigation, focus, empty/loading/error states and reduced-motion needs where relevant.

When reproducing a design system, enumerate the supplied component families first; track coverage rather than silently stopping at a convenient subset. Separate foundation tokens, semantic tokens, components, states/variants and composed screens. Bind to existing tokens instead of drifting hardcoded copies. Create only components supported by source evidence or explicit requirements; identify justified additions.

Preserve semantic comment anchors and stable labels through revisions. Link examples to the actual component contract. For Figma operations, use the installed Figma skills and their required prerequisites; screenshots supplement accessible design context, variables and component data. If an essential source cannot be read, report the gap instead of inventing its structure.

## Charts, diagrams and interactive explanations

Use a visual when it explains relationships or comparisons better than prose. Keep labels legible, groupings clear, arrows meaningful and color encodings documented. Reduce dense diagrams into an overview plus details. Apply theme-aware contrast and accessible descriptions. Follow actual diagram-tool syntax and limits.

Charts need reliable data, units, dates, meaningful scales, labels and disclosed missing values. Avoid misleading axes and unsupported precision. Use interactive exploration when filtering or changing inputs helps; use standalone standard plotting artifacts for scientific or exportable figures. Do not substitute a screenshot for editable data when the destination supports live charts.

## 3D, Animation and Video

- **3D**: Choose a real viewer/export tool that exists. Compose named geometry and materials with a consistent coordinate system, scale and origin. Verify lighting, framing, orbit interaction, proportions and intended export formats (OBJ/MTL vs GLB).
- **Animation and video**: Use Vox-Director when applicable. Establish message, audience, story arc, duration and aspect ratio, then assets, scenes, timing, audio/captions and assembly. Use one authoritative timebase and shared cue definitions. Clearly distinguish an HTML animation, storyboard or script from a finished video.

## Delivery

Inspect the result at its intended dimensions and important responsive states. Check links, asset loads, console errors and meaningful interactions. Use actual files/attachments or preview tools, and state which forms of rendering/export were verified.
