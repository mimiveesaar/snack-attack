### Resolution & Scaling
- The lobby UI is rendered inside a fixed 500×500 square container.

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

### Initial view visuals description
  Background: #8D9E8E
  Inside the background there is a square shaped lobby with a thin black border. The squares cloor is #ADC8AF. All the contents are center aligned. Inside the contents should be in a column, from top to bottom. First the game name, then the nicname entering option, then the fish selection option and lastly the button to enter the lobby or create the lobby (Depending on wether the player is the first one in the lobby or joining an existing lobby).

### Lobby view visuals description

    Background colour and the squares color ar the same as in initial view. Only the contents of the square change in lobby view. Now we need to have the game name, followed by the player names and thei associated colors and also and indicator for who is the leader. Then if you are the lead player I want to have buttons for Selecting the Gamemode, Difficulty and Button for copying the 'share URL' link to your clipboard. Finally a button to start the game.
    If you're a joining player, you should have the game name, players joined, copy share URL button and and text that would inform you that you're waiting for the lead player to start the game.

### Waiting Lobby View
    Colours and layout should be te same as all the other lobby views. This time, in a center aligned column we want to have: the game name, indicator that there is an ongoing game at the moment, leaderboard for the ongoing game and a text like 'Waiting for new game...'.











