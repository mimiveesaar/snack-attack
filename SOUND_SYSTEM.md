# Sound System Implementation

## Overview
Added a comprehensive sound system to Snack Attack using **Howler.js**, a free and lightweight audio library.

## Installed Dependencies
- **howler** (v2.2.4) - Free audio library for playing sounds

## Components Created

### 1. Sound Manager (`src/client/utils/sound-manager.ts`)
Singleton service that manages all audio playback with these features:
- **Initialize sounds** on app startup
- **Toggle sound on/off** with persistent localStorage preference
- **Play different sound effects** for game events
- **Control background music** playback

**Sound effects included:**
- 🐟 **eat** - When a player eats a fish (collision)
- 🦴 **crunch** - Plays `small-crunch.mp3` when any fish is eaten
- ⚡ **powerup** - When a player collects a powerup
- 🔄 **respawn** - When a player respawns
- ❌ **game-over** - When the game ends
- ✓ **fish-select** - When player selects a fish in lobby

### 2. Sound Toggle Component (`src/client/components/sound-toggle.ts`)
UI button component with:
- Speaker icon (🔊/🔇) that toggles with sound state
- Tooltip showing current state
- Positioned in top-right corner
- Persistent preference saved to localStorage

## Integration Points

### 1. **Fish Selection** (lobby-entry.ts)
- Plays `fish-select` sound when player clicks a fish
- Provides audio feedback during lobby setup

### 2. **Game Events** (game-manager.ts)
- **Fish eaten collisions**: Plays crunch sound (`small-crunch.mp3`)
- **Powerup collection**: Plays `powerup` sound
- **Player respawns**: Plays `respawn` sound
- Triggered by `game:state-update` events from server

### 3. **App Initialization** (app-root.ts)
- Sound manager initialized on app startup
- Sound toggle button available on all screens

## File Changes

### Modified Files:
1. **package.json** - Added howler dependency
2. **src/client/components/lobby-entry.ts** - Added fish select sound
3. **src/client/components/app-root.ts** - Added sound toggle button and manager initialization
4. **src/client/game/game-manager.ts** - Added event-driven sound playback

### New Files:
1. **src/client/utils/sound-manager.ts** - Sound manager service
2. **src/client/components/sound-toggle.ts** - Sound toggle button component

## How to Add Custom Sounds

To add your own audio files:

1. **Add audio files** to `public/sounds/` directory (MP3, WAV, OGG formats)
2. **Update sound-manager.ts** in the `createSound()` method:
```typescript
this.sounds.set('my-sound', this.createSound('my-sound', 'path/to/sound.mp3'));
```
3. **Call from your code**:
```typescript
soundManager.playSound('my-sound');
```

## Features
✅ Sound toggle on/off button  
✅ Persistent sound preference  
✅ Event-driven sound effects  
✅ Background music support  
✅ Free and open-source (Howler.js)  
✅ Responsive UI with tooltips  
✅ Light DOM support for component styling  

## Current Limitations
- Currently uses silent placeholder sounds (Web Audio API fallback)
- To enable real audio, add MP3/OGG files to `public/sounds/` directory
- Howler.js will automatically use Web Audio API or HTML5 Audio fallback based on browser support
