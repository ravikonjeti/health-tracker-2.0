import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, FoodEntry, WaterEntry, ExerciseEntry, BowelEntry, SymptomEntry, Medication, MedicationLog, WeightEntry, Recipe, StepEntry, WellnessFeelings, SleepEntry, initializeDatabase } from '../lib/database';
import { useLiveQuery } from 'dexie-react-hooks';

interface HealthDataContextType {
  // Food
  foodEntries: FoodEntry[];
  addFoodEntry: (entry: Omit<FoodEntry, 'id'>) => Promise<void>;
  deleteFoodEntry: (id: string) => Promise<void>;
  updateFoodEntry: (id: string, entry: Partial<FoodEntry>) => Promise<void>;

  // Recipes (INDEPENDENT)
  recipes: Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id'>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => Promise<void>;

  // Water
  waterEntries: WaterEntry[];
  addWaterEntry: (entry: Omit<WaterEntry, 'id'>) => Promise<void>;
  deleteWaterEntry: (id: string) => Promise<void>;
  updateWaterEntry: (id: string, entry: Partial<WaterEntry>) => Promise<void>;

  // Exercise
  exerciseEntries: ExerciseEntry[];
  addExerciseEntry: (entry: Omit<ExerciseEntry, 'id'>) => Promise<void>;
  deleteExerciseEntry: (id: string) => Promise<void>;
  updateExerciseEntry: (id: string, entry: Partial<ExerciseEntry>) => Promise<void>;

  // Steps (SEPARATE)
  stepEntries: StepEntry[];
  addStepEntry: (entry: Omit<StepEntry, 'id'>) => Promise<void>;
  deleteStepEntry: (id: string) => Promise<void>;
  updateStepEntry: (id: string, entry: Partial<StepEntry>) => Promise<void>;

  // Bowel
  bowelEntries: BowelEntry[];
  addBowelEntry: (entry: Omit<BowelEntry, 'id'>) => Promise<void>;
  deleteBowelEntry: (id: string) => Promise<void>;
  updateBowelEntry: (id: string, entry: Partial<BowelEntry>) => Promise<void>;

  // Symptoms
  symptomEntries: SymptomEntry[];
  addSymptomEntry: (entry: Omit<SymptomEntry, 'id'>) => Promise<void>;
  deleteSymptomEntry: (id: string) => Promise<void>;
  updateSymptomEntry: (id: string, entry: Partial<SymptomEntry>) => Promise<void>;

  // Wellness Feelings (SEPARATE)
  wellnessFeelings: WellnessFeelings[];
  addWellnessFeelings: (feelings: Omit<WellnessFeelings, 'id'>) => Promise<void>;
  deleteWellnessFeelings: (id: string) => Promise<void>;
  updateWellnessFeelings: (id: string, feelings: Partial<WellnessFeelings>) => Promise<void>;

