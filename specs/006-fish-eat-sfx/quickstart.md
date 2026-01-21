# Quickstart: Fish Eat Crunch Sound

## Prerequisites
- Run client and server locally.
- Ensure sound is enabled in the UI (speaker icon).

## Manual Verification

1. Start a multiplayer lobby and begin a match.
2. Trigger one or more fish-eat events (player eats NPC, player eats player, NPC eats NPC).
3. Confirm a crunch sound plays once per `fish-eaten` event.
4. Trigger rapid consecutive fish-eat events.
5. Confirm overlapping crunch sounds layer for each event.
6. Toggle sound off during gameplay.
7. Confirm no crunch sounds play while muted.
8. Temporarily rename/remove `small-crunch.mp3` and refresh.
9. Confirm gameplay continues without crashes and no fallback sound plays.

## Rollback
- Revert changes to the sound manager and event handling.
- Restore any removed audio assets.
