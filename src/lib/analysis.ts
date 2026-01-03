import { FoodEntry, SymptomEntry } from './database';
import { differenceInMinutes, parseISO } from 'date-fns';

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
}

export interface AnalysisResult {
  correlations: Correlation[];
  symptomFreeDays: number;
  symptomDays: number;
  topIngredient: string;
  topSymptom: string;
  totalEntries: {
    food: number;
    symptoms: number;
  };
}

// Helper: Parse date+time to Date object
function parseDateTime(date: string, time: string): Date {
  return parseISO(`${date}T${time}:00`);
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
