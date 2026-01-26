import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Input } from './ui/input';
import {
  User, Download, Upload, Database, Activity,
  CheckCircle2, XCircle, ExternalLink, Trash2, RefreshCw
} from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { exportAllDataAsJSON, exportUnifiedCSV, importDataFromJSON } from '../lib/export';
import {
  FitbitConnection,
  loadFitbitConnection,
  saveFitbitConnection,
  clearFitbitConnection,
  getFitbitAuthUrl,
  parseFitbitCallback,
  fetchFitbitProfile,
  fetchFitbitActivity,
  fetchFitbitSleep,
  fetchFitbitWeight,
  fetchFitbitWater
} from '../lib/fitbit';
import { App as CapacitorApp } from '@capacitor/app';

// Helper to format date as YYYY-MM-DD in local timezone
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ProfilePage() {
  const {
    foodEntries, waterEntries, exerciseEntries, stepEntries,
    bowelEntries, symptomEntries, wellnessFeelings, medications,
    medicationLogs, weightEntries, sleepEntries, recipes,
    addStepEntry, addSleepEntry, addWeightEntry, addWaterEntry,
    updateStepEntry, updateSleepEntry, updateWeightEntry, updateWaterEntry
  } = useHealthData();

  const [fitbitConnection, setFitbitConnection] = useState<FitbitConnection>({
    isConnected: false
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Check for OAuth callback on mount and listen for deep links
  useEffect(() => {
    // Check for existing connection
    const savedFitbitConnection = loadFitbitConnection();
    setFitbitConnection(savedFitbitConnection);

    // Handle Fitbit OAuth callback
    const processFitbitCallback = async (url: string) => {
      console.log('Processing URL:', url);

      // Parse Fitbit OAuth callback from deep link
      // URL format: healthtracker://oauth#access_token=...&user_id=...
      if (url.startsWith('healthtracker://oauth#') || url.includes('#access_token=')) {
        console.log('Detected Fitbit OAuth callback');
        const hashPart = url.split('#')[1];
        if (hashPart) {
          console.log('Hash part:', hashPart);
          const result = parseFitbitCallback('#' + hashPart);

          if (result) {
            console.log('Parsed OAuth result:', result);
            const connection: FitbitConnection = {
              isConnected: true,
              accessToken: result.accessToken,
              userId: result.userId
            };

            // Fetch user profile
            try {
              const profile = await fetchFitbitProfile(result.accessToken);
              if (profile) {
                connection.displayName = profile.displayName;
              }
              setFitbitConnection(connection);
              saveFitbitConnection(connection);
              setSyncStatus('success');
              setSyncMessage('Successfully connected to Fitbit!');
              console.log('Fitbit connected successfully');
            } catch (error) {
              console.error('Error fetching Fitbit profile:', error);
              setSyncStatus('error');
              setSyncMessage('Connected but failed to fetch profile. You can still sync data.');
              setFitbitConnection(connection);
              saveFitbitConnection(connection);
            }
          } else {
            console.error('Failed to parse OAuth callback');
          }
        }
      }
    };

    // Check if app was launched with a deep link (initial URL)
    CapacitorApp.getLaunchUrl().then(launchUrl => {
      if (launchUrl?.url) {
        console.log('Launch URL detected:', launchUrl.url);
        processFitbitCallback(launchUrl.url);
      }
    });

    // Listen for deep link events (OAuth callback when app is already running)
    const listener = CapacitorApp.addListener('appUrlOpen', (event: { url: string }) => {
      console.log('Deep link event:', event.url);
      processFitbitCallback(event.url);
    });

    // Cleanup
    return () => {
      listener.remove();
    };
  }, []);

  // Fitbit OAuth Connection
  const connectToFitbit = () => {
    // Use custom URL scheme for deep linking
    const redirectUri = 'healthtracker://oauth';
    const authUrl = getFitbitAuthUrl(redirectUri);
    window.location.href = authUrl;
  };

  const disconnectFromFitbit = () => {
    setFitbitConnection({ isConnected: false });
    clearFitbitConnection();
    setSyncStatus(null);
    setLastSyncTime(null);
    setSyncMessage('');
  };

  // Sync Fitbit Data
  const syncFitbitData = async () => {
    if (!fitbitConnection.isConnected || !fitbitConnection.accessToken) {
      return;
    }

    setIsSyncing(true);
    setSyncStatus(null);
    setSyncMessage('');

    try {
      const today = formatDateLocal(new Date());
      const token = fitbitConnection.accessToken;
      let synced = 0;

      // Fetch all data in parallel
      const [activityData, sleepData, weightData, waterData] = await Promise.all([
        fetchFitbitActivity(token, today),
        fetchFitbitSleep(token, today),
        fetchFitbitWeight(token, today),
        fetchFitbitWater(token, today)
      ]);

      // Import steps if available
      if (activityData && activityData.steps > 0) {
        const existingStep = stepEntries.find(e => e.date === today);
        if (existingStep) {
          await updateStepEntry(existingStep.id!, { steps: activityData.steps });
        } else {
          await addStepEntry({ date: today, steps: activityData.steps });
        }
        synced++;
      }

      // Import sleep if available
      if (sleepData && sleepData.startTime && sleepData.endTime) {
        const existingSleep = sleepEntries.find(e => e.date === today);
        const sleepEntry = {
          bedTime: sleepData.startTime,
          wakeTime: sleepData.endTime,
          sleepQuality: Math.min(5, Math.max(1, Math.round(sleepData.efficiency / 20))) as 1 | 2 | 3 | 4 | 5,
          mood: 'okay' as const,
          notes: `Imported from Fitbit: ${sleepData.minutesAsleep} min asleep, ${sleepData.efficiency}% efficiency`
        };

        if (existingSleep) {
          await updateSleepEntry(existingSleep.id!, sleepEntry);
        } else {
          await addSleepEntry({ date: today, ...sleepEntry });
        }
        synced++;
      }

      // Import weight if available
      if (weightData && weightData.weight > 0) {
        const existingWeight = weightEntries.find(e => e.date === today);
        const weightEntry = {
          time: new Date().toTimeString().slice(0, 5),
          weight: weightData.weight,
          unit: 'lbs' as const,
          bmi: weightData.bmi,
          bodyFat: weightData.fat,
          notes: 'Imported from Fitbit'
        };

        if (existingWeight) {
          await updateWeightEntry(existingWeight.id!, weightEntry);
        } else {
          await addWeightEntry({ date: today, ...weightEntry });
        }
        synced++;
      }

      // Import water if available
      if (waterData && waterData.water > 0) {
        const existingWater = waterEntries.find(e => e.date === today);
        const waterEntry = {
          time: new Date().toTimeString().slice(0, 5),
          amount: waterData.water
        };

        if (existingWater) {
          await updateWaterEntry(existingWater.id!, waterEntry);
        } else {
          await addWaterEntry({ date: today, ...waterEntry });
        }
        synced++;
      }

      setLastSyncTime(new Date());

      if (synced > 0) {
        setSyncStatus('success');
        const types = [];
        if (activityData && activityData.steps > 0) types.push('steps');
        if (sleepData && sleepData.startTime) types.push('sleep');
        if (weightData && weightData.weight > 0) types.push('weight');
        if (waterData && waterData.water > 0) types.push('water');
        setSyncMessage(`Successfully synced ${types.join(', ')} from Fitbit (${synced} ${synced === 1 ? 'entry' : 'entries'})`);
      } else {
        setSyncStatus('error');
        setSyncMessage('No data from Fitbit for today. Make sure your Fitbit device has synced.');
      }
    } catch (error) {
      console.error('Fitbit sync error:', error);
      setSyncStatus('error');
      setSyncMessage('Failed to sync data. Please try again or reconnect.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Export/Import handlers
  const handleExportJSON = async () => {
    await exportAllDataAsJSON();
  };

  const handleExportCSV = async () => {
    await exportUnifiedCSV();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const success = await importDataFromJSON(file);
    if (success) {
      alert('Data imported successfully!');
    } else {
      alert('Failed to import data. Please check the file format.');
    }

    // Reset input
    event.target.value = '';
  };

  const handleClearAllData = async () => {
    if (!window.confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
      return;
    }

    if (!window.confirm('FINAL WARNING: This will permanently delete all your health data. Continue?')) {
      return;
    }

    try {
      const { db } = await import('../lib/database');
      await db.foodEntries.clear();
      await db.recipes.clear();
      await db.waterEntries.clear();
      await db.exerciseEntries.clear();
      await db.stepEntries.clear();
      await db.bowelEntries.clear();
      await db.symptomEntries.clear();
      await db.wellnessFeelings.clear();
      await db.medications.clear();
      await db.medicationLogs.clear();
      await db.weightEntries.clear();
      await db.sleepEntries.clear();

      alert('All data has been cleared.');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data. Please try again.');
    }
  };

  // Calculate total entries
  const totalEntries =
    foodEntries.length +
    waterEntries.length +
    exerciseEntries.length +
    stepEntries.length +
    bowelEntries.length +
    symptomEntries.length +
    wellnessFeelings.length +
    medicationLogs.length +
    weightEntries.length +
    sleepEntries.length +
    recipes.length;

  return (
    <div className="space-y-6 pb-8">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Profile & Settings</CardTitle>
              <CardDescription>
                Manage your data and third-party integrations
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Total Entries</div>
              <div className="text-2xl font-bold">{totalEntries}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Recipes Saved</div>
              <div className="text-2xl font-bold">{recipes.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export, import, or clear your health data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={handleExportJSON}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
            <Button
              onClick={handleExportCSV}
              variant="outline"
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          <div>
            <Input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Import data from a previous JSON backup
            </p>
          </div>

          <Button
            onClick={handleClearAllData}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Data
          </Button>
        </CardContent>
      </Card>

      {/* Third-Party Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Third-Party Integrations
          </CardTitle>
          <CardDescription>
            Connect your fitness devices and apps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Fitbit Integration */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold">Fitbit</div>
                  <div className="text-sm text-muted-foreground">
                    Sync steps, sleep, weight, and water
                  </div>
                </div>
              </div>

              {fitbitConnection.isConnected ? (
                <Badge variant="default" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Not Connected
                </Badge>
              )}
            </div>

            {fitbitConnection.isConnected && fitbitConnection.displayName && (
              <div className="text-sm text-muted-foreground mb-3">
                Connected as: <span className="font-medium">{fitbitConnection.displayName}</span>
              </div>
            )}

            {syncMessage && (
              <Alert variant={syncStatus === 'success' ? 'default' : 'destructive'} className="mb-3">
                <AlertDescription>{syncMessage}</AlertDescription>
              </Alert>
            )}

            {lastSyncTime && (
              <div className="text-xs text-muted-foreground mb-3">
                Last synced: {lastSyncTime.toLocaleString()}
              </div>
            )}

            <div className="flex gap-2">
              {fitbitConnection.isConnected ? (
                <>
                  <Button
                    onClick={syncFitbitData}
                    disabled={isSyncing}
                    className="flex-1"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <Button
                    onClick={disconnectFromFitbit}
                    variant="outline"
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  onClick={connectToFitbit}
                  className="w-full"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect Fitbit
                </Button>
              )}
            </div>
          </div>

          {/* Coming Soon Integrations */}
          <div className="border rounded-lg p-4 opacity-50">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <div className="font-semibold">More Integrations</div>
                <div className="text-sm text-muted-foreground">
                  Coming soon: Apple Health, Google Fit, and more
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
