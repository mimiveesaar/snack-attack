# Snack Attack

Snack Attack is a small multiplayer browser game, inspired by Feeding Frenzy, where you control a fish, eat smaller fish to grow, and compete for the top score before the timer ends.

## Tech Stack
- Client: TypeScript + Vite + Lit
- Server: Node.js + TypeScript + Socket.IO
- Build: Vite (client + server bundles)
- Docker

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm

### Install
```bash
pnpm install
```

### Development
Run the server and client in separate terminals:
```bash
pnpm dev:server
```
```bash
pnpm dev:client
```

Client: http://localhost:5173
Server: ws://localhost:3001 (Socket.IO)

### Production Build
```bash
pnpm build:client
pnpm build:server
```

### Production Preview
```bash
pnpm start:server
pnpm start:client
```

### Docker Preview
```bash
sudo docker build -t snack-attack .
```
```bash
sudo docker run snack-attack
```


## Configuration
Shared runtime configuration lives in src/shared/config.ts (client origin, game bounds, session settings, etc.). Server-specific settings are in src/server/config.ts.


## License
No license specified.


## Extra Features
The Lobby system which allows players to host private lobbies.

The game features 3 different power-ups:
- Speed Boost: the speed of the player increases for a period of 10 seconds.
- Double XP: every acquired XP is doubled during a 10 second period.
- Invincibility: the player cannot be eaten for a duration of 10 seconds.

The game can be played in Singleplayer mode.

Interactive NPCs.


## Virtual Opponents

Virtual opponents implement a customized version of [A* pathfinding](https://en.wikipedia.org/wiki/A*_search_algorithm) and a dynamic value function. Steering Behavior was tested as an alternative, but caused the bots to quickly lose track of the targets they were pursuing and act in very robotic way.

### Value Function

Bots assign a numeric value to all possible targets.  
**NPCs**: XP value.  
**Players**: current XP * multiplier (easy - 1.2, medium - 2, hard - 3), this causes bots to target players more often on higher difficutly.   
**Powerups**: static values.   

Score is calculated by 
```ts
const distanceFactor = 1 / (1 + distance);
return baseValue * distanceFactor;
```

This makes bots pefer lower value targets that are closer than higher value targets that are further away. 

Bots also take into account opponents grace-period and powerups.

### Targeting
Bots select the best target based on the calculated score.
Bots have a configurable time limit, how long they will try to chase the selected target. After failing to catch the opponent, they will switch to a new target and ignore the previous one for a confgiruable time. 

### Path Finding
Game world is divided into a grid with a configurable size. Each cell has a cost, grid cells that surround dangerous opponents have a very high cost and are generally avoided by the algorithm. Grid cells that would result in death are blocked. Algorithm iterates until the best possible path is found or maxIterations is reached.
Grid gets translated back into world coordinates.
Path gets recalculated on each tick due to the fast-paced and changing nature of the game.  
If there are no targets, the bot moves randomly.

 Bots also implement a immidiate threat function that causes them to flee from nearby enemies. Immidiate threat radius is configurable.

 ### Game Rules
 Virtual opponents follow the same rules as real players, they are able to gain powerups, have grace period, nickname, gain same XP from npcs and lose XP on death.

 ### Profiles
 
 ```ts 
 export const BOT_PROFILES: Record<'easy' | 'medium' | 'hard', VirtualOpponentProfile> = {
  easy: {
    difficulty: 'easy',
    reactionIntervalMs: 200, //Slower targeting makes the bot more stupid.
    targetSwitchIntervalMs: 3000,
    targetUpgradeCooldownMs: 400,
    directionChangeCooldownMs: 300,
    opponentTargetCooldownMs: 3000,
    panicBuffer: 5 //Distance from where the bot will go into flee mode.

  },
  medium: {
    difficulty: 'medium',
    reactionIntervalMs: 25,
    targetSwitchIntervalMs: 4500,
    targetUpgradeCooldownMs: 500,
    directionChangeCooldownMs: 350,
    opponentTargetCooldownMs: 2500,
    panicBuffer: 10 
  },
  hard: {
    difficulty: 'hard',
    reactionIntervalMs: 10,
    targetSwitchIntervalMs: 3000,
    targetUpgradeCooldownMs: 100,
    directionChangeCooldownMs: 250,
    opponentTargetCooldownMs: 2000,
    panicBuffer: 30 
  },
};

 
 ```