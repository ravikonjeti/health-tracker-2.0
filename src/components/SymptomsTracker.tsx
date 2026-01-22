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
import { Plus, Trash2, Clock, AlertTriangle, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
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