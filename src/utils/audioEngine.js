import * as Tone from 'tone';

class GameAudioEngine {
  constructor() {
    if (GameAudioEngine.instance) {
      return GameAudioEngine.instance;
    }
    
    this.isInitialized = false;
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    this.touchStarted = false;
    this.musicEnabled = true;
    this.audioElements = new Map();
    
    // Initialize audio chain
    this.masterVolume = null;
    this.synth = null;
    this.bass = null;
    
    GameAudioEngine.instance = this;
    
    // Setup initialization based on device
    if (this.isIOS) {
      this.setupIOSAudio();
    } else if (this.isMobile) {
      this.setupMobileInit();
    } else {
      this.init();
    }
  }

  async setupIOSAudio() {
    console.log('🍎 iOS detected - setting up specialized audio initialization');
    
    // Create simple HTML5 audio elements for iOS compatibility
    this.createAudioElements();
    
    // Multiple event listeners for iOS
    const events = ['touchstart', 'touchend', 'click', 'keydown'];
    const initHandler = async (e) => {
      if (!this.touchStarted) {
        console.log('🎵 iOS audio initialization triggered by:', e.type);
        this.touchStarted = true;
        
        // Remove all event listeners after first trigger
        events.forEach(event => {
          document.removeEventListener(event, initHandler, { passive: true });
        });
        
        await this.initializeIOSAudio();
      }
    };
    
    events.forEach(event => {
      document.addEventListener(event, initHandler, { passive: true });
    });
  }

  createAudioElements() {
    // Create HTML5 audio elements as fallback for iOS
    const soundEffects = {
      flip: this.createTone(800, 0.1),
      match: this.createTone(1200, 0.2), 
      miss: this.createTone(400, 0.3),
      complete: this.createTone(1600, 0.5),
      achievement: this.createTone(2000, 0.4)
    };
    
    Object.entries(soundEffects).forEach(([key, audioData]) => {
      const audio = new Audio();
      audio.src = audioData;
      audio.preload = 'auto';
      audio.volume = 0.3;
      this.audioElements.set(key, audio);
    });
  }

  createTone(frequency, duration) {
    // Create a simple tone using Web Audio API data URI
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(samples * 2);
    const view = new DataView(buffer);
    
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin((frequency * 2 * Math.PI * i) / sampleRate) * 0.3;
      const intSample = Math.max(-32767, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(i * 2, intSample, true);
    }
    
    // Convert to WAV format data URI
    return this.bufferToWav(buffer, sampleRate);
  }

  bufferToWav(buffer, sampleRate) {
    const length = buffer.byteLength;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Copy audio data
    const audioData = new Uint8Array(buffer);
    const wavData = new Uint8Array(arrayBuffer, 44);
    wavData.set(audioData);
    
    // Convert to base64 data URI
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  async initializeIOSAudio() {
    try {
      console.log('🎵 Initializing iOS-optimized audio...');
      
      // Try to resume audio context first
      if (Tone.getContext().state === 'suspended') {
        await Tone.start();
        console.log('🎵 iOS Audio context resumed');
      }
      
      // Initialize simple Tone.js setup
      this.masterVolume = new Tone.Volume(-6).toDestination();
      this.synth = new Tone.PolySynth(Tone.Synth).connect(this.masterVolume);
      this.bass = new Tone.MonoSynth().connect(this.masterVolume);
      
      this.isInitialized = true;
      console.log('✅ iOS audio engine initialized successfully');
      
    } catch (error) {
      console.warn('⚠️ iOS audio initialization failed, using HTML5 audio:', error);
      this.isInitialized = true; // Mark as initialized to use fallback audio
    }
  }

  setupMobileInit() {
    console.log('📱 Mobile detected - setting up audio initialization');
    
    const events = ['touchstart', 'click'];
    const initHandler = async (e) => {
      if (!this.touchStarted) {
        console.log('🎵 Mobile audio initialization triggered by:', e.type);
        this.touchStarted = true;
        
        events.forEach(event => {
          document.removeEventListener(event, initHandler);
        });
        
        await this.init();
      }
    };
    
    events.forEach(event => {
      document.addEventListener(event, initHandler, { passive: true });
    });
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      console.log('🎵 Initializing GameAudioEngine...');
      
      // Start Tone.js context
      if (Tone.getContext().state === 'suspended') {
        await Tone.start();
        console.log('🎵 Audio context resumed');
      }
      
      // Initialize audio chain
      this.masterVolume = new Tone.Volume(-6).toDestination();
      this.synth = new Tone.PolySynth(Tone.Synth).connect(this.masterVolume);
      this.bass = new Tone.MonoSynth().connect(this.masterVolume);
      
      this.isInitialized = true;
      console.log('✅ GameAudioEngine initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize GameAudioEngine:', error);
      this.isInitialized = false;
    }
  }

  // iOS-compatible audio playback methods
  async playSound(type, options = {}) {
    if (!this.musicEnabled) return;
    
    try {
      // Prefer HTML5 audio for iOS reliability
      if (this.isIOS && this.audioElements.has(type)) {
        const audio = this.audioElements.get(type);
        audio.currentTime = 0;
        audio.volume = options.volume || 0.3;
        await audio.play().catch(e => console.warn('HTML5 audio play failed:', e));
        return;
      }
      
      // Fallback to Tone.js for other devices
      if (!this.isInitialized || !this.synth) {
        console.warn('Audio not initialized, skipping sound:', type);
        return;
      }
      
      const now = Tone.now();
      
      switch (type) {
        case 'flip':
          this.synth.triggerAttackRelease('C5', '16n', now);
          break;
        case 'match':
          this.synth.triggerAttackRelease(['C5', 'E5', 'G5'], '8n', now);
          break;
        case 'miss':
          this.bass.triggerAttackRelease('C3', '4n', now);
          break;
        case 'complete':
          this.synth.triggerAttackRelease(['C5', 'E5', 'G5', 'C6'], '2n', now);
          break;
        case 'achievement':
          this.synth.triggerAttackRelease(['F5', 'A5', 'C6'], '4n', now);
          break;
        default:
          console.warn('Unknown sound type:', type);
      }
      
    } catch (error) {
      console.warn('Failed to play sound:', type, error);
    }
  }

  // Game event handlers
  onCardFlip() {
    this.playSound('flip');
  }

  onCardMatch() {
    this.playSound('match');
  }

  onCardMiss() {
    this.playSound('miss');
  }

  onGameComplete() {
    this.playSound('complete');
  }

  onAchievementUnlocked() {
    this.playSound('achievement');
  }

  // Utility methods
  setMusicEnabled(enabled) {
    this.musicEnabled = enabled;
  }

  cleanup() {
    // Dispose of Tone.js objects
    if (this.synth) this.synth.dispose();
    if (this.bass) this.bass.dispose();
    if (this.masterVolume) this.masterVolume.dispose();
    
    // Clean up HTML5 audio elements
    this.audioElements.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioElements.clear();
    
    this.isInitialized = false;
  }
}

// Singleton instance
GameAudioEngine.instance = null;

// Export function to get the singleton instance
export const getAudioEngine = () => {
  return new GameAudioEngine();
};

export default GameAudioEngine;