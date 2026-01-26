# Contracts: Virtual Opponent Movement

## Summary

- No new Socket.IO events are required.
- Bots are controlled server-side and appear as regular players in `game:state-update` payloads.

## Optional Type Notes

- If needed for UI labeling, `GamePlayerStateUpdate` may add an optional `isBot?: boolean` field.
- This is not required for movement behavior and can be omitted to minimize contract changes.
