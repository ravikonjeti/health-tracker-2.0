import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, Trash2, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil, Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { WeightEntry } from '../lib/database';

export function WeightTracker() {
  const { weightEntries, weightUnit, setWeightUnit, addWeightEntry, updateWeightEntry, deleteWeightEntry } = useHealthData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newEntry, setNewEntry] = useState({
    weight: '',
    time: '',
    bodyFat: '',
    water: '',
    muscleMass: '',
    boneMass: '',
    bmi: ''
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getDateDisplay = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dateStr = formatDate(date);
    const todayStr = formatDate(today);
    const yesterdayStr = formatDate(yesterday);
    const tomorrowStr = formatDate(tomorrow);

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getEntriesForDate = (date: Date): WeightEntry[] => {
    const dateStr = formatDate(date);
    return weightEntries
      .filter(entry => entry.date === dateStr)
      .sort((a, b) => b.time.localeCompare(a.time));
  };

  const currentDateEntries = getEntriesForDate(selectedDate);
  const latestEntry = currentDateEntries[0];

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const addEntry = async () => {
    if (newEntry.weight && newEntry.time) {
      const entryData = {
        weight: parseFloat(newEntry.weight),
        unit: weightUnit,
        time: newEntry.time,
        date: formatDate(selectedDate),
        bodyFat: newEntry.bodyFat ? parseFloat(newEntry.bodyFat) : undefined,
        water: newEntry.water ? parseFloat(newEntry.water) : undefined,
        muscleMass: newEntry.muscleMass ? parseFloat(newEntry.muscleMass) : undefined,
        boneMass: newEntry.boneMass ? parseFloat(newEntry.boneMass) : undefined,
        bmi: newEntry.bmi ? parseFloat(newEntry.bmi) : undefined
      };

      if (editingId) {
        await updateWeightEntry(editingId, entryData);
        setEditingId(null);
      } else {
        await addWeightEntry(entryData);
      }
      setNewEntry({
        weight: '',
        time: '',
        bodyFat: '',
        water: '',
        muscleMass: '',
        boneMass: '',
        bmi: ''
      });
      setShowAdvanced(false);
    }
  };

  const removeEntry = async (id: string) => {
    await deleteWeightEntry(id);
    if (editingId === id) {
      setEditingId(null);
      setNewEntry({
        weight: '',
        time: '',
        bodyFat: '',
        water: '',
        muscleMass: '',
        boneMass: '',
        bmi: ''
      });
    }
  };

  const startEditing = async (entry: WeightEntry) => {
    if (entry.id) {
      setEditingId(entry.id);
      await setWeightUnit(entry.unit);
      setNewEntry({
        weight: entry.weight.toString(),
        time: entry.time,
        bodyFat: entry.bodyFat?.toString() || '',
        water: entry.water?.toString() || '',
        muscleMass: entry.muscleMass?.toString() || '',
        boneMass: entry.boneMass?.toString() || '',
        bmi: entry.bmi?.toString() || ''
      });
      if (entry.bodyFat || entry.water || entry.muscleMass || entry.boneMass || entry.bmi) {
        setShowAdvanced(true);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewEntry({
      weight: '',
      time: '',
      bodyFat: '',
      water: '',
      muscleMass: '',
      boneMass: '',
      bmi: ''
    });
    setShowAdvanced(false);
  };

  const toggleUnit = async () => {
    const newUnit = weightUnit === 'kg' ? 'lb' : 'kg';
    await setWeightUnit(newUnit);
  };

  // Get weight trend
  const getWeightTrend = (): { change: number; direction: 'up' | 'down' | 'stable' } | null => {
    if (weightEntries.length < 2) return null;

    const sortedEntries = [...weightEntries].sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    const latest = sortedEntries[sortedEntries.length - 1];
    const previous = sortedEntries[sortedEntries.length - 2];

    // Convert to same unit for comparison
    let latestWeight = latest.weight;
    let previousWeight = previous.weight;

    if (latest.unit !== previous.unit) {
      if (previous.unit === 'lb') {
        previousWeight = previousWeight * 0.453592; // Convert lb to kg
      } else {
        previousWeight = previousWeight / 0.453592; // Convert kg to lb
      }
    }

    const change = latestWeight - previousWeight;
    const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

    return { change: Math.abs(change), direction };
  };

  const trend = getWeightTrend();

  return (
    <div className="space-y-4">
      {/* Date Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="default"
              size="default"
              onClick={() => navigateDate('prev')}
              className="h-10 px-3 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="hidden sm:inline">Prev</span>
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 flex-1 min-w-0">
                  <CalendarIcon className="h-4 w-4 mr-2 shrink-0 text-black" />
                  <span className="truncate">{getDateDisplay(selectedDate)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="default"
              size="default"
              onClick={() => navigateDate('next')}
              className="h-10 px-3 bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Current Weight Display - Circular Design */}
      {latestEntry && (
        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col items-center">
              {/* Circular Weight Display */}
              <div className="relative w-48 h-48 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Background circle */}
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#d1fae5"
                    strokeWidth="8"
                    strokeDasharray="8 4"
                  />
                  {/* Decorative dots */}
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30 * Math.PI) / 180;
                    const x = 96 + 88 * Math.cos(angle);
                    const y = 96 + 88 * Math.sin(angle);
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="3"
                        fill="#10b981"
                        opacity="0.5"
                      />
                    );
                  })}
                </svg>
                
                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl mb-1">
                    {latestEntry.weight}
                  </div>
                  <div className="text-lg text-muted-foreground">
                    {latestEntry.unit}
                  </div>
                  {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${
                      trend.direction === 'up' ? 'text-orange-600' : 
                      trend.direction === 'down' ? 'text-green-600' : 
                      'text-gray-600'
                    }`}>
                      {trend.direction === 'up' && <TrendingUp className="h-4 w-4" />}
                      {trend.direction === 'down' && <TrendingDown className="h-4 w-4" />}
                      {trend.direction === 'stable' && <Minus className="h-4 w-4" />}
                      <span>{trend.change.toFixed(1)} {latestEntry.unit}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date and Time */}
              <p className="text-sm text-muted-foreground mb-3">
                {getDateDisplay(selectedDate)} at {latestEntry.time}
              </p>

              {/* Body Metrics Grid */}
              {(latestEntry.bodyFat || latestEntry.water || latestEntry.muscleMass || latestEntry.boneMass || latestEntry.bmi) && (
                <div className="w-full grid grid-cols-3 gap-3 mt-4">
                  {latestEntry.water !== undefined && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg text-blue-600">{latestEntry.water}</div>
                      <div className="text-xs text-muted-foreground">Water %</div>
                    </div>
                  )}
                  {latestEntry.bodyFat !== undefined && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg text-orange-600">{latestEntry.bodyFat}</div>
                      <div className="text-xs text-muted-foreground">Body Fat %</div>
                    </div>
                  )}
                  {latestEntry.muscleMass !== undefined && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg text-purple-600">{latestEntry.muscleMass}</div>
                      <div className="text-xs text-muted-foreground">Muscle lbs</div>
                    </div>
                  )}
                  {latestEntry.bmi !== undefined && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg text-green-600">{latestEntry.bmi}</div>
                      <div className="text-xs text-muted-foreground">BMI</div>
                    </div>
                  )}
                  {latestEntry.boneMass !== undefined && (
                    <div className="bg-white rounded-lg p-3 text-center">
                      <div className="text-lg text-gray-600">{latestEntry.boneMass}</div>
                      <div className="text-xs text-muted-foreground">Bone {latestEntry.unit}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Weight Entry Form */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? 'Edit Weight Entry' : 'Add Weight Entry'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={newEntry.weight}
                onChange={(e) => setNewEntry({ ...newEntry, weight: e.target.value })}
                placeholder="0.0"
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Button
                id="unit"
                type="button"
                variant="outline"
                onClick={toggleUnit}
                className="w-full h-10"
              >
                {weightUnit === 'kg' ? 'KG' : 'LB'}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="time">Time</Label>
            <div className="flex gap-2">
              <Input
                id="time"
                type="time"
                value={newEntry.time}
                onChange={(e) => setNewEntry({ ...newEntry, time: e.target.value })}
                className="flex-1"
              />
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={() => setNewEntry({ ...newEntry, time: getCurrentTime() })}
                className="px-4 py-2 shrink-0"
              >
                <Clock className="h-4 w-4 mr-2" />
                Now
              </Button>
            </div>
          </div>

          {/* Advanced Metrics Toggle */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full"
          >
            {showAdvanced ? 'Hide' : 'Show'} Body Metrics
          </Button>

          {/* Advanced Body Metrics */}
          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bodyFat">Body Fat %</Label>
                  <Input
                    id="bodyFat"
                    type="number"
                    step="0.1"
                    value={newEntry.bodyFat}
                    onChange={(e) => setNewEntry({ ...newEntry, bodyFat: e.target.value })}
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <Label htmlFor="water">Water %</Label>
                  <Input
                    id="water"
                    type="number"
                    step="0.1"
                    value={newEntry.water}
                    onChange={(e) => setNewEntry({ ...newEntry, water: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="muscleMass">Muscle Mass (lbs)</Label>
                  <Input
                    id="muscleMass"
                    type="number"
                    step="0.1"
                    value={newEntry.muscleMass}
                    onChange={(e) => setNewEntry({ ...newEntry, muscleMass: e.target.value })}
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <Label htmlFor="boneMass">Bone Mass ({weightUnit})</Label>
                  <Input
                    id="boneMass"
                    type="number"
                    step="0.1"
                    value={newEntry.boneMass}
                    onChange={(e) => setNewEntry({ ...newEntry, boneMass: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bmi">BMI</Label>
                <Input
                  id="bmi"
                  type="number"
                  step="0.1"
                  value={newEntry.bmi}
                  onChange={(e) => setNewEntry({ ...newEntry, bmi: e.target.value })}
                  placeholder="0.0"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={addEntry} className={editingId ? "flex-1" : "w-full"}>
              {editingId ? 'Update Entry' : 'Add Entry'}
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={cancelEditing}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Weight History for Selected Date */}
      <div className="space-y-3">
        <h3>Weight History - {getDateDisplay(selectedDate)}</h3>
        {currentDateEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No weight entries for {getDateDisplay(selectedDate).toLowerCase()}.
            </CardContent>
          </Card>
        ) : (
          currentDateEntries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="h-4 w-4 text-primary" />
                      <span className="text-lg">{entry.weight} {entry.unit}</span>
                      <span className="text-sm text-muted-foreground ml-auto">{entry.time}</span>
                    </div>
                    
                    {(entry.bodyFat || entry.water || entry.muscleMass || entry.boneMass || entry.bmi) && (
                      <div className="grid grid-cols-3 gap-2 text-xs mt-2">
                        {entry.water !== undefined && (
                          <div className="text-muted-foreground">
                            💧 Water: {entry.water}%
                          </div>
                        )}
                        {entry.bodyFat !== undefined && (
                          <div className="text-muted-foreground">
                            🔥 Fat: {entry.bodyFat}%
                          </div>
                        )}
                        {entry.muscleMass !== undefined && (
                          <div className="text-muted-foreground">
                            💪 Muscle: {entry.muscleMass} lbs
                          </div>
                        )}
                        {entry.bmi !== undefined && (
                          <div className="text-muted-foreground">
                            📊 BMI: {entry.bmi}
                          </div>
                        )}
                        {entry.boneMass !== undefined && (
                          <div className="text-muted-foreground">
                            🦴 Bone: {entry.boneMass} {entry.unit}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(entry)}
                      className="text-primary hover:text-primary ml-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Quick Navigation to Today */}
      {!isToday(selectedDate) && (
        <Button
          variant="outline"
          onClick={() => setSelectedDate(new Date())}
          className="w-full"
        >
          Go to Today
        </Button>
      )}
    </div>
  );
}