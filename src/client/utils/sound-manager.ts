/**
 * Sound Manager - Manages background music and sound effects
 * Uses Web Audio API for sound effects and HTML5 Audio for background music
 */

export class SoundManager {
  private static instance: SoundManager;
  private soundEnabled: boolean = true;
  private backgroundMusic: HTMLAudioElement | null = null;
  private backgroundMusicOscillators: OscillatorNode[] = [];
  private gainNodes: GainNode[] = [];
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private crunchBuffer: AudioBuffer | null = null;
  private crunchLoadPromise: Promise<void> | null = null;
  private crunchSources: AudioBufferSourceNode[] = [];
  private readonly crunchUrl = new URL('@client/assets/sound/sfx/small-crunch.mp3', import.meta.url).href;
  private crunchResumePromise: Promise<void> | null = null;
  private crunchDebugStats = {
    attempts: 0,
    skippedSoundDisabled: 0,
    skippedNoContext: 0,
    queuedLoad: 0,
    skippedNoBuffer: 0,
    resumedContext: 0,
    started: 0,
  };

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

      void this.loadCrunchBuffer();

      console.log('SoundManager: AudioContext initialized');

      if (this.soundEnabled) {
        this.startBackgroundMusic();
      }
    } catch (e) {
      console.error('SoundManager: Failed to initialize AudioContext', e);
    }
  }

  /**
   * Load crunch sound buffer
   */
  private async loadCrunchBuffer(): Promise<void> {
    if (!this.audioContext || this.crunchBuffer) return;
    if (this.crunchLoadPromise) {
      await this.crunchLoadPromise;
      return;
    }
    try {
      this.crunchLoadPromise = (async () => {
        const response = await fetch(this.crunchUrl);
        if (!response.ok) {
          console.warn('[SoundManager] Crunch fetch failed', response.status);
          return;
        }
        const arrayBuffer = await response.arrayBuffer();
        this.crunchBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        console.log('[SoundManager] Crunch buffer loaded');
      })();
      await this.crunchLoadPromise;
    } catch {
      this.crunchBuffer = null;
      console.warn('[SoundManager] Crunch buffer load failed');
    } finally {
      this.crunchLoadPromise = null;
    }
  }

  /**
   * Start background music - plays MeltdownTheme.wav
   */
  private startBackgroundMusic(): void {
    if (this.backgroundMusic) {
      // Resume if already loaded
      this.backgroundMusic.play().catch((error) => {
        console.warn('SoundManager: Failed to play background music', error);
      });
      return;
    }

    // Create and initialize background music audio element
    this.backgroundMusic = new Audio(new URL('@client/assets/sound/soundtrack/MeltdownTheme.wav', import.meta.url).href);
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = 0.3;

    this.backgroundMusic.play().catch((error) => {
      console.warn('SoundManager: Failed to play background music', error);
    });
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
    if (!this.soundEnabled || !this.audioContext || !this.masterGain) {
      console.warn('[SoundManager] Cannot play sound:', {
        soundType,
        soundEnabled: this.soundEnabled,
        hasAudioContext: !!this.audioContext,
        hasMasterGain: !!this.masterGain,
      });
      return;
    }

    // Resume audio context if suspended (required by browsers for autoplay)
    if (this.audioContext.state === 'suspended') {
      console.log('[SoundManager] AudioContext suspended, resuming...');
      this.audioContext.resume().then(() => {
        console.log('[SoundManager] AudioContext resumed');
      });
    }

    let frequency = 440;
    let duration = 0.1;
    let volume = 0.15; // Default volume

    switch (soundType) {
      case 'eat':
        frequency = 523; // C5
        duration = 0.08;
        volume = 0.15;
        break;
      case 'powerup':
        frequency = 659; // E5
        duration = 0.15;
        volume = 0.5; // Louder so it cuts through background music
        break;
      case 'respawn':
        frequency = 784; // G5
        duration = 0.2;
        volume = 0.15;
        break;
      case 'game-over':
        frequency = 330; // E4
        duration = 0.3;
        volume = 0.15;
        break;
      case 'fish-select':
        frequency = 587; // D5
        duration = 0.1;
        volume = 0.15;
        break;
    }

    console.log(`[SoundManager] Playing ${soundType} sound at ${frequency}Hz with volume ${volume}, context state: ${this.audioContext.state}`);

    // Create oscillator and gain for this sound
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.frequency.value = frequency;
    osc.type = 'sine';
    
    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
    
    console.log(`[SoundManager] Sound scheduled: ${soundType} will stop at ${now + duration}`);
  }

  /**
   * Toggle sound on/off
   */
  toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('snack-attack-sound-enabled', JSON.stringify(this.soundEnabled));

    if (this.soundEnabled) {
      if (this.masterGain) {
        this.masterGain.gain.value = 0.3;
      }
      this.startBackgroundMusic();
    } else {
      if (this.masterGain) {
        this.masterGain.gain.value = 0;
      }
      if (this.backgroundMusic) {
        this.backgroundMusic.pause();
      }
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
    this.playCrunchSound();
  }

  /**
   * Play crunch sound when fish is eaten
   */
  playCrunchSound(): void {
    this.crunchDebugStats.attempts += 1;
    if (!this.soundEnabled || !this.audioContext || !this.masterGain) {
      console.debug('[SoundManager] Crunch skipped: sound/context missing', {
        soundEnabled: this.soundEnabled,
        hasAudioContext: !!this.audioContext,
        hasMasterGain: !!this.masterGain,
        stats: { ...this.crunchDebugStats },
      });
      return;
    }
    if (!this.crunchBuffer) {
      this.crunchDebugStats.queuedLoad += 1;
      this.loadCrunchBuffer()
        .then(() => {
          if (!this.crunchBuffer) return;
          this.playCrunchSound();
        })
        .catch(() => {});
      if (!this.audioContext || !this.masterGain) {
        this.crunchDebugStats.skippedNoContext += 1;
      } else if (!this.soundEnabled) {
        this.crunchDebugStats.skippedSoundDisabled += 1;
      } else {
        this.crunchDebugStats.skippedNoBuffer += 1;
      }
      console.debug('[SoundManager] Crunch queued (no buffer yet)', { ...this.crunchDebugStats });
      return;
    }
    if (this.audioContext.state === 'suspended') {
      if (!this.crunchResumePromise) {
        this.crunchResumePromise = this.audioContext.resume()
          .then(() => {
            this.crunchDebugStats.resumedContext += 1;
          })
          .catch(() => {})
          .finally(() => {
            this.crunchResumePromise = null;
          });
      }
      this.crunchResumePromise.then(() => this.playCrunchSound()).catch(() => {});
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.crunchBuffer;

    const gain = this.audioContext.createGain();
    gain.gain.value = 0.35;

    source.connect(gain);
    gain.connect(this.masterGain);

    this.crunchSources.push(source);
    source.addEventListener('ended', () => {
      this.crunchSources = this.crunchSources.filter((active) => active !== source);
      source.disconnect();
      gain.disconnect();
    });

    source.start();
    this.crunchDebugStats.started += 1;
    console.debug('[SoundManager] Crunch started', {
      state: this.audioContext.state,
      stats: { ...this.crunchDebugStats },
    });
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
