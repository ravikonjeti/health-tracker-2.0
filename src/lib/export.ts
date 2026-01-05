import { db } from './database';
import jsPDF from 'jspdf';
import { Correlation } from './analysis';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

// Export all data as JSON
export async function exportAllDataAsJSON(): Promise<void> {
  const data = {
    version: '2.0',
    exportDate: new Date().toISOString(),
    foodEntries: await db.foodEntries.toArray(),
    waterEntries: await db.waterEntries.toArray(),
    exerciseEntries: await db.exerciseEntries.toArray(),
    bowelEntries: await db.bowelEntries.toArray(),
    symptomEntries: await db.symptomEntries.toArray(),
    medications: await db.medications.toArray(),
    medicineEntries: await db.medicineEntries.toArray(),
    weightEntries: await db.weightEntries.toArray(),
    settings: await db.settings.toArray()
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  await shareOrDownload(blob, `health-tracker-backup-${formatDate(new Date())}.json`);
}

// Export food entries as CSV
export async function exportFoodAsCSV(): Promise<void> {
  const entries = await db.foodEntries.orderBy('date').toArray();
  const headers = ['Date', 'Time', 'Meal Type', 'Description', 'Ingredients', 'Portion', 'Notes'];

  const rows = entries.map(e => [
    e.date,
    e.time,
    e.type,
    e.description,
    e.ingredients.join('; '),
    e.portion || '',
    e.notes || ''
  ]);

  const csv = createCSV(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  await shareOrDownload(blob, `food-log-${formatDate(new Date())}.csv`);
}

// Export water entries as CSV
export async function exportWaterAsCSV(): Promise<void> {
  const entries = await db.waterEntries.orderBy('date').toArray();
  const headers = ['Date', 'Time', 'Amount (ml)'];

  const rows = entries.map(e => [e.date, e.time, e.amount.toString()]);

  const csv = createCSV(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  await shareOrDownload(blob, `water-log-${formatDate(new Date())}.csv`);
}

// Export exercise entries as CSV
export async function exportExerciseAsCSV(): Promise<void> {
  const entries = await db.exerciseEntries.orderBy('date').toArray();
  const headers = ['Date', 'Time', 'Type', 'Name', 'Duration (min)', 'Intensity', 'Notes'];

  const rows = entries.map(e => [
    e.date,
    e.time,
    e.type,
    e.name,
    e.duration.toString(),
    e.intensity,
    e.notes || ''
  ]);

  const csv = createCSV(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  await shareOrDownload(blob, `exercise-log-${formatDate(new Date())}.csv`);
}

// Export symptoms as CSV
export async function exportSymptomsAsCSV(): Promise<void> {
  const entries = await db.symptomEntries.orderBy('date').toArray();
  const headers = ['Date', 'Time', 'Symptom', 'Severity', 'Description', 'Triggers'];

  const rows = entries.map(e => [
    e.date,
    e.time,
    e.symptom,
    e.severity,
    e.description,
    e.triggers || ''
  ]);

  const csv = createCSV(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv' });
  await shareOrDownload(blob, `symptoms-log-${formatDate(new Date())}.csv`);
}

// Export unified CSV with all categories
export async function exportUnifiedCSV(): Promise<void> {
  // Fetch all entries
  const foodEntries = await db.foodEntries.toArray();
  const waterEntries = await db.waterEntries.toArray();
  const exerciseEntries = await db.exerciseEntries.toArray();
  const bowelEntries = await db.bowelEntries.toArray();
  const symptomEntries = await db.symptomEntries.toArray();
  const medicineEntries = await db.medicineEntries.toArray();
  const weightEntries = await db.weightEntries.toArray();

  // Create unified rows with category column
  const allRows: Array<[string, string, string, string]> = [];

  // Food entries
  foodEntries.forEach(e => {
    const details = `${e.type} | ${e.description}${e.portion ? ` | ${e.portion}` : ''}${e.ingredients.length > 0 ? ` | Ingredients: ${e.ingredients.join(', ')}` : ''}${e.notes ? ` | ${e.notes}` : ''}`;
    allRows.push([e.date, e.time, 'Food', details]);
  });

  // Water entries
  waterEntries.forEach(e => {
    allRows.push([e.date, e.time, 'Water', `${e.amount}ml`]);
  });

  // Exercise entries
  exerciseEntries.forEach(e => {
    const details = `${e.type} | ${e.name} | ${e.duration}min | ${e.intensity}${e.notes ? ` | ${e.notes}` : ''}`;
    allRows.push([e.date, e.time, 'Exercise', details]);
  });

  // Bowel entries
  bowelEntries.forEach(e => {
    const details = `Type ${e.type}${e.notes ? ` | ${e.notes}` : ''}`;
    allRows.push([e.date, e.time, 'Bowel', details]);
  });

  // Symptom entries
  symptomEntries.forEach(e => {
    const details = `${e.symptom} | ${e.severity} | ${e.description}${e.triggers ? ` | Triggers: ${e.triggers}` : ''}`;
    allRows.push([e.date, e.time, 'Symptom', details]);
  });

  // Medicine entries
  medicineEntries.forEach(e => {
    const details = `${e.medicationName} | ${e.dosage}${e.notes ? ` | ${e.notes}` : ''}`;
    allRows.push([e.date, e.time, 'Medicine', details]);
  });

  // Weight entries
  weightEntries.forEach(e => {
    const details = `${e.weight}${e.unit}${e.bodyFat ? ` | Body Fat: ${e.bodyFat}%` : ''}${e.water ? ` | Water: ${e.water}%` : ''}${e.muscleMass ? ` | Muscle: ${e.muscleMass}lbs` : ''}${e.bmi ? ` | BMI: ${e.bmi}` : ''}${e.boneMass ? ` | Bone: ${e.boneMass}${e.unit}` : ''}`;
    allRows.push([e.date, e.time, 'Weight', details]);
  });

  // Sort all rows by date and time (chronologically)
  allRows.sort((a, b) => {
    const dateCompare = a[0].localeCompare(b[0]);
    if (dateCompare !== 0) return dateCompare;
    return a[1].localeCompare(b[1]);
  });

  // Create CSV
  const headers = ['Date', 'Time', 'Category', 'Details'];
  const csv = createCSV(headers, allRows);
  const blob = new Blob([csv], { type: 'text/csv' });
  await shareOrDownload(blob, `health-tracker-unified-${formatDate(new Date())}.csv`);
}

// Export insights as PDF
export async function exportInsightsAsPDF(
  correlations: Correlation[],
  stats: any
): Promise<void> {
  const doc = new jsPDF();
  let y = 20;

  // Title
  doc.setFontSize(20);
  doc.text('Health Insights Report', 20, y);
  y += 10;

  // Date
  doc.setFontSize(12);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
  y += 15;

  // Correlations
  if (correlations.length > 0) {
    doc.setFontSize(16);
    doc.text('Food-Symptom Correlations', 20, y);
    y += 10;

    correlations.forEach((corr, i) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(12);
      doc.text(`${i + 1}. ${corr.ingredient} → ${corr.symptom}`, 25, y);
      y += 6;

      doc.setFontSize(10);
      doc.text(`   ${corr.percentage}% correlation (${corr.occurrences}/${corr.total} times)`, 25, y);
      y += 5;
      doc.text(`   Average delay: ${corr.averageDelay}`, 25, y);
      y += 10;
    });
  } else {
    doc.setFontSize(12);
    doc.text('No significant correlations found yet.', 20, y);
    y += 10;
  }

  // Statistics
  doc.addPage();
  y = 20;
  doc.setFontSize(16);
  doc.text('Summary Statistics', 20, y);
  y += 10;

  doc.setFontSize(12);
  doc.text(`Symptom-free days: ${stats.symptomFreeDays}`, 25, y);
  y += 8;
  doc.text(`Days with symptoms: ${stats.symptomDays}`, 25, y);
  y += 8;
  doc.text(`Most consumed ingredient: ${stats.topIngredient}`, 25, y);
  y += 8;
  doc.text(`Most common symptom: ${stats.topSymptom}`, 25, y);

  // Save PDF as blob for mobile sharing
  const pdfBlob = doc.output('blob');
  await shareOrDownload(pdfBlob, `health-insights-${formatDate(new Date())}.pdf`);
}

// Import data from JSON
export async function importDataFromJSON(file: File): Promise<boolean> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate structure
    if (!data.version || !data.foodEntries) {
      throw new Error('Invalid backup file format');
    }

    // Import all data (merge with existing)
    if (data.foodEntries) {
      await db.foodEntries.bulkAdd(data.foodEntries);
    }
    if (data.waterEntries) {
      await db.waterEntries.bulkAdd(data.waterEntries);
    }
    if (data.exerciseEntries) {
      await db.exerciseEntries.bulkAdd(data.exerciseEntries);
    }
    if (data.bowelEntries) {
      await db.bowelEntries.bulkAdd(data.bowelEntries);
    }
    if (data.symptomEntries) {
      await db.symptomEntries.bulkAdd(data.symptomEntries);
    }
    if (data.medications) {
      await db.medications.bulkAdd(data.medications);
    }
    if (data.medicineEntries) {
      await db.medicineEntries.bulkAdd(data.medicineEntries);
    }
    if (data.weightEntries) {
      await db.weightEntries.bulkAdd(data.weightEntries);
    }

    return true;
  } catch (error) {
    console.error('Import failed:', error);
    return false;
  }
}

// Native Share API for mobile or download fallback
async function shareOrDownload(blob: Blob, filename: string): Promise<void> {
  const isNativePlatform = Capacitor.isNativePlatform();

  if (isNativePlatform) {
    try {
      // Convert blob to base64
      const base64Data = await blobToBase64(blob);

      // Write file to cache directory
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      });

      // Share the file
      await Share.share({
        title: 'Health Tracker Export',
        text: 'My health tracking data',
        url: result.uri,
        dialogTitle: 'Share your data'
      });

      return;
    } catch (error) {
      console.error('Capacitor share failed:', error);
      // Fall through to browser download
    }
  }

  // Fallback to browser download for web
  downloadBlob(blob, filename);
}

// Legacy function - kept for compatibility
export async function shareData(blob: Blob, filename: string): Promise<boolean> {
  await shareOrDownload(blob, filename);
  return true;
}

// Helper functions
function createCSV(headers: string[], rows: string[][]): string {
  const escape = (cell: string) => `"${cell.replace(/"/g, '""')}"`;
  const headerRow = headers.map(escape).join(',');
  const dataRows = rows.map(row => row.map(escape).join(',')).join('\n');
  return `${headerRow}\n${dataRows}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/json;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
