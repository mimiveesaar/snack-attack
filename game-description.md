Describe what you want to build. Focus on the what and why, not the tech stack.

## Active Game View

This is the main active game view. The general gameplay is following: there are npc fish and there are playable fish characters. The game lasts for two minutes and there is a timer ticking towards 0 to show how much time is left. All fish can be eaten by each other: players by NPCs, NPCs by players, players by players and NPCs by NPCs. 
    
The rules for eating are:
1. A fish can eat another fish if their XP is greater than the other fishes;
2. NPCs have a fixed XP that does not change and NPC fish do not grow in size;
3. When a fish gets eaten its XP is acquired by the eater.
4. There are 3 growth phases for all playable fish.
5. If a NPC fish gets eaten it despawns.
6. If a playable fish gets eaten it respawns without its XP (since the XP was given to the player who ate them)
7. If two fish with equal XP collide, neither is eaten;
8. If multiple eatable collisions occur in the same tick, resolution order is deterministic and server-authoritative;
9. A minimum safe distance is enforced on spawn.

After the timer ends whoever from the playable characters gained the most XP wins. If multiple playable fish have equal XP at game end they tie.

The game world has fixed boundaries that fish cannot cross.


## Fish Logic

There are 4 coulours available for the playable fish: red, yellow, blue and green.

There are 3 different types of NPC fish:
1. Pink fish, with the lowest fixed XP
2. Grey fish, with XP higher thatn the pink fis but lower thhan the brown fish;
3. Brown fish, with the highest XP of the NPC fish.
    
Playable fish growth rules: In the beginning of the game all the playable fish are spawned the same size. During the game, by eating other fish and growing ones XP, the playable fish are able to grow on two occasions. I'll leave for you to decide, how much xp should be acquired for the first growth and how much for the second (be reasonable). While waiting to respawn, the player can observe the game but cannot interact.

Playable fish have three growth phases:
Growth affects:
- visual size
- collision radius

Growth does not affect:
- movement speed
- XP gain rules

Npc fish:
1. are randomy spawned and loiter around the game;
2. Do not actively pursue the playable characters;
3. More of the pink NPC fish should be spawned than the grey ones and the brown ones should be rarer than the grey ones;
4. NPC fish should never be spawned directly on top of aplayable fish;
5. are spawned with a maximum concurrent count per NPC type.
6. NPC fish do not grow and do not gain XP
7. Eaten NPC fish despawn
    
When a playable fish is eaten:
- it respawns after a short delay
- it respawns at a random spawn location
- it respawns at base size and base XP
- it cannot be eaten for a brief grace period

## XP Logic
    XP is a scalar value used to:
    - determine whether a fish can eat another fish
    - determine growth phase of playable fish
    - determine the winner at game end

    XP has no upper cap.
    Growth phases affect fish size only and do not alter eating rules.

## Power-ups    
Power-ups are icons that appear in the game window. Only actual players can eat them, NPC fish cant. 2 Powerups are available. Only one powerup at the time, active powerups get overwritten by new ones. Powerup duration is 10 seconds. 
Speed Boost: player has 1,2X more speed than normal.
Double XP: Double points for every eaten fish.

If a playable fish is eaten, any active power-up is lost.
Power-ups do not affect growth thresholds.
Power-ups do not spawn or tick down while the game is paused.


## Sound Effects
Game has backround music and appropriate soundeffect according to player activity. Sound effects are local to the player and do not affect gameplay.

## Game Paused View
Only lead player can pause the game. If game is paused, then timer is paused as well. Paused view shows that the lead player  paused the game. Lead player is only one that has the ability to resume to the game, others have ability to quit. The lead player can pause the game at any time.

## Game End View
If game ends, a new owerlay window appears, with information. "Game Finished" or about the players rank. IT should also include leaderboard with scores. Then ability to go back to the lobby or create a new lobby.  

## Sidebar
The sidebar is on the right side of the game, it sould be on display all the time while game is ongoing. 
It should display question mark button on the left corner, for game rules and explenation. On the upper right corner, there are pause button and quit button. 
    
Sidebar shows Player Score, Fish-o-meter and Leaderboard.
    
Score
The player score displays "Score" and current score of the player. 
    
Fish-o-meter
Has 2 columns, on the first column, there are 3 fish from assets, small pink fish on the button, grey fish in th middle and big brown fish on top. They are indicators of the level, what a player can eat. On the right column, it is a column with a filling, that fills according to player current score and indicates how far the player if from next level, so he can eat bigger fish.   

Leaderboard
Shows all players and their rank, according their score. Player with highest score is displayed on the top of the list. 
Leaderboard also shows who is the leadplayer of the game (has ability to pause and stop and start the game). 
If some player has leht the game, then lederboard shows that the player quited. 
If a player leaves during an active game:
- their playable fish is removed from the game world
- they are excluded from winning
- their score remains visible in the leaderboard as quit

## Timer
Timer counts down to 0. At the beginning, the timer is set to 2 minutes. If timer counts to 0, then the game is over and the player with highest score, wins.
