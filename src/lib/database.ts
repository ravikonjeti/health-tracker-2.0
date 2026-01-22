import Dexie, { Table } from 'dexie';

// Type definitions
export interface FoodEntry {
  id?: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  description: string;
  time: string; // HH:MM format
  portion?: string;
  ingredients: string[];
  notes?: string;
  date: string; // YYYY-MM-DD format
}

export interface WaterEntry {
  id?: string;
  amount: number; // Always stored in ml
  time: string;
  date: string;
}

export interface ExerciseEntry {
  id?: string;
  type: 'cardio' | 'yoga' | 'strength';
  name: string;
  duration: number; // minutes
  intensity: 'low' | 'moderate' | 'high';
  notes?: string;
  time: string;
  date: string;
}

export interface BowelEntry {
  id?: string;
  type: number; // 1-8 Bristol Stool Scale (8 = Other)
  time: string;
  notes?: string;
  date: string;
}

export interface SymptomEntry {
  id?: string;
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe';
  time: string;
  description: string;
  triggers?: string;
  date: string;
}

// Recipe storage (independent from food entries)
export interface RecipeIngredient {
  name: string;
  quantity: string;
}

export interface Recipe {
  id?: string;
  name: string;
  ingredients: RecipeIngredient[];
  notes?: string;
}

// Step tracking (separate from exercise)
export interface StepEntry {
  id?: string;
  date: string;
  steps: number;
}

// Wellness feelings (separate from symptoms)
export interface WellnessFeelings {
  id?: string;
  date: string;
  overall?: 'happy' | 'neutral' | 'sad' | 'very-sad';
  morning?: 'happy' | 'neutral' | 'sad' | 'very-sad';
  afternoon?: 'happy' | 'neutral' | 'sad' | 'very-sad';
  evening?: 'happy' | 'neutral' | 'sad' | 'very-sad';
}

// Medication list (persistent, not tied to dates)
export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  notes?: string;
}

// Medication logs (daily tracking)
export interface MedicationLog {
  id?: string;
  medicationId: string;
  medicationName: string;
  dosage: string;
  time: string;
  date: string;
  notes?: string;
}

export interface WeightEntry {
  id?: string;
  weight: number;
  unit: 'kg' | 'lb';
  time: string;
  date: string;
  notes?: string;
  bodyFat?: number;
  water?: number;
  muscleMass?: number;
  boneMass?: number;
  bmi?: number;
}

// Sleep tracking
export interface SleepEntry {
  id?: string;
  date: string; // date you went to bed
  bedTime: string;
  wakeTime: string;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  mood: 'energized' | 'good' | 'ok' | 'tired' | 'exhausted';
  notes: string;
  snoring?: boolean;
  dreams?: string;
  interruptions?: number;
  napDuration?: number; // minutes
}

export interface UserSettings {
  id?: string;
  dailyWaterGoal: number; // ml
  weightUnit?: 'kg' | 'lb';
  [key: string]: any;
}

// Database class
export class HealthDatabase extends Dexie {
  // Core tracking tables
  foodEntries!: Table<FoodEntry, string>;
  waterEntries!: Table<WaterEntry, string>;
  exerciseEntries!: Table<ExerciseEntry, string>;
  bowelEntries!: Table<BowelEntry, string>;
  symptomEntries!: Table<SymptomEntry, string>;
  weightEntries!: Table<WeightEntry, string>;
  sleepEntries!: Table<SleepEntry, string>;

  // Independent storage tables
  recipes!: Table<Recipe, string>;
  stepEntries!: Table<StepEntry, string>;
  wellnessFeelings!: Table<WellnessFeelings, string>;
  medications!: Table<Medication, string>; // PERSISTENT medication list
  medicationLogs!: Table<MedicationLog, string>; // Daily medication logs

  settings!: Table<UserSettings, string>;

  constructor() {
    super('HealthTrackerDB');

    this.version(1).stores({
      foodEntries: '++id, date, time, type, *ingredients',
      waterEntries: '++id, date, time',
      exerciseEntries: '++id, date, time, type',
      bowelEntries: '++id, date, time',
      symptomEntries: '++id, date, time, symptom',
      settings: '++id'
    });

    // Version 2: Add medicine and weight tracking
    this.version(2).stores({
      foodEntries: '++id, date, time, type, *ingredients',
      waterEntries: '++id, date, time',
      exerciseEntries: '++id, date, time, type',
      bowelEntries: '++id, date, time',
      symptomEntries: '++id, date, time, symptom',
      medications: '++id, name',
      medicineEntries: '++id, date, time, medicationId',
      weightEntries: '++id, date, time',
      settings: '++id'
    });

    // Version 3: Add recipes, steps, wellness, sleep tracking
    this.version(3).stores({
      foodEntries: '++id, date, time, type, *ingredients',
      waterEntries: '++id, date, time',
      exerciseEntries: '++id, date, time, type',
      bowelEntries: '++id, date, time',
      symptomEntries: '++id, date, time, symptom',
      medications: '++id, name',
      medicationLogs: '++id, date, time, medicationId',
      weightEntries: '++id, date, time',
      sleepEntries: '++id, date',
      recipes: '++id, name',
      stepEntries: '++id, date',
      wellnessFeelings: '++id, date',
      settings: '++id'
    }).upgrade(tx => {
      // Migrate old medicineEntries to medicationLogs
      return tx.table('medicineEntries').toArray().then(entries => {
        if (entries && entries.length > 0) {
          return tx.table('medicationLogs').bulkAdd(entries);
        }
      });
    });
  }
}

export const db = new HealthDatabase();

// Initialize default settings
export async function initializeDatabase() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      dailyWaterGoal: 2000, // 2L default
      weightUnit: 'kg'
    });
  }
}
