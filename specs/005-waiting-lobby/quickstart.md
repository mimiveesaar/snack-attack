# Quickstart: Waiting Lobby Enhancements

## Prerequisites
- pnpm installed
- Node.js LTS

## Run the app
- Start the server: pnpm run dev:server
- Start the client: pnpm run dev:client
- Open two browser windows to the lobby URL

## Manual Verification
1. Create a lobby in Window A and start a game.
2. In Window B, join the lobby while the game is active.
   - Expect to see the waiting screen with the full leaderboard and timer.
3. While the game is still active and the lobby has open slots, join from Window C.
   - Expect Window C to remain on the waiting screen (not auto-join) until the game ends.
4. Let the game end.
   - If slots are available, Window B should auto-join the lobby within 2 seconds.
5. Fill the lobby to 4 players, then join from another window during an active game.
   - Expect the waiting screen to show “Lobby full (4/4). Waiting for a slot.”
6. When no active game exists but the lobby remains full, the timer area should display “No active game”.
