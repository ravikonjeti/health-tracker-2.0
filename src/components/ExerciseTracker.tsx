import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, Trash2, Clock, Dumbbell, Heart, Zap, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil, Footprints } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { ExerciseEntry, StepEntry } from '../lib/database';

export function ExerciseTracker() {
  const {
    exerciseEntries,
    addExerciseEntry,
    updateExerciseEntry,
    deleteExerciseEntry,
    stepEntries,
    addStepEntry,
    updateStepEntry,
    deleteStepEntry
  } = useHealthData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    type: 'cardio' as const,
    name: '',
    duration: '',
    intensity: 'moderate' as const,
    notes: '',
    time: ''
  });
  const [stepCount, setStepCount] = useState('');

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  const getEntriesForDate = (date: Date): ExerciseEntry[] => {
    const dateStr = formatDate(date);
    return exerciseEntries
      .filter(entry => entry.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const currentDateEntries = getEntriesForDate(selectedDate);

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

  const addEntry = async () => {
    if (newEntry.name && newEntry.duration && newEntry.time) {
      if (editingId) {
        // Update existing entry
        await updateExerciseEntry(editingId, {
          name: newEntry.name,
          type: newEntry.type,
          duration: parseInt(newEntry.duration),
          intensity: newEntry.intensity,
          notes: newEntry.notes,
          time: newEntry.time,
          date: formatDate(selectedDate)
        });
        setEditingId(null);
      } else {
        // Add new entry
        await addExerciseEntry({
          name: newEntry.name,
          type: newEntry.type,
          duration: parseInt(newEntry.duration),
          intensity: newEntry.intensity,
          notes: newEntry.notes,
          time: newEntry.time,
          date: formatDate(selectedDate)
        });
      }
      setNewEntry({
        type: 'cardio',
        name: '',
        duration: '',
        intensity: 'moderate',
        notes: '',
        time: ''
      });
    }
  };

  const removeEntry = async (id: string) => {
    await deleteExerciseEntry(id);
    if (editingId === id) {
      setEditingId(null);
      setNewEntry({
        type: 'cardio',
        name: '',
        duration: '',
        intensity: 'moderate',
        notes: '',
        time: ''
      });
    }
  };

  const startEditing = (entry: ExerciseEntry) => {
    setEditingId(entry.id || '');
    setNewEntry({
      type: entry.type,
      name: entry.name,
      duration: entry.duration.toString(),
      intensity: entry.intensity,
      notes: entry.notes || '',
      time: entry.time
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewEntry({
      type: 'cardio',
      name: '',
      duration: '',
      intensity: 'moderate',
      notes: '',
      time: ''
    });
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cardio': return <Heart className="h-4 w-4" />;
      case 'yoga': return <Zap className="h-4 w-4" />;
      case 'strength': return <Dumbbell className="h-4 w-4" />;
      default: return <Dumbbell className="h-4 w-4" />;
    }
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalMinutes = currentDateEntries.reduce((sum, entry) => sum + entry.duration, 0);

  // Step tracking functions
  const getStepEntryForDate = (date: Date): StepEntry | undefined => {
    const dateStr = formatDate(date);
    return stepEntries.find(entry => entry.date === dateStr);
  };

  const currentStepEntry = getStepEntryForDate(selectedDate);

  const addOrUpdateSteps = async () => {
    const steps = parseInt(stepCount);
    if (steps > 0) {
      const dateStr = formatDate(selectedDate);
      if (currentStepEntry) {
        await updateStepEntry(currentStepEntry.id!, { steps });
      } else {
        await addStepEntry({ date: dateStr, steps });
      }
      setStepCount('');
    }
  };

  const removeSteps = async () => {
    if (currentStepEntry && window.confirm('Are you sure you want to delete the step count for this date?')) {
      await deleteStepEntry(currentStepEntry.id!);
    }
  };

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

      {/* Step Counter */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Footprints className="h-5 w-5" />
            Daily Steps
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentStepEntry ? (
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {currentStepEntry.steps.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700 mb-3">steps for {getDateDisplay(selectedDate).toLowerCase()}</div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStepCount(currentStepEntry.steps.toString())}
                  className="flex-1"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeSteps}
                  className="flex-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="step-count">Log your steps</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="step-count"
                  type="number"
                  value={stepCount}
                  onChange={(e) => setStepCount(e.target.value)}
                  placeholder="e.g., 8000"
                  min="0"
                  className="flex-1"
                />
                <Button
                  onClick={addOrUpdateSteps}
                  disabled={!stepCount || parseInt(stepCount) <= 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          )}
          {stepCount && !currentStepEntry && parseInt(stepCount) > 0 && (
            <div className="text-center">
              <Button
                onClick={addOrUpdateSteps}
                className="w-full"
              >
                Save {parseInt(stepCount).toLocaleString()} steps
              </Button>
            </div>
          )}
          {stepCount && currentStepEntry && (
            <div className="text-center">
              <Button
                onClick={addOrUpdateSteps}
                className="w-full"
              >
                Update to {parseInt(stepCount).toLocaleString()} steps
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Log Exercise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="exercise-type">Exercise Type</Label>
            <Select value={newEntry.type} onValueChange={(value: any) => setNewEntry({ ...newEntry, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cardio">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Cardio
                  </div>
                </SelectItem>
                <SelectItem value="yoga">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Yoga
                  </div>
                </SelectItem>
                <SelectItem value="strength">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4" />
                    Strength Training
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exercise-name">Exercise Name</Label>
            <Input
              id="exercise-name"
              value={newEntry.name}
              onChange={(e) => setNewEntry({ ...newEntry, name: e.target.value })}
              placeholder="e.g., Morning run, Vinyasa flow, Push ups"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={newEntry.duration}
                onChange={(e) => setNewEntry({ ...newEntry, duration: e.target.value })}
                placeholder="30"
                min="1"
              />
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
                  variant="outline"
                  size="sm"
                  onClick={() => setNewEntry({ ...newEntry, time: getCurrentTime() })}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="intensity">Intensity</Label>
            <Select value={newEntry.intensity} onValueChange={(value: any) => setNewEntry({ ...newEntry, intensity: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="exercise-notes">Notes (optional)</Label>
            <Textarea
              id="exercise-notes"
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              placeholder="How did it feel? Any observations..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={addEntry} className={editingId ? "flex-1" : "w-full"}>
              {editingId ? 'Update Exercise' : 'Add Exercise'}
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

      {totalMinutes > 0 && (
        <Card>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="text-2xl text-primary mb-1">{totalMinutes} minutes</div>
              <div className="text-sm text-muted-foreground">Total exercise for {getDateDisplay(selectedDate).toLowerCase()}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h3>Exercise Log - {getDateDisplay(selectedDate)}</h3>
        {currentDateEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No exercises logged for {getDateDisplay(selectedDate).toLowerCase()}. Start your workout!
            </CardContent>
          </Card>
        ) : (
          currentDateEntries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
                        {getTypeIcon(entry.type)}
                        <span className="capitalize">{entry.type}</span>
                      </div>
                      <Badge className={getIntensityColor(entry.intensity)}>
                        {entry.intensity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{entry.time}</span>
                    </div>
                    <h4 className="mb-1">{entry.name}</h4>
                    <p className="text-sm text-muted-foreground mb-1">
                      {entry.duration} minutes
                    </p>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        {entry.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(entry)}
                      className="text-primary hover:text-primary"
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