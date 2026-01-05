# Health Tracker Mobile App v2.0

A comprehensive health tracking mobile application built with React, TypeScript, and Capacitor. Track your daily wellness journey, discover patterns between food intake and symptoms, and gain insights into your health.

## Features

### Core Tracking (8 Categories)
- **Food Logging**: Track meals with ingredients, portions, and notes. Edit any entry with full CRUD support
- **Water Intake**: Monitor daily hydration levels with customizable amounts. Edit entries anytime
- **Exercise Tracking**: Log workouts with duration and intensity. Modify past entries as needed
- **Bowel Movements**: Track digestive health patterns with Bristol Stool Scale. Full edit capabilities
- **Symptoms**: Record health symptoms with severity levels. Update or delete symptoms
- **Medications**: Manage medication list and log doses with timestamps. NEW in v2.0
- **Weight Tracking**: Monitor weight trends with body composition metrics (BMI, body fat, water %, muscle mass, bone mass). NEW in v2.0
- **Insights**: AI-powered correlation analysis and health pattern visualization

### V2.0 Updates
- **Edit Functionality**: All 7 tracking categories now support full CRUD operations (Create, Read, Update, Delete)
- **Medication Tracker**: Maintain a medication list and log doses with customizable dosages and notes
- **Weight Tracker**: Track weight with comprehensive body metrics, circular SVG visualizations, and trend indicators
- **Unified CSV Export**: Single chronological CSV file containing all 8 categories for comprehensive health logs
- **Enhanced UI**: Optimized horizontal icon menu with 8 tabs, improved padding, and better mobile experience

### Advanced Analytics
- **Pattern Recognition**: AI-powered correlation analysis between food intake and symptoms
- **Time-Window Analysis**: Configurable time windows (2-24 hours) to identify trigger foods
- **Visual Insights**: Interactive timeline charts and correlation visualizations
- **Statistics Dashboard**: Track symptom-free days, common triggers, and health trends

### Data Management
- **Export Options**:
  - Complete JSON backup (v2.0 format with medications and weight data)
  - Unified CSV export (all categories chronologically sorted)
  - PDF insights reports
- **Import Functionality**: Restore data from JSON backups
- **Offline-First**: All data stored locally using IndexedDB (Dexie.js)
- **Native Sharing**: Android share dialog integration
- **Database Versioning**: Automatic migration from v1 to v2 schema

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
