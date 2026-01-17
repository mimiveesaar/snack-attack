## Client

The architecture we want to use is that of managers and managed entities. Managers control the behaviour of managed entities.
Managers are responsible for creating and destryoing managed entities.Managers are a singletonFor example the Hostile Renderer should manage all hostile fish entites. Entity represent a generic game object. Every entity is given a unique id. Prefer Data-Orientation over Object Orientation.

Every collision that is purely visual and does not have any consequences other than visual should be defined on the client.
Collisions that affect the score or power-ups should live on the server.

Client Engine Ticks are responsible for sending info to server on every tick, but cannot be a reliable source to keep the game synchronous for everyone. Server uses a fixed timestep, but client uses requestAnimationFrame only for rendering.

Gameloop creates a reliable synchronous ticking on the server side that cannot be manipulated with by the client and that is the source of truth for our game.

The project is a SPA a single page application.

If it walks like a duck and it quacks like a duck, then it must be a duck. Types are checked on the principle of structural typing rather then inheritance.

### Client Engine
The client engine creates the client side ticking. Movement input form keyboard is sent to the server on client ticks. If the client predicts movement but the server corrects it (e.g. due to collisions, powerups, cheating prevention), the client needs to:

- Receive authoritative state
- Rewind to that state
- Reapply unacknowledged inputs

### Client Controller
Listens to player input. 
Relays players position to server on ticks

### Scene Contoller
Moves player between Lobby and Game scene.
Controlled by the server.

## Game Engine
Generates constant ticks.
Uses requestAntimationFrame

## Physics
Does client side collision checks.
Must compensate lag by using time instead of ticks.

### Visual Entities
1. Fish - Base class for all fish. Is responsible for displaying the fish and its movement direction and other movement logic like wiggle and drag.
Has a map of different fish textures

    a. Hostile-fish.ts - Is responsible for displaying hostile fish.  Managed by Hostile Renderer
    b. Player-fish.ts - Is responsible for displaying player fish. Managed by Player Renderer
2. Rock.ts - Renders the rock sprite. Can specify size by being able to select a multiplier or could have a randomizer for the sizes.
3. Seaweed.ts - Renders the seaweed sprite. Can specify size.
4. Bubble.ts - Renders the bubble sprite. Can specify size.
5. Power-up.ts - Renders different power-up sprites. Type can be specified.


### 2D Rendering
1. Hostile Rendering - Receives location of other players and NPCs. Renders on client tick
2. Powerup RRenderer - Receives location of PowerUps from the server. Renders on client tick
3. Decal Rnderer - Receives location of bubbles and other decals from the server. Renders on client tick
4. Player Renderer - Receives location of the client controlled player from the server. Renders on client tick

### UI
1. Sidebar - Fish-O-Meter (XP), Power Up, Leaderboard
2. Lobby - Shows Host name, Shows players in the lobby, Show ready count, Let's player press ready 
3. Join Lobby - Shows Host name, Shows players in the lobby
4. Overlay - Used for pausing the game, Used for End screen 
5. Waiting for game - Tells players there is a active game.

### Providers
1. Engine Provider - initializes the engine with 60 tps and provides access to the ticks to all its children elements (/lobby and /game).
2. Connection Provider - creates a socket connection and provides access to the socket connection for all its children.


## Server
There are two namespaces: lobby and game.
Lobby namespace:
1. Lobby Controller - Receives data from clients. Enriches data for orchestrator. Gives a clear overview of possible events. Lobby Controller passes messages down to Lobby Orchestrator. Lobby Controller gets player Id fom Socket Id from Lobby Registry
2. Lobby Orchestrator- Manages creation/deletion of lobbies. Delegates messages to lobbies. Lobby Orchestrator passes messages down to the Lobby.
3. Lobby Registry - Binds players Id to Socket.IO id.
4. Lobby - Handles lobby business logic (gamemodes, playerlist, etc).

Game namespace:
1. Game Orchestrator - Listens to player input. Relays players position to server on ticks.
2. Game - Listens to player input. Relays players position to server on ticks.
3. Game Loop - Listens to player input. Relays players position to server on ticks.

Establish a max server update rate.



## Messaging 
*Socket* - PLayer uses a pesristent Player ID.Map sockets to the player via registry. Socket ID is transport, not identity. Player should keep the same connection open throughout playing
Socket.io - SocketIO manages our WebSokets. Use SocketIO rooms to create separate lobbies and game sessions  

*Graceful Disconnect* - When a socket loses connection, player should be cleaned up from the game/lobby. Empty lobbies are deleted

