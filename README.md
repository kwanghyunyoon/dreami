# Dreami

A sleep tracking app built with React Native and Expo. Track your sleep sessions, layer ambient sounds, set sleep goals, and build consistent bedtime habits.

**Live PWA:** https://dreamiapp1.netlify.app
**Privacy Policy:** https://dreamiapp1.netlify.app/privacy

---

## Features

- **Sleep sessions** — start and end sleep with a single tap; duration is recorded automatically
- **Wake quality rating** — 5-star modal fires after ending a session to log how you felt
- **Sleep streaks** — consecutive nights tracked with streak display on the home screen
- **Layered sounds** — two simultaneous ambient audio slots (rain, white noise, etc.) with a badge indicator when a layer is active
- **Sleep goal** — set a nightly target (5–10 h) in Settings; a progress bar and goal-aware charts reflect your goal
- **Gentle alarm** — gradual volume ramp over 3, 5, or 10 minutes via expo-av
- **Monthly log calendar** — color-coded day bubbles with previous/next month navigation
- **Onboarding** — 5-step flow (Welcome → Language → Feature tour → Privacy → Get Started) with a "Report an issue" link on every step
- **In-app feedback** — bottom-sheet form (type + description) posted to a Cloudflare Worker proxy, forwarded to Discord
- **Internationalization** — English, Korean, Spanish, Hindi

## Tech Stack

| Layer | Library |
|---|---|
| Framework | Expo 54 (React Native, JavaScript) |
| Navigation | React Navigation — bottom tabs |
| Audio | expo-av |
| Notifications | expo-notifications |
| Secure storage | expo-secure-store |
| Persistent storage | AsyncStorage |
| Feedback proxy | Cloudflare Worker (https://app-feedback.yoonk478.workers.dev) |

## Getting Started

```bash
npm install
npx expo start
```

Open in:
- iOS Simulator
- Android Emulator
- Expo Go (scan QR code)
- Browser (PWA via `npx expo start --web`)

## Project Structure

```
src/
  components/       # Reusable UI (ErrorBoundary, GentleAlarmModal, SecurityModal, …)
  screens/          # HomeScreen, LogScreen, SoundsScreen, SettingsScreen
  hooks/            # useAudioPlayer.js
  i18n.js           # All translations (en / ko / es / hi)
assets/             # Icons, splash, sounds
public/
  privacy.html      # Privacy policy
```

## Contact

clarityincalm@icloud.com
