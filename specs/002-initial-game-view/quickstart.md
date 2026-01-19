# Quickstart: Initial Game View (Background & Atmosphere)

## Prerequisites

- Node.js (LTS)
- pnpm

## Run the client

1. Install dependencies (if not already installed).
2. Start the client dev server.

## View the game scene

Open the route with a seed:

- `/game?seed=reef-001`

If `seed` is missing or invalid, the client uses a documented default seed.

## Manual verification checklist

- The /game route renders dirt and sand terrain.
- Rocks, seaweed, and bubbles appear as ambient elements.
- Bubbles rise from the ground and loop.
- No player characters are rendered.
- Using the same seed on two clients yields identical layout.
