### Resolution & Scaling
- The lobby UI is rendered inside a fixed 430×430 square container.

### UI Scaling Rules
- The game is centered in the viewport if space allows.

### Color Palette
- The UI uses a muted aquatic color palette.
- Primary colors are soft greens and desaturated pastels.
- Interactive elements use darker green accents.
- Black outlines and drop shadows are used to ensure contrast.
- Highlight states (e.g. leader indicator) use warm accent colors.

### Contrast Rules
- All text must remain readable over textured or illustrated backgrounds.
- Text shadows and outlines are used to improve contrast.
- UI panels always use solid backgrounds behind text.

### Asset Style
- The game uses pixel-art–style raster assets (PNG).
- Vector graphics are not used.
- Assets are decorative and do not affect gameplay logic.
- Outline variants may be used for subtle decorative animations.

### Tiling & Layout
- Decorative terrain is composed of evenly sized square tiles.
- Tiles are distributed evenly across the container width.
- Tile layout is deterministic and does not depend on viewport size.

### Sprite Rendering
- Sprites are rendered at their native resolution.
- No runtime scaling or smoothing is applied.
- Visual consistency is preferred over resolution independence.

### Animation Rules
- Animations are cosmetic and non-blocking.
- Animations must not affect input handling or gameplay state.
- Fixed-duration CSS animations are acceptable.

### Lobby visuals description
- Background: #8D9E8E
  Inside the background there is a square shaped lobby with a thin black border. The squares cloor is #ADC8AF. All the contents are center aligned. Inside the contents should be in a column, from top to bottom. 








