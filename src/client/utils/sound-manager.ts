/**
 * Sound Manager - Manages background music and sound effects
 * Uses Web Audio API for sound generation
 */

import { Howl } from 'howler';

export class SoundManager {
  private static instance: SoundManager;
  private soundEnabled: boolean = true;
  private backgroundMusicOscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  private constructor() {
    // Load persistent sound preference
    const saved = localStorage.getItem('snack-attack-sound-enabled');
    this.soundEnabled = saved !== null ? JSON.parse(saved) : true;
  }

  static getInstance(): SoundManager {
    if (!SoundManager.instance) {
      SoundManager.instance = new SoundManager();
    }
    return SoundManager.instance;
  }

  /**
   * Initialize audio context and sounds
   */
  initialize(): void {
    try {
      // Initialize AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.soundEnabled ? 0.3 : 0;

      console.log('SoundManager: AudioContext initialized');

      if (this.soundEnabled) {
        this.startBackgroundMusic();
      }
    } catch (e) {
      console.error('SoundManager: Failed to initialize AudioContext', e);
    }
  }

  /**
   * Start background music - underwater adventure theme
   */
  private startBackgroundMusic(): void {
    if (!this.audioContext || !this.masterGain) return;

    // Playful underwater melody pattern
    const notes = [
      // First phrase - ascending, playful
      { freq: 523, duration: 0.3 },  // C5
      { freq: 587, duration: 0.3 },  // D5
      { freq: 659, duration: 0.3 },  // E5
      { freq: 783, duration: 0.3 },  // G5
      // Second phrase - descending with variation
      { freq: 783, duration: 0.2 },  // G5
      { freq: 659, duration: 0.2 },  // E5
      { freq: 587, duration: 0.2 },  // D5
      { freq: 523, duration: 0.4 },  // C5
      // Third phrase - bouncy high notes
      { freq: 880, duration: 0.2 },  // A5
      { freq: 783, duration: 0.2 },  // G5
      { freq: 659, duration: 0.2 },  // E5
      { freq: 587, duration: 0.4 },  // D5
      // Fourth phrase - return home
      { freq: 659, duration: 0.25 }, // E5
      { freq: 659, duration: 0.25 }, // E5 (held)
      { freq: 587, duration: 0.25 }, // D5
      { freq: 523, duration: 0.5 },  // C5 (longer)
    ];

    const playPattern = () => {
      let currentTime = this.audioContext!.currentTime;
      for (const note of notes) {
        this.playOscillatorNote(note.freq, currentTime, note.duration);
        currentTime += note.duration;
      }
      // Reschedule for next pattern
      const patternDuration = notes.reduce((sum, n) => sum + n.duration, 0);
      if (this.soundEnabled) {
        setTimeout(() => playPattern(), (patternDuration + 0.2) * 1000);
      }
    };

    // Start the first pattern
    playPattern();
  }

  /**
   * Play a note using oscillator
   */
  private playOscillatorNote(frequency: number, startTime: number, duration: number): void {
    if (!this.audioContext || !this.masterGain) return;

    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.1, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Play a sound effect
   */
  playSound(soundType: string): void {
    if (!this.soundEnabled || !this.audioContext || !this.masterGain) return;

    let frequency = 440;
    let duration = 0.1;

    switch (soundType) {
      case 'eat':
        frequency = 523; // C5
        duration = 0.08;
        break;
      case 'powerup':
        frequency = 659; // E5
        duration = 0.15;
        break;
      case 'respawn':
        frequency = 784; // G5
        duration = 0.2;
        break;
      case 'game-over':
        frequency = 330; // E4
        duration = 0.3;
        break;
      case 'fish-select':
        frequency = 587; // D5
        duration = 0.1;
        break;
    }

    // Create oscillator and gain for this sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.frequency.value = frequency;
    osc.type = 'sine';
    
    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Toggle sound on/off
   */
  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('snack-attack-sound-enabled', JSON.stringify(this.soundEnabled));

    if (!this.audioContext || !this.masterGain) return this.soundEnabled;

    if (this.soundEnabled) {
      this.masterGain.gain.value = 0.3;
      this.startBackgroundMusic();
    } else {
      this.masterGain.gain.value = 0;
      // Stop all oscillators
      this.backgroundMusicOscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch (e) {
          // Already stopped
        }
      });
      this.backgroundMusicOscillators = [];
    }

    return this.soundEnabled;
  }

  /**
   * Check if sound is enabled
   */
  isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Stop background music
   */
  stopMusic(): void {
    if (!this.audioContext || !this.masterGain) return;
    this.masterGain.gain.value = 0;
  }

  /**
   * Resume background music
   */
  resumeMusic(): void {
    if (!this.audioContext || !this.masterGain) return;
    if (this.soundEnabled) {
      this.masterGain.gain.value = 0.3;
      this.startBackgroundMusic();
    }
  }

  /**
   * Play sound when fish is eaten
   */
  playEatSound(): void {
    this.playSound('eat');
  }

  /**
   * Play sound when powerup is collected
   */
  playPowerupSound(): void {
    this.playSound('powerup');
  }

  /**
   * Play sound when player respawns
   */
  playRespawnSound(): void {
    this.playSound('respawn');
  }

  /**
   * Play sound when game ends
   */
  playGameOverSound(): void {
    this.playSound('game-over');
  }

  /**
   * Play sound when fish is selected
   */
  playFishSelectSound(): void {
    this.playSound('fish-select');
  }
}

// Export singleton instance
export const soundManager = SoundManager.getInstance();