*Events in ticks* - Events that should be processed in the same frame, should be packaged together in a single packet. Game state + fish eaten should be sent together.

Every server message includes serverTick.

### Lobby Events
*Client Events* 
- Create Lobby - Create a lobby in the backend with a unique URL or create a, player, connected to this lobby. Information about player: Nickane, Fish colour. 
- Join Lobby - Request joining a lobby. Information about player: Nickname, Fish colour. 
- Start Game - Can only be triggered by the lead player. Every game has unique id. 

*Server Events* 
- Lobby Joined - Information about the game: Gamemode, dificulty, Player {nickname(x), id, color, leader}, Playerlist [{nickname, leader}]. Validate players name, incase of dublicat, add a number after a dublicated names, Nickname (x), to differentiate players. Trigger player scene manager to load lobby scene. 

- Game Started - Gives player room id to join. Trigger players scene manager t load game scene. 

- Lobby Joined failed - Error code. 
    LOBBY_FULL - Lobby is already full. FAILED - Unknown reason.

- Kicked From Lobby - Gamemode changed to singleplayer, causing all of the other players to get kicked. A warning should be prompted, before actual kicking.

### Game Events

*Client Events* 
- Player Ready - Scene manager has successfully loaded the game scene. Player is ready to start receiving game state. Player id gets associated with socket Id

- Player Tick - Vec 2D, velocity, Timestamp (UNIX), SocketID

- Game paused - SocketID, Only the lead player can toggle game paused state. 

*Server Events* 
- Location - Eatch tick. Hostiles [{id, vec2, velocity}], powerups [{id, vec2}]

- Power up Gained - id, powerup_type

- Power up Lost - id, powerup_type

- Score - send only if changed. players [{id, xp}]

- Time Changed - Each second. timeleft (unix)
- Game over - Vec2D, Velocity, Socked ID
- Game Paused - Vec2D, Velocity, Socked ID
- Game Resumed - nickname (the one who indicated the game to resume)
- Player Disconnected - entity_id, nickname
- Fish Eaten - entity_id

## Smooth Movement Tactics

### Hostile Movement
Potential Issues and fixes:
1. Network is unreliable - Packets may arrive at different intervals, causing entities to move at uneven pace.
FIx - Jitter buffer - Calculating player movement on the client, guarantees responsive movement to the player.

### Player Movement
Potential Issues and fixes:
1. Calculate player movement on the server - Sending player inputs directly to the server causes janky movement, due to the delay caused by network.
Fix - Calculate player movement on the client - Calculating player movement on the client, guarantees responsive movement to the player.
2. Uneven Client TPS/FPS - Since clients TPS/FPS can differ, but we want to ensure smooth movement, we need to use compensation to achieve a standardized movement speed. 
Fix - Compensate player physics using time - To ensure movement happens at the same speed regardless of whether the hardware is running at 20 TPS or 200 TPS, you decouple logic from rendering.

Instead of moving "per frame," you move in Fixed Timesteps (e.g., exactly 0.05s chunks).

If a client lags, it accumulates "missed time." When it recovers, it runs the physics loop multiple times in a single frame to "catch up" to the current time, ensuring it has traveled the same distance as everyone else.


### Entity Interpolation
Potential Issues and fixes:
1. Server TPS is lower than the clients - The server might give us less updates than we need for smooth rendering due to lower TPS than the clients.
Fix - Use Entity Interpolation - Calculate a percentage of progress (alpha) that we use to generate intermediate locations between two game states.

## Clock Synchronzation
Simple time sync handshake:
Ping → pong → offset calculation
Required for accurate lag compensation

## Entites
Entities will need states such as:
- Spawning
- Alive
- Despawning
- Destroyed

## Error & Recover States
For cases like: 
- Server crash mid-game
- Lost connection mid-match
- Rejoin game in progress
- Host disconnects

Add:
- Reconnect flow
- Grace period
- Fallback to spectator / game end


## Visuals
The game view has the same background as the lobby #8D9E8E. The game view is a ractangle shape, with a black border. The ractangles background should be a linear gradient 0% #B4C3B5 and 100% #49534A. The game timer is black and inthe format minutes: seconds: milliseconds. The timer is locate din the upper left corner of the game view. On the bottom edge of the game screen there should be sand with some rocks and seaweed. The sidebar is locate dto the right of the game view. The sidebars backgrou nd is #ADC8AF. The font used should be a pixelated font. The sidebar is also a rectangle but an oblong one and has a black border. 