# Socket Event Contracts: Singleplayer Lobby Customization

## Types

```ts
export type OpponentColor = 'red' | 'blue' | 'green' | 'orange';

export interface OpponentSlot {
  slotId: number; // 1–3
  name: string;
  color: OpponentColor;
  isActive: boolean;
}
```

## Updated Lobby State

```ts
export interface LobbyState {
  lobbyId: string;
  players: Player[];
  gamemode: 'singleplayer' | 'multiplayer';
  difficulty: 'easy' | 'medium' | 'hard';
  maxPlayers: number;
  status: 'waiting' | 'active';
  shareUrl: string;
  createdAt: string;
  singleplayerSettings?: {
    opponents: OpponentSlot[];
  };
}
```

## Client → Server Events

### lobby:updateSettings
**Current**
```ts
{ lobbyId, gamemode, difficulty }
```

**Additions (singleplayer only)**
```ts
{ singleplayerSettings?: { opponents: OpponentSlot[] } }
```

## Server → Client Events

### lobby:state
**Behavior**: Include `singleplayerSettings` when `gamemode` is `singleplayer`.

## Start Flow

### lobby:start
**Current**
```ts
{ lobbyId }
```

**Behavior**
- Server uses `singleplayerSettings.opponents` from lobby state to instantiate virtual opponents on game start.
