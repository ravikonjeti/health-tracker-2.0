import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, FoodEntry, WaterEntry, ExerciseEntry, BowelEntry, SymptomEntry, initializeDatabase } from '../lib/database';
import { useLiveQuery } from 'dexie-react-hooks';

interface HealthDataContextType {
  // Food
  foodEntries: FoodEntry[];
  addFoodEntry: (entry: Omit<FoodEntry, 'id'>) => Promise<void>;
  deleteFoodEntry: (id: string) => Promise<void>;
  updateFoodEntry: (id: string, entry: Partial<FoodEntry>) => Promise<void>;

  // Water
  waterEntries: WaterEntry[];
  addWaterEntry: (entry: Omit<WaterEntry, 'id'>) => Promise<void>;
  deleteWaterEntry: (id: string) => Promise<void>;

  // Exercise
  exerciseEntries: ExerciseEntry[];
  addExerciseEntry: (entry: Omit<ExerciseEntry, 'id'>) => Promise<void>;
  deleteExerciseEntry: (id: string) => Promise<void>;

  // Bowel
  bowelEntries: BowelEntry[];
  addBowelEntry: (entry: Omit<BowelEntry, 'id'>) => Promise<void>;
  deleteBowelEntry: (id: string) => Promise<void>;

  // Symptoms
  symptomEntries: SymptomEntry[];
  addSymptomEntry: (entry: Omit<SymptomEntry, 'id'>) => Promise<void>;
  deleteSymptomEntry: (id: string) => Promise<void>;

  // Settings
  waterGoal: number;
  setWaterGoal: (goal: number) => Promise<void>;
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export function HealthDataProvider({ children }: { children: ReactNode }) {
  const [waterGoal, setWaterGoalState] = useState(2000);

  // Use Dexie's live queries for reactive data
  const foodEntries = useLiveQuery(() => db.foodEntries.toArray()) || [];
  const waterEntries = useLiveQuery(() => db.waterEntries.toArray()) || [];
  const exerciseEntries = useLiveQuery(() => db.exerciseEntries.toArray()) || [];
  const bowelEntries = useLiveQuery(() => db.bowelEntries.toArray()) || [];
  const symptomEntries = useLiveQuery(() => db.symptomEntries.toArray()) || [];

  // Initialize database and load settings
  useEffect(() => {
    initializeDatabase().then(async () => {
      const settings = await db.settings.toArray();
      if (settings.length > 0) {
        setWaterGoalState(settings[0].dailyWaterGoal);
      }
    });
  }, []);

  // Food operations
  const addFoodEntry = async (entry: Omit<FoodEntry, 'id'>) => {
    await db.foodEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteFoodEntry = async (id: string) => {
    await db.foodEntries.delete(id);
  };

  const updateFoodEntry = async (id: string, entry: Partial<FoodEntry>) => {
    await db.foodEntries.update(id, entry);
  };

  // Water operations
  const addWaterEntry = async (entry: Omit<WaterEntry, 'id'>) => {
    await db.waterEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteWaterEntry = async (id: string) => {
    await db.waterEntries.delete(id);
  };

  // Exercise operations
  const addExerciseEntry = async (entry: Omit<ExerciseEntry, 'id'>) => {
    await db.exerciseEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteExerciseEntry = async (id: string) => {
    await db.exerciseEntries.delete(id);
  };

  // Bowel operations
  const addBowelEntry = async (entry: Omit<BowelEntry, 'id'>) => {
    await db.bowelEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteBowelEntry = async (id: string) => {
    await db.bowelEntries.delete(id);
  };

  // Symptom operations
  const addSymptomEntry = async (entry: Omit<SymptomEntry, 'id'>) => {
    await db.symptomEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteSymptomEntry = async (id: string) => {
    await db.symptomEntries.delete(id);
  };

  // Settings operations
  const setWaterGoal = async (goal: number) => {
    const settings = await db.settings.toArray();
    if (settings.length > 0) {
      await db.settings.update(settings[0].id!, { dailyWaterGoal: goal });
    }
    setWaterGoalState(goal);
  };

  return (
    <HealthDataContext.Provider
      value={{
        foodEntries,
        addFoodEntry,
        deleteFoodEntry,
        updateFoodEntry,
        waterEntries,
        addWaterEntry,
        deleteWaterEntry,
        exerciseEntries,
        addExerciseEntry,
        deleteExerciseEntry,
        bowelEntries,
        addBowelEntry,
        deleteBowelEntry,
        symptomEntries,
        addSymptomEntry,
        deleteSymptomEntry,
        waterGoal,
        setWaterGoal,
      }}
    >
      {children}
    </HealthDataContext.Provider>
  );
}

export function useHealthData() {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within HealthDataProvider');
  }
  return context;
}
