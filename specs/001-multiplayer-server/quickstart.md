# Quickstart: Multiplayer Server v1

## Goal

Manually validate the server-side multiplayer session flow, ready association, fixed timestep loop, and disconnect behavior.

## Prerequisites

- pnpm installed
- Node.js LTS installed

## Steps

1. Start the server.
2. Open two browser windows and create/join the same lobby.
3. Start the game from the lobby leader.
4. From each client, send a `game:ready` packet with the lobby player id.
5. Observe that both clients receive `game:tick` packets each tick.
6. Attempt a new `game:ready` from a non-session player and verify it is rejected.
7. Disconnect one client and verify the remaining client receives `game:playerDisconnected`.
8. Disconnect the last client and verify the session ends immediately.

## Expected Results

- Session starts when the lobby leader triggers start.
- Ready association is acknowledged only for valid lobby players.
- Tick packets include hostile snapshot data with entity id, position (x,y), and velocity.
- Mid-game join attempts are rejected with an error.
- Disconnect notifications are broadcast to remaining players.
- Session ends immediately when the last player leaves.