  // Medications List (PERSISTENT)
  medications: Medication[];
  addMedication: (med: Omit<Medication, 'id'>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  updateMedication: (id: string, med: Partial<Medication>) => Promise<void>;

  // Medication Logs (DAILY)
  medicationLogs: MedicationLog[];
  addMedicationLog: (log: Omit<MedicationLog, 'id'>) => Promise<void>;
  deleteMedicationLog: (id: string) => Promise<void>;
  updateMedicationLog: (id: string, log: Partial<MedicationLog>) => Promise<void>;

  // Weight
  weightEntries: WeightEntry[];
  addWeightEntry: (entry: Omit<WeightEntry, 'id'>) => Promise<void>;
  deleteWeightEntry: (id: string) => Promise<void>;
  updateWeightEntry: (id: string, entry: Partial<WeightEntry>) => Promise<void>;

  // Sleep (NEW)
  sleepEntries: SleepEntry[];
  addSleepEntry: (entry: Omit<SleepEntry, 'id'>) => Promise<void>;
  deleteSleepEntry: (id: string) => Promise<void>;
  updateSleepEntry: (id: string, entry: Partial<SleepEntry>) => Promise<void>;

  // Settings
  waterGoal: number;
  setWaterGoal: (goal: number) => Promise<void>;
  weightUnit: 'kg' | 'lb';
  setWeightUnit: (unit: 'kg' | 'lb') => Promise<void>;
}

const HealthDataContext = createContext<HealthDataContextType | undefined>(undefined);

export function HealthDataProvider({ children }: { children: ReactNode }) {
  const [waterGoal, setWaterGoalState] = useState(2000);
  const [weightUnit, setWeightUnitState] = useState<'kg' | 'lb'>('kg');

  // Use Dexie's live queries for reactive data
  const foodEntries = useLiveQuery(() => db.foodEntries.toArray()) || [];
  const recipes = useLiveQuery(() => db.recipes.toArray()) || [];
  const waterEntries = useLiveQuery(() => db.waterEntries.toArray()) || [];
  const exerciseEntries = useLiveQuery(() => db.exerciseEntries.toArray()) || [];
  const stepEntries = useLiveQuery(() => db.stepEntries.toArray()) || [];
  const bowelEntries = useLiveQuery(() => db.bowelEntries.toArray()) || [];
  const symptomEntries = useLiveQuery(() => db.symptomEntries.toArray()) || [];
  const wellnessFeelings = useLiveQuery(() => db.wellnessFeelings.toArray()) || [];
  const medications = useLiveQuery(() => db.medications.toArray()) || [];
  const medicationLogs = useLiveQuery(() => db.medicationLogs.toArray()) || [];
  const weightEntries = useLiveQuery(() => db.weightEntries.toArray()) || [];
  const sleepEntries = useLiveQuery(() => db.sleepEntries.toArray()) || [];

  // Initialize database and load settings
  useEffect(() => {
    initializeDatabase().then(async () => {
      const settings = await db.settings.toArray();
      if (settings.length > 0) {
        setWaterGoalState(settings[0].dailyWaterGoal);
        setWeightUnitState(settings[0].weightUnit || 'kg');
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

  const updateWaterEntry = async (id: string, entry: Partial<WaterEntry>) => {
    await db.waterEntries.update(id, entry);
  };

  // Exercise operations
  const addExerciseEntry = async (entry: Omit<ExerciseEntry, 'id'>) => {
    await db.exerciseEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteExerciseEntry = async (id: string) => {
    await db.exerciseEntries.delete(id);
  };

  const updateExerciseEntry = async (id: string, entry: Partial<ExerciseEntry>) => {
    await db.exerciseEntries.update(id, entry);
  };

  // Bowel operations
  const addBowelEntry = async (entry: Omit<BowelEntry, 'id'>) => {
    await db.bowelEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteBowelEntry = async (id: string) => {
    await db.bowelEntries.delete(id);
  };

  const updateBowelEntry = async (id: string, entry: Partial<BowelEntry>) => {
    await db.bowelEntries.update(id, entry);
  };

  // Symptom operations
  const addSymptomEntry = async (entry: Omit<SymptomEntry, 'id'>) => {
    await db.symptomEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteSymptomEntry = async (id: string) => {
    await db.symptomEntries.delete(id);
  };

  const updateSymptomEntry = async (id: string, entry: Partial<SymptomEntry>) => {
    await db.symptomEntries.update(id, entry);
  };

  // Recipe operations
  const addRecipe = async (recipe: Omit<Recipe, 'id'>) => {
    await db.recipes.add({ ...recipe, id: Date.now().toString() });
  };

  const deleteRecipe = async (id: string) => {
    await db.recipes.delete(id);
  };

  const updateRecipe = async (id: string, recipe: Partial<Recipe>) => {
    await db.recipes.update(id, recipe);
  };

  // Step operations
  const addStepEntry = async (entry: Omit<StepEntry, 'id'>) => {
    await db.stepEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteStepEntry = async (id: string) => {
    await db.stepEntries.delete(id);
  };

  const updateStepEntry = async (id: string, entry: Partial<StepEntry>) => {
    await db.stepEntries.update(id, entry);
  };

  // Wellness operations
  const addWellnessFeelings = async (feelings: Omit<WellnessFeelings, 'id'>) => {
    await db.wellnessFeelings.add({ ...feelings, id: Date.now().toString() });
  };

  const deleteWellnessFeelings = async (id: string) => {
    await db.wellnessFeelings.delete(id);
  };

  const updateWellnessFeelings = async (id: string, feelings: Partial<WellnessFeelings>) => {
    await db.wellnessFeelings.update(id, feelings);
  };

  // Medication list operations
  const addMedication = async (med: Omit<Medication, 'id'>) => {
    await db.medications.add({ ...med, id: Date.now().toString() });
  };

  const deleteMedication = async (id: string) => {
    await db.medications.delete(id);
  };

  const updateMedication = async (id: string, med: Partial<Medication>) => {
    await db.medications.update(id, med);
  };

  // Medication log operations
  const addMedicationLog = async (log: Omit<MedicationLog, 'id'>) => {
    await db.medicationLogs.add({ ...log, id: Date.now().toString() });
  };

  const deleteMedicationLog = async (id: string) => {
    await db.medicationLogs.delete(id);
  };

  const updateMedicationLog = async (id: string, log: Partial<MedicationLog>) => {
    await db.medicationLogs.update(id, log);
  };

  // Weight operations
  const addWeightEntry = async (entry: Omit<WeightEntry, 'id'>) => {
    await db.weightEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteWeightEntry = async (id: string) => {
    await db.weightEntries.delete(id);
  };

  const updateWeightEntry = async (id: string, entry: Partial<WeightEntry>) => {
    await db.weightEntries.update(id, entry);
  };

  // Sleep operations
  const addSleepEntry = async (entry: Omit<SleepEntry, 'id'>) => {
    await db.sleepEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteSleepEntry = async (id: string) => {
    await db.sleepEntries.delete(id);
  };

  const updateSleepEntry = async (id: string, entry: Partial<SleepEntry>) => {
    await db.sleepEntries.update(id, entry);
  };

  // Settings operations
  const setWaterGoal = async (goal: number) => {
    const settings = await db.settings.toArray();
    if (settings.length > 0) {
      await db.settings.update(settings[0].id!, { dailyWaterGoal: goal });
    }
    setWaterGoalState(goal);
  };

  const setWeightUnit = async (unit: 'kg' | 'lb') => {
    const settings = await db.settings.toArray();
    if (settings.length > 0) {
      await db.settings.update(settings[0].id!, { weightUnit: unit });
    }
    setWeightUnitState(unit);
  };

  return (
    <HealthDataContext.Provider
      value={{
        foodEntries,
        addFoodEntry,
        deleteFoodEntry,
        updateFoodEntry,
        recipes,
        addRecipe,
        deleteRecipe,
        updateRecipe,
        waterEntries,
        addWaterEntry,
        deleteWaterEntry,
        updateWaterEntry,
        exerciseEntries,
        addExerciseEntry,
        deleteExerciseEntry,
        updateExerciseEntry,
        stepEntries,
        addStepEntry,
        deleteStepEntry,
        updateStepEntry,
        bowelEntries,
        addBowelEntry,
        deleteBowelEntry,
        updateBowelEntry,
        symptomEntries,
        addSymptomEntry,
        deleteSymptomEntry,
        updateSymptomEntry,
        wellnessFeelings,
        addWellnessFeelings,
        deleteWellnessFeelings,
        updateWellnessFeelings,
        medications,
        addMedication,
        deleteMedication,
        updateMedication,
        medicationLogs,
        addMedicationLog,
        deleteMedicationLog,
        updateMedicationLog,
        weightEntries,
        addWeightEntry,
        deleteWeightEntry,
        updateWeightEntry,
        sleepEntries,
        addSleepEntry,
        deleteSleepEntry,
        updateSleepEntry,
        waterGoal,
        setWaterGoal,
        weightUnit,
        setWeightUnit,
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
