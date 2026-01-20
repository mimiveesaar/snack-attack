# PvP Fish Eating Contract Updates

## Scope
This feature reuses existing Socket.IO `/game` namespace events. No new events are introduced.

## Server → Client: `game:state-update`

### Player State
`players[].xp` remains the source of truth for XP displayed above fish. When a player is eaten by another player:
- The eaten player respawns after the existing NPC-eat delay.
- The eaten player’s `xp` resets to baseline.
- The eater’s `xp` does **not** increase from the player-eat event.

### Collision Events
The `events` array may include a `fish-eaten` event for player-vs-player eating.

```typescript
{
  type: 'fish-eaten';
  tick: number;
  data: {
    eatenPlayerId: string;
    eatenByPlayerId: string;
    playerLostXp: number; // XP before reset
  };
}
```

## Notes
- NPC-eat `fish-eaten` events remain unchanged.
- Client behavior should use `players[].status`, `respawnTimeMs`, and grace rules for visuals.
