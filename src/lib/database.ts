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
  type: number; // 1-7 Bristol Stool Scale
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

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  notes?: string;
}

export interface MedicineEntry {
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
  bodyFat?: number;
  water?: number;
  muscleMass?: number;
  boneMass?: number;
  bmi?: number;
}

export interface UserSettings {
  id?: string;
  dailyWaterGoal: number; // ml
  [key: string]: any;
}

// Database class
export class HealthDatabase extends Dexie {
  foodEntries!: Table<FoodEntry, string>;
  waterEntries!: Table<WaterEntry, string>;
  exerciseEntries!: Table<ExerciseEntry, string>;
  bowelEntries!: Table<BowelEntry, string>;
  symptomEntries!: Table<SymptomEntry, string>;
  medications!: Table<Medication, string>;
  medicineEntries!: Table<MedicineEntry, string>;
  weightEntries!: Table<WeightEntry, string>;
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
  }
}

export const db = new HealthDatabase();

// Initialize default settings
export async function initializeDatabase() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      dailyWaterGoal: 2000 // 2L default
    });
  }
}
