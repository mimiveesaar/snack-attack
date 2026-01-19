# Quickstart: Player Movement (Client)

## Prerequisites
- Node.js (current LTS)
- pnpm

## Run
1. Install dependencies: `pnpm install`
2. Start the client: `pnpm run dev:client`
3. Open http://localhost:5173/game

## Manual Verification
- Press WASD and arrow keys; the fish moves immediately and stops when keys are released.
- Hold left and right together; horizontal movement cancels.
- Hold up or down; vertical movement stays within a 45° angle.
- Simulate a stall (background tab briefly) and return; movement catches up without freezing.
- Confirm the fish sprite uses the provided art assets.
