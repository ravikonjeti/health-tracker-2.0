import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { AlertTriangle, Activity, BarChart3, Clock, Download, Smile, TrendingUp, Droplets, Moon, Dumbbell, Shield } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import {
  analyzeEnhancedCorrelations,
  analyzePositiveCorrelations,
  detectAllergyWarnings,
  generateEnhancedAnalysisSummary,
  generateTimelineData,
  predictMealOutcome,
  Correlation,
  PositiveCorrelation,
  AllergyWarning,
  MealPrediction
} from '../lib/analysis';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportInsightsAsPDF } from '../lib/export';
import { subDays } from 'date-fns';

export function InsightsTracker() {
  const {
    foodEntries,
    symptomEntries,
    waterEntries,
    sleepEntries,
    exerciseEntries,
    medicationLogs,
    wellnessFeelings,
    knownAllergies
  } = useHealthData();
  const [dateRange, setDateRange] = useState('30');
  const [timeWindow, setTimeWindow] = useState(6);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [positiveCorrelations, setPositiveCorrelations] = useState<PositiveCorrelation[]>([]);
  const [allergyWarnings, setAllergyWarnings] = useState<AllergyWarning[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [mealPrediction, setMealPrediction] = useState<MealPrediction | null>(null);
  const [predictIngredients, setPredictIngredients] = useState('');

  useEffect(() => {
    analyzeData();
  }, [foodEntries, symptomEntries, waterEntries, sleepEntries, exerciseEntries, medicationLogs, wellnessFeelings, knownAllergies, dateRange, timeWindow]);

  const analyzeData = () => {
    // Filter entries by date range
    const cutoffDate = dateRange === 'all'
      ? new Date(0)
      : subDays(new Date(), parseInt(dateRange));

    const filteredFood = foodEntries.filter(e => new Date(e.date) >= cutoffDate);
    const filteredSymptoms = symptomEntries.filter(e => new Date(e.date) >= cutoffDate);
    const filteredWater = waterEntries.filter(e => new Date(e.date) >= cutoffDate);
    const filteredSleep = sleepEntries.filter(e => new Date(e.date) >= cutoffDate);
    const filteredExercise = exerciseEntries.filter(e => new Date(e.date) >= cutoffDate);
    const filteredMedications = medicationLogs.filter(e => new Date(e.date) >= cutoffDate);
    const filteredWellness = wellnessFeelings.filter(e => new Date(e.date) >= cutoffDate);

    // Prepare enhanced analysis input
    const analysisInput = {
      foodEntries: filteredFood,
      symptomEntries: filteredSymptoms,
      waterEntries: filteredWater,
      sleepEntries: filteredSleep,
      exerciseEntries: filteredExercise,
      medicationLogs: filteredMedications,
      wellnessFeelings: filteredWellness,
      knownAllergies
    };

    // Run enhanced analysis
    const foundCorrelations = analyzeEnhancedCorrelations(analysisInput, timeWindow);
    const foundPositiveCorrelations = analyzePositiveCorrelations(analysisInput, timeWindow);
    const warnings = detectAllergyWarnings(filteredFood, knownAllergies, 7);
    const summary = generateEnhancedAnalysisSummary(analysisInput, foundCorrelations, foundPositiveCorrelations, warnings);
    const timeline = generateTimelineData(filteredFood, filteredSymptoms);

    setCorrelations(foundCorrelations);
    setPositiveCorrelations(foundPositiveCorrelations);
    setAllergyWarnings(warnings);
    setStats(summary);
    setTimelineData(timeline);
  };

  const getCorrelationColor = (percentage: number) => {
    if (percentage >= 70) return '#ef4444';
    if (percentage >= 50) return '#f59e0b';
    return '#10b981';
  };

  const getPercentageBadgeColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-red-100 text-red-800 border-red-300';
    if (percentage >= 50) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getConfidenceBadge = (confidence: string) => {
    const colors = {
      high: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[confidence as keyof typeof colors] || colors.low;
  };

  const handlePredictMeal = () => {
    if (predictIngredients.trim()) {
      const ingredients = predictIngredients.split(',').map(i => i.trim()).filter(i => i);
      const prediction = predictMealOutcome(ingredients, correlations, positiveCorrelations, knownAllergies);
      setMealPrediction(prediction);
    }
  };

  const handleExportPDF = async () => {
    if (stats) {
      await exportInsightsAsPDF(correlations, stats);
    }
  };

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading analysis...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Health Insights & Patterns</CardTitle>
          <p className="text-sm text-muted-foreground">
            Discover correlations between your food intake and health symptoms
          </p>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="date-range">Analysis Period</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Label htmlFor="time-window">Time Window</Label>
              <Select value={timeWindow.toString()} onValueChange={(v) => setTimeWindow(parseInt(v))}>
                <SelectTrigger id="time-window">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Allergy Warnings */}
      {allergyWarnings.length > 0 && (
        <Card className="border-red-500 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              ⚠️ Allergy Warnings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {allergyWarnings.map((warning, index) => (
              <Card key={index} className="bg-red-50 border-red-300">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-800 mb-1 capitalize">
                        {warning.allergyName}
                      </h4>
                      <p className="text-sm text-red-700 mb-2">
                        Found in: <strong>{warning.foundIn.join(', ')}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {warning.recommendedAction}
                      </p>
                    </div>
                    <Badge className="bg-red-600 text-white">
                      {warning.severity}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Meal Prediction Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Meal Prediction Tool
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter ingredients to predict potential outcomes
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="e.g., chicken, rice, tomatoes (comma-separated)"
              value={predictIngredients}
              onChange={(e) => setPredictIngredients(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePredictMeal();
                }
              }}
            />
            <Button onClick={handlePredictMeal}>
              Predict
            </Button>
          </div>

          {mealPrediction && (
            <Card className="mt-4">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Overall Risk Level</h4>
                    <Badge className={
                      mealPrediction.overallRiskLevel === 'high' ? 'bg-red-500 text-white' :
                      mealPrediction.overallRiskLevel === 'medium' ? 'bg-orange-500 text-white' :
                      'bg-green-500 text-white'
                    }>
                      {mealPrediction.overallRiskLevel}
                    </Badge>
                  </div>

                  <p className="text-sm font-medium">{mealPrediction.recommendation}</p>

                  {mealPrediction.allergyWarnings.length > 0 && (
                    <div className="bg-red-50 p-3 rounded border border-red-300">
                      <p className="font-semibold text-red-800 mb-1">⚠️ Allergen Alert:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {mealPrediction.allergyWarnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {mealPrediction.predictions.length > 0 && (
                    <div>
                      <p className="font-semibold mb-2">Potential Symptoms:</p>
                      <div className="space-y-2">
                        {mealPrediction.predictions.map((pred, idx) => (
                          <div key={idx} className="bg-orange-50 p-2 rounded border border-orange-300">
                            <div className="flex items-center justify-between">
                              <span className="capitalize font-medium">{pred.symptom}</span>
                              <Badge className="bg-orange-500 text-white">
                                {pred.probability}% chance
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Expected onset: {pred.expectedOnset} | Severity: {pred.severity}
                            </p>
                            {pred.riskFactors.length > 0 && (
                              <p className="text-xs mt-1">Risk factors: {pred.riskFactors.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {mealPrediction.positiveOutcomes.length > 0 && (
                    <div>
                      <p className="font-semibold mb-2">✨ Potential Benefits:</p>
                      <div className="space-y-1">
                        {mealPrediction.positiveOutcomes.map((outcome, idx) => (
                          <div key={idx} className="bg-green-50 p-2 rounded border border-green-300">
                            <div className="flex items-center justify-between">
                              <span className="capitalize">{outcome.improvement.replace('_', ' ')}</span>
                              <Badge className="bg-green-500 text-white">
                                {outcome.probability}%
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Positive Correlations */}
      {positiveCorrelations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smile className="h-5 w-5 text-green-500" />
              Foods That Make You Feel Better
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {positiveCorrelations.map((correlation) => (
              <Card
                key={correlation.id}
                className="border-l-4 border-l-green-500"
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 capitalize">
                        {correlation.ingredient} → {correlation.improvement.replace('_', ' ')}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong className="capitalize">{correlation.ingredient}</strong> appeared in{' '}
                        <strong>{correlation.occurrences}</strong> out of <strong>{correlation.total}</strong> times
                        within {correlation.timeWindow} before feeling better
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      {correlation.percentage}%
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Avg delay: {correlation.averageDelay}
                    </div>
                    <Badge className={getConfidenceBadge(correlation.confidence)} variant="outline">
                      {correlation.confidence} confidence
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Contextual Statistics */}
      {stats?.contextualStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Lifestyle Impact Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <div className="text-sm font-semibold text-muted-foreground mb-1">Water Intake</div>
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(stats.contextualStats.avgWaterOnSymptomDays)}ml
                </div>
                <div className="text-xs text-muted-foreground">on symptom days</div>
                <div className="text-lg font-bold text-green-600 mt-2">
                  {Math.round(stats.contextualStats.avgWaterOnGoodDays)}ml
                </div>
                <div className="text-xs text-muted-foreground">on good days</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <Moon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <div className="text-sm font-semibold text-muted-foreground mb-1">Sleep Quality</div>
                <div className="text-lg font-bold text-purple-600">
                  {stats.contextualStats.avgSleepQualityOnSymptomDays.toFixed(1)}/5
                </div>
                <div className="text-xs text-muted-foreground">on symptom days</div>
                <div className="text-lg font-bold text-green-600 mt-2">
                  {stats.contextualStats.avgSleepQualityOnGoodDays.toFixed(1)}/5
                </div>
                <div className="text-xs text-muted-foreground">on good days</div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <Dumbbell className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <div className="text-sm font-semibold text-muted-foreground mb-1">Exercise</div>
                <div className="text-lg font-bold text-orange-600">
                  {Math.round(stats.contextualStats.exerciseOnSymptomDays)}%
                </div>
                <div className="text-xs text-muted-foreground">on symptom days</div>
                <div className="text-lg font-bold text-green-600 mt-2">
                  {Math.round(stats.contextualStats.exerciseOnGoodDays)}%
                </div>
                <div className="text-xs text-muted-foreground">on good days</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Food Trigger Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Food Trigger Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {correlations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">Not enough data to identify patterns yet.</p>
              <p className="text-sm">
                Keep logging your meals and symptoms for at least 2 weeks to see correlations.
              </p>
            </div>
          ) : (
            correlations.map((correlation) => (
              <Card
                key={correlation.id}
                className="border-l-4"
                style={{ borderLeftColor: getCorrelationColor(correlation.percentage) }}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1 capitalize">
                        {correlation.ingredient} → {correlation.symptom}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong className="capitalize">{correlation.ingredient}</strong> appeared in{' '}
                        <strong>{correlation.occurrences}</strong> out of <strong>{correlation.total}</strong> times
                        within {correlation.timeWindow} before experiencing {correlation.symptom}
                      </p>
                    </div>
                    <Badge className={getPercentageBadgeColor(correlation.percentage)}>
                      {correlation.percentage}%
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Avg delay: {correlation.averageDelay}
                    </div>
                    <Badge className={getConfidenceBadge(correlation.confidence)} variant="outline">
                      {correlation.confidence} confidence
                    </Badge>
                  </div>

                  {correlation.contextualFactors && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold mb-2">Context & Risk Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {correlation.contextualFactors.isKnownAllergy && (
                          <Badge className="bg-red-600 text-white text-xs">
                            <Shield className="h-3 w-3 mr-1" />
                            Known Allergy
                          </Badge>
                        )}
                        {correlation.contextualFactors.lowWater && (
                          <Badge variant="outline" className="text-xs">
                            <Droplets className="h-3 w-3 mr-1" />
                            Low water
                          </Badge>
                        )}
                        {correlation.contextualFactors.poorSleep && (
                          <Badge variant="outline" className="text-xs">
                            <Moon className="h-3 w-3 mr-1" />
                            Poor sleep
                          </Badge>
                        )}
                        {correlation.contextualFactors.noExercise && (
                          <Badge variant="outline" className="text-xs">
                            <Dumbbell className="h-3 w-3 mr-1" />
                            No exercise
                          </Badge>
                        )}
                        {correlation.contextualFactors.onMedication.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            On medication
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {correlation.protectiveFactors && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold mb-2 text-green-700">Protective Factors Present:</p>
                      <div className="flex flex-wrap gap-1">
                        {correlation.protectiveFactors.adequateWater && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Droplets className="h-3 w-3 mr-1" />
                            Adequate water
                          </Badge>
                        )}
                        {correlation.protectiveFactors.goodSleep && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Moon className="h-3 w-3 mr-1" />
                            Good sleep
                          </Badge>
                        )}
                        {correlation.protectiveFactors.regularExercise && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Dumbbell className="h-3 w-3 mr-1" />
                            Regular exercise
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Timeline Visualization */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Timeline View
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tickFormatter={(timestamp) => new Date(timestamp).toLocaleDateString()}
                  label={{ value: 'Date', position: 'insideBottom', offset: -10 }}
                />
                <YAxis
                  dataKey="time"
                  label={{ value: 'Time of Day', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload || !payload.length) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-2 border rounded shadow-lg">
                        <p className="font-semibold">{data.type === 'food' ? '🍽️ Food' : '⚠️ Symptom'}</p>
                        <p className="text-sm">{data.description}</p>
                        <p className="text-xs text-muted-foreground">{data.date} at {data.time}</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                <Scatter
                  name="Food Intake"
                  data={timelineData.filter(d => d.type === 'food')}
                  fill="#8884d8"
                />
                <Scatter
                  name="Symptoms"
                  data={timelineData.filter(d => d.type === 'symptom')}
                  fill="#ff4444"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Summary Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600">{stats.symptomFreeDays}</div>
              <div className="text-sm text-muted-foreground">Symptom-free days</div>
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600">{stats.symptomDays}</div>
              <div className="text-sm text-muted-foreground">Days with symptoms</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600 capitalize">{stats.topIngredient}</div>
              <div className="text-sm text-muted-foreground">Most consumed</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{stats.topSymptom}</div>
              <div className="text-sm text-muted-foreground">Most common symptom</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>Export Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportPDF} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export as PDF Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
