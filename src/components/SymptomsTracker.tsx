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
import { Plus, Trash2, Clock, AlertTriangle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil, Smile, Meh, Frown, CloudRain } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { SymptomEntry, WellnessFeelings } from '../lib/database';

const commonSymptoms = [
  'Headache',
  'Nausea',
  'Fatigue',
  'Stomach pain',
  'Bloating',
  'Heartburn',
  'Dizziness',
  'Joint pain',
  'Muscle aches',
  'Skin issues',
  'Sleep issues',
  'Mood changes',
  'Other'
];

export function SymptomsTracker() {
  const {
    symptomEntries,
    addSymptomEntry,
    updateSymptomEntry,
    deleteSymptomEntry,
    wellnessFeelings,
    addWellnessFeelings,
    updateWellnessFeelings,
    deleteWellnessFeelings
  } = useHealthData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    symptom: '',
    severity: 'mild' as const,
    time: '',
    description: '',
    triggers: ''
  });
  const [showWellness, setShowWellness] = useState(true);
  const [wellnessEntry, setWellnessEntry] = useState<{
    overall?: 'happy' | 'neutral' | 'sad' | 'very-sad';
    morning?: 'happy' | 'neutral' | 'sad' | 'very-sad';
    afternoon?: 'happy' | 'neutral' | 'sad' | 'very-sad';
    evening?: 'happy' | 'neutral' | 'sad' | 'very-sad';
  }>({});

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

  const getEntriesForDate = (date: Date): SymptomEntry[] => {
    const dateStr = formatDate(date);
    return symptomEntries
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
    if (newEntry.symptom && newEntry.time && newEntry.description) {
      if (editingId) {
        // Update existing entry
        await updateSymptomEntry(editingId, {
          ...newEntry,
          date: formatDate(selectedDate)
        });
        setEditingId(null);
      } else {
        // Add new entry
        await addSymptomEntry({
          ...newEntry,
          date: formatDate(selectedDate)
        });
      }
      setNewEntry({
        symptom: '',
        severity: 'mild',
        time: '',
        description: '',
        triggers: ''
      });
    }
  };

  const removeEntry = async (id: string) => {
    await deleteSymptomEntry(id);
    if (editingId === id) {
      setEditingId(null);
      setNewEntry({
        symptom: '',
        severity: 'mild',
        time: '',
        description: '',
        triggers: ''
      });
    }
  };

  const startEditing = (entry: SymptomEntry) => {
    setEditingId(entry.id);
    setNewEntry({
      symptom: entry.symptom,
      severity: entry.severity,
      time: entry.time,
      description: entry.description,
      triggers: entry.triggers || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewEntry({
      symptom: '',
      severity: 'mild',
      time: '',
      description: '',
      triggers: ''
    });
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'severe': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'severe') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Wellness functions
  const getWellnessForDate = (date: Date): WellnessFeelings | undefined => {
    const dateStr = formatDate(date);
    return wellnessFeelings.find(entry => entry.date === dateStr);
  };

  const currentWellness = getWellnessForDate(selectedDate);

  const saveWellness = async () => {
    if (Object.keys(wellnessEntry).length > 0) {
      const dateStr = formatDate(selectedDate);
      if (currentWellness) {
        await updateWellnessFeelings(currentWellness.id!, wellnessEntry);
      } else {
        await addWellnessFeelings({ date: dateStr, ...wellnessEntry });
      }
      setWellnessEntry({});
    }
  };

  const deleteWellness = async () => {
    if (currentWellness && window.confirm('Are you sure you want to delete wellness feelings for this date?')) {
      await deleteWellnessFeelings(currentWellness.id!);
      setWellnessEntry({});
    }
  };

  const loadWellnessForEditing = () => {
    if (currentWellness) {
      setWellnessEntry({
        overall: currentWellness.overall,
        morning: currentWellness.morning,
        afternoon: currentWellness.afternoon,
        evening: currentWellness.evening
      });
    }
  };

  const getMoodEmoji = (mood?: 'happy' | 'neutral' | 'sad' | 'very-sad') => {
    if (!mood) return '—';
    switch (mood) {
      case 'happy': return '😊';
      case 'neutral': return '😐';
      case 'sad': return '😔';
      case 'very-sad': return '😢';
      default: return '—';
    }
  };

  const getMoodColor = (mood?: 'happy' | 'neutral' | 'sad' | 'very-sad') => {
    if (!mood) return 'bg-gray-100 text-gray-600';
    switch (mood) {
      case 'happy': return 'bg-green-100 text-green-700';
      case 'neutral': return 'bg-blue-100 text-blue-700';
      case 'sad': return 'bg-orange-100 text-orange-700';
      case 'very-sad': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-600';
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

      {/* Wellness Feelings */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Smile className="h-5 w-5" />
              Wellness Feelings
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWellness(!showWellness)}
              className="text-green-700 hover:text-green-800"
            >
              {showWellness ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showWellness && (
          <CardContent className="space-y-4">
            {currentWellness && Object.keys(wellnessEntry).length === 0 ? (
              // Display mode
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg border-2 ${getMoodColor(currentWellness.overall)}`}>
                    <div className="text-xs font-semibold mb-1">Overall</div>
                    <div className="text-2xl">{getMoodEmoji(currentWellness.overall)}</div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${getMoodColor(currentWellness.morning)}`}>
                    <div className="text-xs font-semibold mb-1">Morning</div>
                    <div className="text-2xl">{getMoodEmoji(currentWellness.morning)}</div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${getMoodColor(currentWellness.afternoon)}`}>
                    <div className="text-xs font-semibold mb-1">Afternoon</div>
                    <div className="text-2xl">{getMoodEmoji(currentWellness.afternoon)}</div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${getMoodColor(currentWellness.evening)}`}>
                    <div className="text-xs font-semibold mb-1">Evening</div>
                    <div className="text-2xl">{getMoodEmoji(currentWellness.evening)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadWellnessForEditing}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteWellness}
                    className="flex-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              // Edit mode
              <div className="space-y-4">
                <div>
                  <Label>Overall Wellness</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {(['happy', 'neutral', 'sad', 'very-sad'] as const).map((mood) => (
                      <Button
                        key={mood}
                        variant={wellnessEntry.overall === mood ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setWellnessEntry({ ...wellnessEntry, overall: mood })}
                        className="flex-col h-auto py-3"
                      >
                        <span className="text-2xl mb-1">{getMoodEmoji(mood)}</span>
                        <span className="text-xs capitalize">{mood.replace('-', ' ')}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Morning Mood</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {(['happy', 'neutral', 'sad', 'very-sad'] as const).map((mood) => (
                      <Button
                        key={mood}
                        variant={wellnessEntry.morning === mood ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setWellnessEntry({ ...wellnessEntry, morning: mood })}
                        className="flex-col h-auto py-3"
                      >
                        <span className="text-2xl mb-1">{getMoodEmoji(mood)}</span>
                        <span className="text-xs capitalize">{mood.replace('-', ' ')}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Afternoon Mood</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {(['happy', 'neutral', 'sad', 'very-sad'] as const).map((mood) => (
                      <Button
                        key={mood}
                        variant={wellnessEntry.afternoon === mood ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setWellnessEntry({ ...wellnessEntry, afternoon: mood })}
                        className="flex-col h-auto py-3"
                      >
                        <span className="text-2xl mb-1">{getMoodEmoji(mood)}</span>
                        <span className="text-xs capitalize">{mood.replace('-', ' ')}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Evening Mood</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {(['happy', 'neutral', 'sad', 'very-sad'] as const).map((mood) => (
                      <Button
                        key={mood}
                        variant={wellnessEntry.evening === mood ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setWellnessEntry({ ...wellnessEntry, evening: mood })}
                        className="flex-col h-auto py-3"
                      >
                        <span className="text-2xl mb-1">{getMoodEmoji(mood)}</span>
                        <span className="text-xs capitalize">{mood.replace('-', ' ')}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={saveWellness}
                    className="flex-1"
                    disabled={Object.keys(wellnessEntry).length === 0}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {currentWellness ? 'Update Wellness' : 'Save Wellness'}
                  </Button>
                  {currentWellness && (
                    <Button
                      variant="outline"
                      onClick={() => setWellnessEntry({})}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            )}
            {!currentWellness && Object.keys(wellnessEntry).length === 0 && (
              <div className="text-center py-4 text-green-700 text-sm">
                Track your wellness feelings for {getDateDisplay(selectedDate).toLowerCase()}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Log Symptom
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="symptom">Symptom</Label>
            <Select value={newEntry.symptom} onValueChange={(value) => setNewEntry({ ...newEntry, symptom: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select symptom..." />
              </SelectTrigger>
              <SelectContent>
                {commonSymptoms.map((symptom) => (
                  <SelectItem key={symptom} value={symptom}>
                    {symptom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {newEntry.symptom === 'Other' && (
              <Input
                className="mt-2"
                placeholder="Describe your symptom..."
                value={newEntry.symptom === 'Other' ? newEntry.description.split(':')[0] || '' : ''}
                onChange={(e) => setNewEntry({ ...newEntry, symptom: `Other: ${e.target.value}` })}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="severity">Severity</Label>
              <Select value={newEntry.severity} onValueChange={(value: any) => setNewEntry({ ...newEntry, severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="symptom-time">Time</Label>
              <div className="flex gap-2">
                <Input
                  id="symptom-time"
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              placeholder="Describe the symptom in detail..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="triggers">Possible Triggers (optional)</Label>
            <Input
              id="triggers"
              value={newEntry.triggers}
              onChange={(e) => setNewEntry({ ...newEntry, triggers: e.target.value })}
              placeholder="e.g., after eating dairy, stress, weather change..."
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={addEntry} className={editingId ? "flex-1" : "w-full"}>
              {editingId ? 'Update Symptom' : 'Add Symptom'}
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

      <div className="space-y-3">
        <h3>Symptoms Log - {getDateDisplay(selectedDate)}</h3>
        {currentDateEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No symptoms logged for {getDateDisplay(selectedDate).toLowerCase()}. Great job staying healthy!
            </CardContent>
          </Card>
        ) : (
          currentDateEntries.map((entry) => (
            <Card key={entry.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-base">{entry.symptom}</h4>
                      <Badge className={getSeverityColor(entry.severity)}>
                        {entry.severity}
                      </Badge>
                      {getSeverityIcon(entry.severity)}
                      <span className="text-sm text-muted-foreground ml-auto">{entry.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {entry.description}
                    </p>
                    {entry.triggers && (
                      <p className="text-sm text-muted-foreground">
                        <span className="text-xs uppercase tracking-wide">Triggers:</span> {entry.triggers}
                      </p>
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
                      className="text-destructive hover:text-destructive ml-2"
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

      {currentDateEntries.some(entry => entry.severity === 'severe') && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h4>Severe Symptoms Detected</h4>
            </div>
            <p className="text-red-700 text-sm">
              You've logged severe symptoms for {getDateDisplay(selectedDate).toLowerCase()}. Consider consulting with a healthcare professional if symptoms persist.
            </p>
          </CardContent>
        </Card>
      )}

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