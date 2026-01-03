import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { AlertTriangle, Activity, BarChart3, Clock, Download } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { analyzeCorrelations, generateAnalysisSummary, generateTimelineData, Correlation } from '../lib/analysis';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { exportInsightsAsPDF } from '../lib/export';
import { subDays } from 'date-fns';

export function InsightsTracker() {
  const { foodEntries, symptomEntries } = useHealthData();
  const [dateRange, setDateRange] = useState('30');
  const [timeWindow, setTimeWindow] = useState(6);
  const [correlations, setCorrelations] = useState<Correlation[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);

  useEffect(() => {
    analyzeData();
  }, [foodEntries, symptomEntries, dateRange, timeWindow]);

  const analyzeData = () => {
    // Filter entries by date range
    const cutoffDate = dateRange === 'all'
      ? new Date(0)
      : subDays(new Date(), parseInt(dateRange));

    const filteredFood = foodEntries.filter(e => new Date(e.date) >= cutoffDate);
    const filteredSymptoms = symptomEntries.filter(e => new Date(e.date) >= cutoffDate);

    // Run analysis
    const foundCorrelations = analyzeCorrelations(filteredFood, filteredSymptoms, timeWindow);
    const summary = generateAnalysisSummary(filteredFood, filteredSymptoms, foundCorrelations);
    const timeline = generateTimelineData(filteredFood, filteredSymptoms);

    setCorrelations(foundCorrelations);
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
