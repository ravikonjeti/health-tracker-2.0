# Health Tracker Mobile App

A comprehensive health tracking mobile application built with React, TypeScript, and Capacitor. Track your daily wellness journey, discover patterns between food intake and symptoms, and gain insights into your health.

## Features

### Core Tracking
- **Food Logging**: Track meals with ingredients, portions, and notes
- **Water Intake**: Monitor daily hydration levels
- **Exercise Tracking**: Log workouts with duration and intensity
- **Bowel Movements**: Track digestive health patterns
- **Symptoms**: Record health symptoms with severity levels

### Advanced Analytics
- **Pattern Recognition**: AI-powered correlation analysis between food intake and symptoms
- **Time-Window Analysis**: Configurable time windows (2-24 hours) to identify trigger foods
- **Visual Insights**: Interactive timeline charts and correlation visualizations
- **Statistics Dashboard**: Track symptom-free days, common triggers, and health trends

### Data Management
- **Export Options**:
  - Complete JSON backup
  - CSV exports for each data type
  - PDF insights reports
- **Import Functionality**: Restore data from JSON backups
- **Offline-First**: All data stored locally using IndexedDB
- **Native Sharing**: Android share dialog integration

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: IndexedDB with Dexie.js
- **Mobile**: Capacitor (Android)
- **Charts**: Recharts
- **PDF Generation**: jsPDF
- **PWA**: Progressive Web App with service workers

## Installation

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`

### Build for Production

1. Build the web app: `npm run build`
2. Sync with Android: `npx cap sync android`
3. Build Android APK: `cd android && ./gradlew assembleDebug`

The APK will be available at: `android/app/build/outputs/apk/debug/app-debug.apk`

## License

MIT
