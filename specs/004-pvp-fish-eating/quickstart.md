# Quickstart: PvP Fish Eating

## Goal
Validate that higher-XP player fish can eat lower-XP player fish, triggering a respawn with XP reset, no XP gain for the eater, and correct XP labels.

## Prerequisites
- Run the client and server using existing development scripts.
- Open two browser windows (or two different browsers) to simulate two players.

## Manual Validation Steps

1) **Create a multiplayer session**
   - Open two clients and join the same lobby.
   - Start the game so both players spawn in the same session.

2) **Verify XP label display**
   - Confirm each fish displays the nickname and current XP value above the fish.
   - Eat an NPC fish with one player and confirm their XP label updates on the next state update.

3) **Higher XP eats lower XP**
   - Increase Player A’s XP by eating NPC fish until Player A has higher XP than Player B.
   - Collide Player A with Player B.
   - Expected:
     - Player B enters respawn state and reappears after the normal NPC-eat delay.
     - Player B’s XP resets to baseline on respawn.
     - Player A’s XP does **not** increase from eating Player B.

4) **Equal XP collision**
   - Ensure both players have equal XP.
   - Collide them.
   - Expected: No respawn; both remain in play.

5) **Grace period protection**
   - Immediately after Player B respawns, collide Player A with Player B.
   - Expected: Player B is protected by the same grace period as NPC-eat respawns (no immediate re-eat).

## Expected Outcomes
- PvP eating triggers respawn only when eater XP is strictly higher.
- Respawn timing and invulnerability match NPC-eat behavior.
- XP labels always reflect current XP.
- No XP is awarded to the eater for player-vs-player eats.
