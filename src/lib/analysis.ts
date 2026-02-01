import { FoodEntry, SymptomEntry, WaterEntry, SleepEntry, ExerciseEntry, MedicationLog, WellnessFeelings, KnownAllergy } from './database';
import { differenceInMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';

export interface Correlation {
  id: string;
  ingredient: string;
  symptom: string;
  occurrences: number;
  total: number;
  percentage: number;
  averageDelay: string; // e.g., "4.5 hours"
  timeWindow: string; // e.g., "6hr"
  confidence: 'low' | 'medium' | 'high';

  // NEW: Contextual factors
  contextualFactors?: {
    lowWater: boolean;         // Water intake < 1L on symptom days
    poorSleep: boolean;        // Sleep quality < 3
    noExercise: boolean;       // No exercise on symptom days
    onMedication: string[];    // Active medications
    isKnownAllergy: boolean;   // Matches known allergy
  };

  // NEW: Protective factors (when symptom didn't occur)
  protectiveFactors?: {
    adequateWater: boolean;    // Water intake >= 2L prevents symptoms
    goodSleep: boolean;        // Sleep quality >= 4 reduces symptoms
    regularExercise: boolean;  // Exercise helps prevent symptoms
  };
}

// NEW: Positive outcome correlations
export interface PositiveCorrelation {
  id: string;
  ingredient: string;
  improvement: string; // e.g., "energy", "mood", "digestion"
  occurrences: number;
  total: number;
  percentage: number;
  averageDelay: string;
  timeWindow: string;
  confidence: 'low' | 'medium' | 'high';
}

// NEW: Allergy warnings
export interface AllergyWarning {
  allergyName: string;
  foundIn: string[]; // Food entries containing this allergen
  severity: 'mild' | 'moderate' | 'severe' | 'anaphylaxis';
  recommendedAction: string;
}

export interface AnalysisResult {
  correlations: Correlation[];
  positiveCorrelations: PositiveCorrelation[]; // NEW
  allergyWarnings: AllergyWarning[]; // NEW
  symptomFreeDays: number;
  symptomDays: number;
  topIngredient: string;
  topSymptom: string;
  totalEntries: {
    food: number;
    symptoms: number;
  };

  // NEW: Contextual statistics
  contextualStats?: {
    avgWaterOnSymptomDays: number;
    avgWaterOnGoodDays: number;
    avgSleepQualityOnSymptomDays: number;
    avgSleepQualityOnGoodDays: number;
    exerciseOnSymptomDays: number; // percentage
    exerciseOnGoodDays: number; // percentage
  };
}

// Helper: Parse date+time to Date object
function parseDateTime(date: string, time: string): Date {
  return parseISO(`${date}T${time}:00`);
}

// NEW: Get water intake for a specific date
function getWaterIntakeForDate(date: string, waterEntries: WaterEntry[]): number {
  return waterEntries
    .filter(entry => entry.date === date)
    .reduce((total, entry) => total + entry.amount, 0);
}

// NEW: Get sleep quality for a specific date
function getSleepQualityForDate(date: string, sleepEntries: SleepEntry[]): number | null {
  const sleepEntry = sleepEntries.find(entry => entry.date === date);
  return sleepEntry ? sleepEntry.sleepQuality : null;
}

// NEW: Check if exercised on a specific date
function hasExerciseOnDate(date: string, exerciseEntries: ExerciseEntry[]): boolean {
  return exerciseEntries.some(entry => entry.date === date);
}

// NEW: Get active medications for a date/time
function getActiveMedicationsForDateTime(
  date: string,
  time: string,
  medicationLogs: MedicationLog[]
): string[] {
  // Get medications taken in the last 24 hours
  const targetTime = parseDateTime(date, time);
  return medicationLogs
    .filter(log => {
      const logTime = parseDateTime(log.date, log.time);
      const hoursDiff = differenceInMinutes(targetTime, logTime) / 60;
      return hoursDiff >= 0 && hoursDiff <= 24;
    })
    .map(log => log.medicationName);
}

// NEW: Check if ingredient matches known allergy
function matchesKnownAllergy(ingredient: string, knownAllergies: KnownAllergy[]): KnownAllergy | null {
  const normalizedIngredient = ingredient.toLowerCase().trim();
  return knownAllergies.find(allergy =>
    normalizedIngredient.includes(allergy.name.toLowerCase()) ||
    allergy.name.toLowerCase().includes(normalizedIngredient)
  ) || null;
}

// Helper: Get symptoms within time window after food entry
function getSymptomsInWindow(
  foodEntry: FoodEntry,
  symptoms: SymptomEntry[],
  windowMinutes: number
): SymptomEntry[] {
  const foodTime = parseDateTime(foodEntry.date, foodEntry.time);

  return symptoms.filter(symptom => {
    const symptomTime = parseDateTime(symptom.date, symptom.time);
    const diff = differenceInMinutes(symptomTime, foodTime);

    // Symptom must occur AFTER food, within the window
    return diff > 0 && diff <= windowMinutes;
  });
}

// Main analysis function
export function analyzeCorrelations(
  foodEntries: FoodEntry[],
  symptomEntries: SymptomEntry[],
  timeWindowHours: number = 6
): Correlation[] {
  const windowMinutes = timeWindowHours * 60;
  const correlationMap = new Map<string, {
    occurrences: number;
    totalConsumptions: number;
    delays: number[];
    symptomType: string;
  }>();

  // Build correlation map
  foodEntries.forEach(foodEntry => {
    const symptomsInWindow = getSymptomsInWindow(foodEntry, symptomEntries, windowMinutes);

    // For each ingredient in this food entry
    foodEntry.ingredients.forEach(ingredient => {
      const normalizedIngredient = ingredient.toLowerCase().trim();

      // For each symptom found in window
      symptomsInWindow.forEach(symptom => {
        const key = `${normalizedIngredient}|${symptom.symptom}`;

        if (!correlationMap.has(key)) {
          correlationMap.set(key, {
            occurrences: 0,
            totalConsumptions: 0,
            delays: [],
            symptomType: symptom.symptom
          });
        }

        const data = correlationMap.get(key)!;
        data.occurrences++;

        // Calculate delay
        const foodTime = parseDateTime(foodEntry.date, foodEntry.time);
        const symptomTime = parseDateTime(symptom.date, symptom.time);
        const delayMinutes = differenceInMinutes(symptomTime, foodTime);
        data.delays.push(delayMinutes);
      });
    });
  });

  // Count total consumptions per ingredient
  const ingredientCounts = new Map<string, number>();
  foodEntries.forEach(entry => {
    entry.ingredients.forEach(ing => {
      const normalized = ing.toLowerCase().trim();
      ingredientCounts.set(normalized, (ingredientCounts.get(normalized) || 0) + 1);
    });
  });

  // Build correlations array
  const correlations: Correlation[] = [];
  correlationMap.forEach((data, key) => {
    const [ingredient, symptom] = key.split('|');
    const total = ingredientCounts.get(ingredient) || 1;
    const percentage = (data.occurrences / total) * 100;

    // Only include if meets minimum threshold (3+ occurrences)
    if (data.occurrences >= 3) {
      const avgDelayMinutes = data.delays.reduce((a, b) => a + b, 0) / data.delays.length;
      const avgDelayHours = (avgDelayMinutes / 60).toFixed(1);

      correlations.push({
        id: key,
        ingredient,
        symptom,
        occurrences: data.occurrences,
        total,
        percentage: Math.round(percentage * 10) / 10,
        averageDelay: `${avgDelayHours} hours`,
        timeWindow: `${timeWindowHours}hr`,
        confidence: getConfidence(data.occurrences)
      });
    }
  });

  // Sort by percentage (highest first)
  return correlations.sort((a, b) => b.percentage - a.percentage);
}

function getConfidence(occurrences: number): 'low' | 'medium' | 'high' {
  if (occurrences >= 10) return 'high';
  if (occurrences >= 5) return 'medium';
  return 'low';
}

// Summary statistics
export function generateAnalysisSummary(
  foodEntries: FoodEntry[],
  symptomEntries: SymptomEntry[],
  correlations: Correlation[]
): AnalysisResult {
  // Get unique dates with symptoms
  const symptomDates = new Set(symptomEntries.map(s => s.date));

  // Get all dates with any entry
  const allDates = new Set([
    ...foodEntries.map(f => f.date),
    ...symptomEntries.map(s => s.date)
  ]);

  const symptomFreeDays = allDates.size - symptomDates.size;

  // Most common ingredient
  const ingredientFreq = new Map<string, number>();
  foodEntries.forEach(entry => {
    entry.ingredients.forEach(ing => {
      const normalized = ing.toLowerCase().trim();
      ingredientFreq.set(normalized, (ingredientFreq.get(normalized) || 0) + 1);
    });
  });

  let topIngredient = 'None';
  let maxFreq = 0;
  ingredientFreq.forEach((count, ingredient) => {
    if (count > maxFreq) {
      maxFreq = count;
      topIngredient = ingredient;
    }
  });

  // Most common symptom
  const symptomFreq = new Map<string, number>();
  symptomEntries.forEach(entry => {
    symptomFreq.set(entry.symptom, (symptomFreq.get(entry.symptom) || 0) + 1);
  });

  let topSymptom = 'None';
  let maxSymptomFreq = 0;
  symptomFreq.forEach((count, symptom) => {
    if (count > maxSymptomFreq) {
      maxSymptomFreq = count;
      topSymptom = symptom;
    }
  });

  return {
    correlations,
    symptomFreeDays,
    symptomDays: symptomDates.size,
    topIngredient,
    topSymptom,
    totalEntries: {
      food: foodEntries.length,
      symptoms: symptomEntries.length
    }
  };
}

// Timeline data for charts
export interface TimelinePoint {
  date: string;
  time: string;
  timestamp: number;
  type: 'food' | 'symptom';
  description: string;
  details?: any;
}

export function generateTimelineData(
  foodEntries: FoodEntry[],
  symptomEntries: SymptomEntry[]
): TimelinePoint[] {
  const points: TimelinePoint[] = [];

  foodEntries.forEach(entry => {
    points.push({
      date: entry.date,
      time: entry.time,
      timestamp: parseDateTime(entry.date, entry.time).getTime(),
      type: 'food',
      description: entry.description,
      details: entry
    });
  });

  symptomEntries.forEach(entry => {
    points.push({
      date: entry.date,
      time: entry.time,
      timestamp: parseDateTime(entry.date, entry.time).getTime(),
      type: 'symptom',
      description: entry.symptom,
      details: entry
    });
  });

  return points.sort((a, b) => a.timestamp - b.timestamp);
}

// =============================================================================
// PHASE 1: ENHANCED MULTI-FACTOR CORRELATION ANALYSIS
// =============================================================================

export interface EnhancedAnalysisInput {
  foodEntries: FoodEntry[];
  symptomEntries: SymptomEntry[];
  waterEntries: WaterEntry[];
  sleepEntries: SleepEntry[];
  exerciseEntries: ExerciseEntry[];
  medicationLogs: MedicationLog[];
  wellnessFeelings: WellnessFeelings[];
  knownAllergies: KnownAllergy[];
}

// Enhanced correlation analysis with multi-factor context
export function analyzeEnhancedCorrelations(
  input: EnhancedAnalysisInput,
  timeWindowHours: number = 6
): Correlation[] {
  const { foodEntries, symptomEntries, waterEntries, sleepEntries, exerciseEntries, medicationLogs, knownAllergies } = input;
  const windowMinutes = timeWindowHours * 60;
  const correlationMap = new Map<string, {
    occurrences: number;
    totalConsumptions: number;
    delays: number[];
    symptomType: string;
    contextData: {
      lowWaterCount: number;
      poorSleepCount: number;
      noExerciseCount: number;
      withMedsCount: number;
      isKnownAllergy: boolean;
    };
    protectiveData: {
      goodWaterCount: number;
      goodSleepCount: number;
      withExerciseCount: number;
    };
  }>();

  // Build correlation map with contextual data
  foodEntries.forEach(foodEntry => {
    const symptomsInWindow = getSymptomsInWindow(foodEntry, symptomEntries, windowMinutes);

    // Get contextual data for this food entry date
    const waterIntake = getWaterIntakeForDate(foodEntry.date, waterEntries);
    const sleepQuality = getSleepQualityForDate(foodEntry.date, sleepEntries);
    const hasExercise = hasExerciseOnDate(foodEntry.date, exerciseEntries);
    const activeMeds = getActiveMedicationsForDateTime(foodEntry.date, foodEntry.time, medicationLogs);

    foodEntry.ingredients.forEach(ingredient => {
      const normalizedIngredient = ingredient.toLowerCase().trim();
      const allergyMatch = matchesKnownAllergy(ingredient, knownAllergies);

      symptomsInWindow.forEach(symptom => {
        const key = `${normalizedIngredient}|${symptom.symptom}`;

        if (!correlationMap.has(key)) {
          correlationMap.set(key, {
            occurrences: 0,
            totalConsumptions: 0,
            delays: [],
            symptomType: symptom.symptom,
            contextData: {
              lowWaterCount: 0,
              poorSleepCount: 0,
              noExerciseCount: 0,
              withMedsCount: 0,
              isKnownAllergy: !!allergyMatch
            },
            protectiveData: {
              goodWaterCount: 0,
              goodSleepCount: 0,
              withExerciseCount: 0
            }
          });
        }

        const data = correlationMap.get(key)!;
        data.occurrences++;

        // Track contextual factors
        if (waterIntake < 1000) data.contextData.lowWaterCount++;
        if (sleepQuality && sleepQuality < 3) data.contextData.poorSleepCount++;
        if (!hasExercise) data.contextData.noExerciseCount++;
        if (activeMeds.length > 0) data.contextData.withMedsCount++;

        // Calculate delay
        const foodTime = parseDateTime(foodEntry.date, foodEntry.time);
        const symptomTime = parseDateTime(symptom.date, symptom.time);
        const delayMinutes = differenceInMinutes(symptomTime, foodTime);
        data.delays.push(delayMinutes);
      });

      // Track when ingredient was consumed WITHOUT symptoms (for protective factors)
      if (symptomsInWindow.length === 0) {
        foodEntry.ingredients.forEach(ing => {
          const normalized = ing.toLowerCase().trim();
          const existingKeys = Array.from(correlationMap.keys()).filter(k => k.startsWith(normalized + '|'));

          existingKeys.forEach(key => {
            const data = correlationMap.get(key)!;
            if (waterIntake >= 2000) data.protectiveData.goodWaterCount++;
            if (sleepQuality && sleepQuality >= 4) data.protectiveData.goodSleepCount++;
            if (hasExercise) data.protectiveData.withExerciseCount++;
          });
        });
      }
    });
  });

  // Count total consumptions per ingredient
  const ingredientCounts = new Map<string, number>();
  foodEntries.forEach(entry => {
    entry.ingredients.forEach(ing => {
      const normalized = ing.toLowerCase().trim();
      ingredientCounts.set(normalized, (ingredientCounts.get(normalized) || 0) + 1);
    });
  });

  // Build enhanced correlations array
  const correlations: Correlation[] = [];
  correlationMap.forEach((data, key) => {
    const [ingredient, symptom] = key.split('|');
    const total = ingredientCounts.get(ingredient) || 1;
    const percentage = (data.occurrences / total) * 100;

    // Only include if meets minimum threshold (3+ occurrences)
    if (data.occurrences >= 3) {
      const avgDelayMinutes = data.delays.reduce((a, b) => a + b, 0) / data.delays.length;
      const avgDelayHours = (avgDelayMinutes / 60).toFixed(1);

      correlations.push({
        id: key,
        ingredient,
        symptom,
        occurrences: data.occurrences,
        total,
        percentage: Math.round(percentage * 10) / 10,
        averageDelay: `${avgDelayHours} hours`,
        timeWindow: `${timeWindowHours}hr`,
        confidence: getConfidence(data.occurrences),
        contextualFactors: {
          lowWater: data.contextData.lowWaterCount / data.occurrences > 0.5,
          poorSleep: data.contextData.poorSleepCount / data.occurrences > 0.5,
          noExercise: data.contextData.noExerciseCount / data.occurrences > 0.5,
          onMedication: [], // Could be enhanced to track specific meds
          isKnownAllergy: data.contextData.isKnownAllergy
        },
        protectiveFactors: {
          adequateWater: data.protectiveData.goodWaterCount > data.protectiveData.goodWaterCount + data.contextData.lowWaterCount ? true : false,
          goodSleep: data.protectiveData.goodSleepCount > data.protectiveData.goodSleepCount + data.contextData.poorSleepCount ? true : false,
          regularExercise: data.protectiveData.withExerciseCount > data.protectiveData.withExerciseCount + data.contextData.noExerciseCount ? true : false
        }
      });
    }
  });

  return correlations.sort((a, b) => b.percentage - a.percentage);
}

// =============================================================================
// PHASE 2: POSITIVE OUTCOME ANALYSIS
// =============================================================================

// Analyze positive correlations (what makes you feel BETTER)
export function analyzePositiveCorrelations(
  input: EnhancedAnalysisInput,
  timeWindowHours: number = 6
): PositiveCorrelation[] {
  const { foodEntries, wellnessFeelings } = input;
  const windowMinutes = timeWindowHours * 60;
  const positiveMap = new Map<string, {
    occurrences: number;
    total: number;
    delays: number[];
    improvementType: string;
  }>();

  foodEntries.forEach(foodEntry => {
    const foodTime = parseDateTime(foodEntry.date, foodEntry.time);

    // Find wellness improvements within time window
    wellnessFeelings.forEach(wellness => {
      // Check if wellness is positive (happy feelings)
      const improvements: string[] = [];
      if (wellness.overall === 'happy') improvements.push('overall_mood');
      if (wellness.morning === 'happy') improvements.push('morning_energy');
      if (wellness.afternoon === 'happy') improvements.push('afternoon_energy');
      if (wellness.evening === 'happy') improvements.push('evening_mood');

      if (improvements.length > 0) {
        // Approximate wellness time as midday for simplicity
        const wellnessTime = parseDateTime(wellness.date, '12:00');
        const diff = differenceInMinutes(wellnessTime, foodTime);

        if (diff > 0 && diff <= windowMinutes) {
          foodEntry.ingredients.forEach(ingredient => {
            const normalized = ingredient.toLowerCase().trim();

            improvements.forEach(improvement => {
              const key = `${normalized}|${improvement}`;

              if (!positiveMap.has(key)) {
                positiveMap.set(key, {
                  occurrences: 0,
                  total: 0,
                  delays: [],
                  improvementType: improvement
                });
              }

              const data = positiveMap.get(key)!;
              data.occurrences++;
              data.delays.push(diff);
            });
          });
        }
      }
    });
  });

  // Count total consumptions
  const ingredientCounts = new Map<string, number>();
  foodEntries.forEach(entry => {
    entry.ingredients.forEach(ing => {
      const normalized = ing.toLowerCase().trim();
      ingredientCounts.set(normalized, (ingredientCounts.get(normalized) || 0) + 1);
    });
  });

  // Build positive correlations array
  const positiveCorrelations: PositiveCorrelation[] = [];
  positiveMap.forEach((data, key) => {
    const [ingredient, improvement] = key.split('|');
    const total = ingredientCounts.get(ingredient) || 1;
    const percentage = (data.occurrences / total) * 100;

    // Only include if meets minimum threshold
    if (data.occurrences >= 2 && percentage >= 40) {
      const avgDelayMinutes = data.delays.reduce((a, b) => a + b, 0) / data.delays.length;
      const avgDelayHours = (avgDelayMinutes / 60).toFixed(1);

      positiveCorrelations.push({
        id: key,
        ingredient,
        improvement: improvement.replace('_', ' '),
        occurrences: data.occurrences,
        total,
        percentage: Math.round(percentage * 10) / 10,
        averageDelay: `${avgDelayHours} hours`,
        timeWindow: `${timeWindowHours}hr`,
        confidence: getConfidence(data.occurrences)
      });
    }
  });

  return positiveCorrelations.sort((a, b) => b.percentage - a.percentage);
}

// Detect known allergies in recent food entries
export function detectAllergyWarnings(
  foodEntries: FoodEntry[],
  knownAllergies: KnownAllergy[],
  daysToCheck: number = 7
): AllergyWarning[] {
  const warnings: AllergyWarning[] = [];
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToCheck);

  // Check each known allergy
  knownAllergies.forEach(allergy => {
    const foundInEntries: string[] = [];

    foodEntries.forEach(entry => {
      const entryDate = new Date(entry.date);
      if (entryDate >= cutoffDate) {
        entry.ingredients.forEach(ingredient => {
          if (matchesKnownAllergy(ingredient, [allergy])) {
            foundInEntries.push(`${entry.date} - ${entry.description}`);
          }
        });
      }
    });

    if (foundInEntries.length > 0) {
      warnings.push({
        allergyName: allergy.name,
        foundIn: foundInEntries,
        severity: allergy.severity,
        recommendedAction: allergy.severity === 'anaphylaxis'
          ? 'URGENT: Avoid immediately and consult doctor'
          : allergy.severity === 'severe'
          ? 'Strongly avoid and monitor symptoms'
          : 'Consider avoiding or limiting intake'
      });
    }
  });

  return warnings;
}

