# Health Tracker Mobile App v3.0

A comprehensive health tracking mobile application built with React, TypeScript, and Capacitor. Track your daily wellness journey, discover patterns between food intake and symptoms, and gain insights into your health.

## Features

### Core Tracking (9 Categories)
- **Food Logging**: Track meals with ingredients, portions, and notes. Recipe book for saving favorite meals. Full CRUD support
- **Water Intake**: Monitor daily hydration with custom amounts and goal tracking. Manual entry with time selection
- **Exercise Tracking**: Log workouts with duration and intensity. Separate step counter for daily steps
- **Bowel Movements**: Track digestive health with Bristol Stool Scale (Types 1-8 including "Other"). Full edit capabilities
- **Symptoms**: Record health symptoms with severity levels. Separate wellness feelings tracker (overall, morning, afternoon, evening moods)
- **Medications**: Persistent medication list + daily dose logging. Medications persist day-to-day
- **Weight Tracking**: Monitor weight with body composition metrics (BMI, body fat, water %, muscle mass, bone mass). 30-day trend visualization
- **Sleep Tracking**: Comprehensive sleep monitoring with bed/wake times, quality ratings (1-5), mood tracking, and advanced metrics (snoring, dreams, interruptions, naps). NEW in v3.0
- **Insights**: AI-powered correlation analysis and health pattern visualization

### V3.0 Updates
- **Sleep Tracker**: Complete sleep monitoring with quality ratings, mood tracking, duration calculation, and advanced metrics
- **Recipe Book**: Save and manage favorite recipes independently from food entries
- **Step Counter**: Separate daily step tracking alongside exercise entries
- **Wellness Feelings**: Track overall and time-of-day wellness feelings separate from symptoms
- **Bristol Type 8**: Added "Other" option for bowel entries that don't fit standard types
- **Database v3**: Upgraded schema with recipes, stepEntries, wellnessFeelings, sleepEntries, medicationLogs tables
- **Enhanced CSV Export**: Unified CSV now includes all 9 categories (Food, Water, Exercise, Steps, Bowel, Symptoms, Wellness, Medicine, Weight, Sleep)
- **Optimized UI**: 9-tab horizontal icon menu with reduced icon size for better fit

### Advanced Analytics
- **Pattern Recognition**: AI-powered correlation analysis between food intake and symptoms
- **Time-Window Analysis**: Configurable time windows (2-24 hours) to identify trigger foods
- **Visual Insights**: Interactive timeline charts and correlation visualizations
- **Statistics Dashboard**: Track symptom-free days, common triggers, and health trends

### Data Management
- **Export Options**:
  - Complete JSON backup (v3.0 format with all 9 categories including recipes, steps, wellness, sleep)
  - Unified CSV export (all 9 categories chronologically sorted in single file)
  - PDF insights reports
- **Import Functionality**: Restore data from JSON backups (backward compatible with v2.0)
- **Offline-First**: All data stored locally using IndexedDB (Dexie.js)
- **Native Sharing**: Android share dialog integration
- **Database Versioning**: Automatic migration from v1 → v2 → v3 schema
- **Dual-Table Systems**: Medications list persists day-to-day, separate from daily medication logs. Recipes persist independently from food entries

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
