/**
 * Sound catalogue for the sleep app.
 *
 * All streaming audio is sourced from the Internet Archive (archive.org)
 * under Creative Commons / public domain licences — free to use.
 *
 * Each entry shape:
 *   id        – unique key (must match a soundList entry in i18n.js)
 *   category  – 'nature' | 'binaural' | 'music' | 'asmr'
 *   icon      – Ionicons name
 *   color     – accent colour for active state
 *   bg        – dark tint for the icon badge
 *   source    – require() for bundled assets OR { uri: '...' } for streaming
 *
 * ⚠️  Metro bundler requires require() paths to be STATIC string literals.
 *     Never compute them dynamically (e.g. require(`.../${id}.m4a`)).
 */

// ── Category metadata ─────────────────────────────────────────────────────────

export const CATEGORIES = [
  { id: 'nature',   icon: 'leaf-outline',         color: '#4CAF82' },
  { id: 'binaural', icon: 'radio-outline',         color: '#9B8FFF' },
  { id: 'music',    icon: 'musical-notes-outline', color: '#3ABEFF' },
  { id: 'asmr',     icon: 'mic-outline',           color: '#F6A623' },
];

// ── Sound entries ─────────────────────────────────────────────────────────────

export const SOUNDS = [

  // ── Nature ──────────────────────────────────────────────────────────────────

  {
    id: 'rain',
    category: 'nature',
    icon: 'rainy',
    color: '#7C74FF',
    bg: '#1C1A35',
    source: require('../../assets/sounds/rain.m4a'),
  },
  {
    id: 'ocean',
    category: 'nature',
    icon: 'water',
    color: '#3ABEFF',
    bg: '#0D1F2D',
    source: require('../../assets/sounds/ocean.m4a'),
  },
  {
    id: 'forest',
    category: 'nature',
    icon: 'leaf',
    color: '#4CAF82',
    bg: '#0D2019',
    source: require('../../assets/sounds/forest.m4a'),
  },
  {
    id: 'thunderstorm',
    category: 'nature',
    icon: 'thunderstorm-outline',
    color: '#7C74FF',
    bg: '#1C1A35',
    // Archive.org: rain-sounds-gentle-rain-thunderstorms (CC0)
    source: { uri: 'https://archive.org/download/rain-sounds-gentle-rain-thunderstorms/midnight-storm-in-suburban-environment-8944.mp3' },
  },
  {
    id: 'stream',
    category: 'nature',
    icon: 'water-outline',
    color: '#4CAF82',
    bg: '#0D2019',
    // Archive.org: rain-sounds-gentle-rain-thunderstorms (CC0)
    source: { uri: 'https://archive.org/download/rain-sounds-gentle-rain-thunderstorms/relaxing-mountains-rivers-streams-running-water-18178.mp3' },
  },
  {
    id: 'wind',
    category: 'nature',
    icon: 'cloud-outline',
    color: '#9897B8',
    bg: '#1E1C34',
    // Archive.org: rain-sounds-gentle-rain-thunderstorms (CC0)
    source: { uri: 'https://archive.org/download/rain-sounds-gentle-rain-thunderstorms/wind-and-rain-in-iceland_48khz_ms-6137.mp3' },
  },

  // ── Binaural Beats ───────────────────────────────────────────────────────────
  // Source: Loopool / Jean-Paul Garnier — CC BY (archive.org/details/BinauralBeats-AlphaBetaThetaDelta)
  // Pure stereo tones — use headphones for full binaural effect.

  {
    id: 'delta',
    category: 'binaural',
    icon: 'pulse',
    color: '#7C74FF',
    bg: '#1C1A35',
    source: { uri: 'https://archive.org/download/BinauralBeats-AlphaBetaThetaDelta/Loopool-StandingDeltaAt2Hz.mp3' },
  },
  {
    id: 'theta',
    category: 'binaural',
    icon: 'pulse',
    color: '#9B8FFF',
    bg: '#1A1830',
    source: { uri: 'https://archive.org/download/BinauralBeats-AlphaBetaThetaDelta/Loopool-StandingThetaAt5.5hz.mp3' },
  },
  {
    id: 'alpha',
    category: 'binaural',
    icon: 'pulse',
    color: '#3ABEFF',
    bg: '#0D1F2D',
    source: { uri: 'https://archive.org/download/BinauralBeats-AlphaBetaThetaDelta/Loopool-StandingAlphaAt10Hz.mp3' },
  },

  // ── Sleep Music ──────────────────────────────────────────────────────────────
  // Source: archive.org/details/RelaxingSleepMusic.DeltaWavesBinauralBeats… (CC0)

  {
    id: 'piano',
    category: 'music',
    icon: 'musical-note',
    color: '#3ABEFF',
    bg: '#0D1F2D',
    source: { uri: 'https://archive.org/download/RelaxingSleepMusic.DeltaWavesBinauralBeatsHealingForDeepSleepStressReliefMeditation/Relaxing%20Piano%20Music%20Relaxing%20Music%20Romantic%20Music%20Beautiful%20Music%20Soothing%20Sleep%20Music.mp3' },
  },
  {
    id: 'ambient',
    category: 'music',
    icon: 'musical-notes',
    color: '#7C74FF',
    bg: '#1C1A35',
    source: { uri: 'https://archive.org/download/RelaxingSleepMusic.DeltaWavesBinauralBeatsHealingForDeepSleepStressReliefMeditation/Daydream%20Ambient%20Mix.mp3' },
  },
  {
    id: 'lofi',
    category: 'music',
    icon: 'headset',
    color: '#F6A623',
    bg: '#2C1F06',
    source: { uri: 'https://archive.org/download/RelaxingSleepMusic.DeltaWavesBinauralBeatsHealingForDeepSleepStressReliefMeditation/30%20Minute%20Relaxing%20Sleep%20Music%20Calm%20Music%20Soft%20Music%20Instrumental%20Music%20Sleep%20Meditation.mp3' },
  },
  {
    id: 'harp',
    category: 'music',
    icon: 'musical-notes-outline',
    color: '#9B8FFF',
    bg: '#1A1830',
    // Note: filename has a double-space before "Instrumental" — encoded as %20%20
    source: { uri: 'https://archive.org/download/RelaxingSleepMusic.DeltaWavesBinauralBeatsHealingForDeepSleepStressReliefMeditation/Relaxing%20Harp%20Music%20Sleep%20Meditation%20Spa%20Study%20%20Instrumental%20Background%20Music.mp3' },
  },

  // ── ASMR / Noise ─────────────────────────────────────────────────────────────

  {
    id: 'whitenoise',
    category: 'asmr',
    icon: 'radio',
    color: '#9B8FFF',
    bg: '#1A1830',
    source: require('../../assets/sounds/whitenoise.m4a'),
  },
  {
    id: 'fan',
    category: 'asmr',
    icon: 'settings',
    color: '#9897B8',
    bg: '#1E1C34',
    source: require('../../assets/sounds/fan.m4a'),
  },
  {
    id: 'fire',
    category: 'asmr',
    icon: 'flame',
    color: '#F6A623',
    bg: '#2C1F06',
    source: require('../../assets/sounds/fire.m4a'),
  },
  {
    id: 'brownnoise',
    category: 'asmr',
    icon: 'radio-outline',
    color: '#F6A623',
    bg: '#2C1F06',
    // Archive.org: SleepSounds collection (CC0)
    source: { uri: 'https://archive.org/download/SleepSounds/Etc_Noise_Brown.mp3' },
  },
  {
    id: 'pinknoise',
    category: 'asmr',
    icon: 'radio-outline',
    color: '#4CAF82',
    bg: '#0D2019',
    // Archive.org: SleepSounds collection (CC0)
    source: { uri: 'https://archive.org/download/SleepSounds/Etc_Noise_Pink.mp3' },
  },
];