// Enhanced analysis summary with all new features
export function generateEnhancedAnalysisSummary(
  input: EnhancedAnalysisInput,
  correlations: Correlation[],
  positiveCorrelations: PositiveCorrelation[],
  allergyWarnings: AllergyWarning[]
): AnalysisResult {
  const { foodEntries, symptomEntries, waterEntries, sleepEntries, exerciseEntries } = input;

  // Get basic stats
  const symptomDates = new Set(symptomEntries.map(s => s.date));
  const allDates = new Set([
    ...foodEntries.map(f => f.date),
    ...symptomEntries.map(s => s.date)
  ]);

  // Calculate contextual statistics
  const symptomDatesList = Array.from(symptomDates);
  const goodDates = Array.from(allDates).filter(d => !symptomDates.has(d));

  const avgWaterOnSymptomDays = symptomDatesList.length > 0
    ? symptomDatesList.reduce((sum, date) => sum + getWaterIntakeForDate(date, waterEntries), 0) / symptomDatesList.length
    : 0;

  const avgWaterOnGoodDays = goodDates.length > 0
    ? goodDates.reduce((sum, date) => sum + getWaterIntakeForDate(date, waterEntries), 0) / goodDates.length
    : 0;

  const symptomSleepQualities = symptomDatesList
    .map(date => getSleepQualityForDate(date, sleepEntries))
    .filter(q => q !== null) as number[];

  const goodSleepQualities = goodDates
    .map(date => getSleepQualityForDate(date, sleepEntries))
    .filter(q => q !== null) as number[];

  const avgSleepQualityOnSymptomDays = symptomSleepQualities.length > 0
    ? symptomSleepQualities.reduce((a, b) => a + b, 0) / symptomSleepQualities.length
    : 0;

  const avgSleepQualityOnGoodDays = goodSleepQualities.length > 0
    ? goodSleepQualities.reduce((a, b) => a + b, 0) / goodSleepQualities.length
    : 0;

  const exerciseOnSymptomDays = symptomDatesList.length > 0
    ? (symptomDatesList.filter(date => hasExerciseOnDate(date, exerciseEntries)).length / symptomDatesList.length) * 100
    : 0;

  const exerciseOnGoodDays = goodDates.length > 0
    ? (goodDates.filter(date => hasExerciseOnDate(date, exerciseEntries)).length / goodDates.length) * 100
    : 0;

  // Get top ingredient and symptom
  const ingredientFreq = new Map<string, number>();
  foodEntries.forEach(entry => {
    entry.ingredients.forEach(ing => {
      const normalized = ing.toLowerCase().trim();
      ingredientFreq.set(normalized, (ingredientFreq.get(normalized) || 0) + 1);
    });
  });

  let topIngredient = 'None';
  let maxFreq = 0;
  ingredientFreq.forEach((count, ingredient) => {
    if (count > maxFreq) {
      maxFreq = count;
      topIngredient = ingredient;
    }
  });

  const symptomFreq = new Map<string, number>();
  symptomEntries.forEach(entry => {
    symptomFreq.set(entry.symptom, (symptomFreq.get(entry.symptom) || 0) + 1);
  });

  let topSymptom = 'None';
  let maxSymptomFreq = 0;
  symptomFreq.forEach((count, symptom) => {
    if (count > maxSymptomFreq) {
      maxSymptomFreq = count;
      topSymptom = symptom;
    }
  });

  return {
    correlations,
    positiveCorrelations,
    allergyWarnings,
    symptomFreeDays: allDates.size - symptomDates.size,
    symptomDays: symptomDates.size,
    topIngredient,
    topSymptom,
    totalEntries: {
      food: foodEntries.length,
      symptoms: symptomEntries.length
    },
    contextualStats: {
      avgWaterOnSymptomDays,
      avgWaterOnGoodDays,
      avgSleepQualityOnSymptomDays,
      avgSleepQualityOnGoodDays,
      exerciseOnSymptomDays,
      exerciseOnGoodDays
    }
  };
}

