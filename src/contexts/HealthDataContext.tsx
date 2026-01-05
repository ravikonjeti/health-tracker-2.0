import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db, FoodEntry, WaterEntry, ExerciseEntry, BowelEntry, SymptomEntry, Medication, MedicineEntry, WeightEntry, initializeDatabase } from '../lib/database';
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
  updateWaterEntry: (id: string, entry: Partial<WaterEntry>) => Promise<void>;

  // Exercise
  exerciseEntries: ExerciseEntry[];
  addExerciseEntry: (entry: Omit<ExerciseEntry, 'id'>) => Promise<void>;
  deleteExerciseEntry: (id: string) => Promise<void>;
  updateExerciseEntry: (id: string, entry: Partial<ExerciseEntry>) => Promise<void>;

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

  // Medications
  medications: Medication[];
  addMedication: (medication: Omit<Medication, 'id'>) => Promise<void>;
  deleteMedication: (id: string) => Promise<void>;
  updateMedication: (id: string, medication: Partial<Medication>) => Promise<void>;

  // Medicine Entries
  medicineEntries: MedicineEntry[];
  addMedicineEntry: (entry: Omit<MedicineEntry, 'id'>) => Promise<void>;
  deleteMedicineEntry: (id: string) => Promise<void>;
  updateMedicineEntry: (id: string, entry: Partial<MedicineEntry>) => Promise<void>;

  // Weight
  weightEntries: WeightEntry[];
  addWeightEntry: (entry: Omit<WeightEntry, 'id'>) => Promise<void>;
  deleteWeightEntry: (id: string) => Promise<void>;
  updateWeightEntry: (id: string, entry: Partial<WeightEntry>) => Promise<void>;

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
  const medications = useLiveQuery(() => db.medications.toArray()) || [];
  const medicineEntries = useLiveQuery(() => db.medicineEntries.toArray()) || [];
  const weightEntries = useLiveQuery(() => db.weightEntries.toArray()) || [];

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

  // Medication operations
  const addMedication = async (medication: Omit<Medication, 'id'>) => {
    await db.medications.add({ ...medication, id: Date.now().toString() });
  };

  const deleteMedication = async (id: string) => {
    await db.medications.delete(id);
  };

  const updateMedication = async (id: string, medication: Partial<Medication>) => {
    await db.medications.update(id, medication);
  };

  // Medicine Entry operations
  const addMedicineEntry = async (entry: Omit<MedicineEntry, 'id'>) => {
    await db.medicineEntries.add({ ...entry, id: Date.now().toString() });
  };

  const deleteMedicineEntry = async (id: string) => {
    await db.medicineEntries.delete(id);
  };

  const updateMedicineEntry = async (id: string, entry: Partial<MedicineEntry>) => {
    await db.medicineEntries.update(id, entry);
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
        updateWaterEntry,
        exerciseEntries,
        addExerciseEntry,
        deleteExerciseEntry,
        updateExerciseEntry,
        bowelEntries,
        addBowelEntry,
        deleteBowelEntry,
        updateBowelEntry,
        symptomEntries,
        addSymptomEntry,
        deleteSymptomEntry,
        updateSymptomEntry,
        medications,
        addMedication,
        deleteMedication,
        updateMedication,
        medicineEntries,
        addMedicineEntry,
        deleteMedicineEntry,
        updateMedicineEntry,
        weightEntries,
        addWeightEntry,
        deleteWeightEntry,
        updateWeightEntry,
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
