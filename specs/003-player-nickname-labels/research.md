# Research: Player Nickname Labels

## 1) Label rendering approach (DOM/SVG)
- **Decision**: Render player nickname labels using SVG `<text>` elements aligned to player positions.
- **Rationale**: Game view already uses SVG for entities; SVG text keeps rendering within DOM/SVG constraints and is easy to position above fish.
- **Alternatives considered**: HTML overlay per player (more DOM nodes, harder to keep in sync with SVG coordinates).

## 2) Label truncation behavior
- **Decision**: Truncate long nicknames in the renderer to a fixed max length (e.g., 12 chars) with an ellipsis.
- **Rationale**: Prevents labels overlapping fish or extending beyond bounds while preserving identity.
- **Alternatives considered**: Dynamic scaling (reduces legibility), multi-line labels (visual clutter).