// =============================================================================
// PHASE 3: BASIC PREDICTIVE ANALYSIS FOUNDATION
// =============================================================================

export interface SymptomPrediction {
  symptom: string;
  probability: number; // 0-100
  severity: 'mild' | 'moderate' | 'severe';
  expectedOnset: string; // e.g., "2-4 hours"
  confidence: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export interface MealPrediction {
  predictions: SymptomPrediction[];
  allergyWarnings: string[];
  positiveOutcomes: {
    improvement: string;
    probability: number;
  }[];
  overallRiskLevel: 'low' | 'medium' | 'high';
  recommendation: string;
}

// Predict symptoms for a planned meal based on historical correlations
export function predictMealOutcome(
  plannedIngredients: string[],
  correlations: Correlation[],
  positiveCorrelations: PositiveCorrelation[],
  knownAllergies: KnownAllergy[]
): MealPrediction {
  const predictions: SymptomPrediction[] = [];
  const allergyWarnings: string[] = [];
  const positiveOutcomes: { improvement: string; probability: number }[] = [];

  // Check for known allergies
  plannedIngredients.forEach(ingredient => {
    const allergyMatch = matchesKnownAllergy(ingredient, knownAllergies);
    if (allergyMatch) {
      allergyWarnings.push(
        `⚠️ ${allergyMatch.name} (${allergyMatch.severity}) - ${allergyMatch.symptoms?.join(', ') || 'See known symptoms'}`
      );
    }
  });

  // Predict negative outcomes (symptoms)
  const symptomMap = new Map<string, {
    maxProbability: number;
    avgDelay: string;
    confidence: 'low' | 'medium' | 'high';
    riskFactors: string[];
  }>();

  plannedIngredients.forEach(ingredient => {
    const normalized = ingredient.toLowerCase().trim();

    correlations.forEach(correlation => {
      if (correlation.ingredient === normalized) {
        if (!symptomMap.has(correlation.symptom)) {
          symptomMap.set(correlation.symptom, {
            maxProbability: 0,
            avgDelay: correlation.averageDelay,
            confidence: correlation.confidence,
            riskFactors: []
          });
        }

        const symptomData = symptomMap.get(correlation.symptom)!;
        symptomData.maxProbability = Math.max(symptomData.maxProbability, correlation.percentage);

        // Add contextual risk factors
        if (correlation.contextualFactors?.lowWater) {
          symptomData.riskFactors.push('Low water intake increases risk');
        }
        if (correlation.contextualFactors?.poorSleep) {
          symptomData.riskFactors.push('Poor sleep quality increases risk');
        }
        if (correlation.contextualFactors?.isKnownAllergy) {
          symptomData.riskFactors.push('⚠️ KNOWN ALLERGY');
        }
      }
    });
  });

  symptomMap.forEach((data, symptom) => {
    predictions.push({
      symptom,
      probability: Math.round(data.maxProbability),
      severity: data.maxProbability >= 70 ? 'severe' : data.maxProbability >= 50 ? 'moderate' : 'mild',
      expectedOnset: data.avgDelay,
      confidence: data.confidence,
      riskFactors: data.riskFactors
    });
  });

  // Predict positive outcomes
  plannedIngredients.forEach(ingredient => {
    const normalized = ingredient.toLowerCase().trim();

    positiveCorrelations.forEach(correlation => {
      if (correlation.ingredient === normalized && correlation.percentage >= 50) {
        positiveOutcomes.push({
          improvement: correlation.improvement,
          probability: Math.round(correlation.percentage)
        });
      }
    });
  });

  // Calculate overall risk level
  const maxRisk = predictions.length > 0
    ? Math.max(...predictions.map(p => p.probability))
    : 0;

  const overallRiskLevel: 'low' | 'medium' | 'high' =
    maxRisk >= 70 ? 'high' :
    maxRisk >= 50 ? 'medium' : 'low';

  // Generate recommendation
  let recommendation = '';
  if (allergyWarnings.length > 0) {
    recommendation = '🚨 AVOID: Contains known allergens!';
  } else if (overallRiskLevel === 'high') {
    recommendation = '⚠️ High risk of symptoms. Consider alternatives.';
  } else if (overallRiskLevel === 'medium') {
    recommendation = '⚡ Moderate risk. Monitor symptoms and ensure adequate water/sleep.';
  } else if (positiveOutcomes.length > 0) {
    recommendation = '✅ Good choice! May improve your wellness.';
  } else {
    recommendation = '✅ Low risk. Enjoy your meal!';
  }

  return {
    predictions: predictions.sort((a, b) => b.probability - a.probability),
    allergyWarnings,
    positiveOutcomes: positiveOutcomes.sort((a, b) => b.probability - a.probability),
    overallRiskLevel,
    recommendation
  };
}
