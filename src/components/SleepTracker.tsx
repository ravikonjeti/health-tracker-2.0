import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Switch } from './ui/switch';
import { Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil, Moon, Sun, Clock } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { SleepEntry } from '../lib/database';

export function SleepTracker() {
  const { sleepEntries, addSleepEntry, updateSleepEntry, deleteSleepEntry } = useHealthData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    bedTime: '',
    wakeTime: '',
    sleepQuality: 3 as 1 | 2 | 3 | 4 | 5,
    mood: 'good' as 'energized' | 'good' | 'ok' | 'tired' | 'exhausted',
    notes: '',
    snoring: false,
    dreams: '',
    interruptions: 0,
    napDuration: 0
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const getEntryForDate = (date: Date): SleepEntry | undefined => {
    const dateStr = formatDate(date);
    return sleepEntries.find(entry => entry.date === dateStr);
  };

  const calculateSleepDuration = (bedTime: string, wakeTime: string): string => {
    if (!bedTime || !wakeTime) return '--';

    const [bedHour, bedMin] = bedTime.split(':').map(Number);
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);

    let bedMinutes = bedHour * 60 + bedMin;
    let wakeMinutes = wakeHour * 60 + wakeMin;

    // If wake time is before bed time, assume it's the next day
    if (wakeMinutes <= bedMinutes) {
      wakeMinutes += 24 * 60;
    }

    const totalMinutes = wakeMinutes - bedMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
  };

  const addEntry = async () => {
    if (newEntry.bedTime && newEntry.wakeTime) {
      if (editingId) {
        await updateSleepEntry(editingId, {
          ...newEntry,
          date: formatDate(selectedDate)
        });
        setEditingId(null);
      } else {
        await addSleepEntry({
          ...newEntry,
          date: formatDate(selectedDate)
        });
      }

      setNewEntry({
        bedTime: '',
        wakeTime: '',
        sleepQuality: 3,
        mood: 'good',
        notes: '',
        snoring: false,
        dreams: '',
        interruptions: 0,
        napDuration: 0
      });
      setShowAdvanced(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this sleep entry?')) {
      await deleteSleepEntry(id);
      if (editingId === id) {
        cancelEditing();
      }
    }
  };

  const startEditing = (entry: SleepEntry) => {
    setEditingId(entry.id || null);
    setNewEntry({
      bedTime: entry.bedTime,
      wakeTime: entry.wakeTime,
      sleepQuality: entry.sleepQuality,
      mood: entry.mood,
      notes: entry.notes,
      snoring: entry.snoring || false,
      dreams: entry.dreams || '',
      interruptions: entry.interruptions || 0,
      napDuration: entry.napDuration || 0
    });
    if (entry.snoring || entry.dreams || entry.interruptions || entry.napDuration) {
      setShowAdvanced(true);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewEntry({
      bedTime: '',
      wakeTime: '',
      sleepQuality: 3,
      mood: 'good',
      notes: '',
      snoring: false,
      dreams: '',
      interruptions: 0,
      napDuration: 0
    });
    setShowAdvanced(false);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  const currentEntry = getEntryForDate(selectedDate);
  const duration = currentEntry ? calculateSleepDuration(currentEntry.bedTime, currentEntry.wakeTime) : '--';

  const moodEmojis = {
    energized: '⚡',
    good: '😊',
    ok: '😐',
    tired: '😪',
    exhausted: '😵'
  };

  const qualityColors = {
    1: 'bg-red-100 text-red-800 border-red-200',
    2: 'bg-orange-100 text-orange-800 border-orange-200',
    3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    4: 'bg-blue-100 text-blue-800 border-blue-200',
    5: 'bg-green-100 text-green-800 border-green-200'
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            {editingId ? 'Edit Sleep Entry' : 'Add Sleep Entry'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bedTime" className="flex items-center gap-2">
                <Moon className="h-4 w-4" />
                Bed Time
              </Label>
              <Input
                id="bedTime"
                type="time"
                value={newEntry.bedTime}
                onChange={(e) => setNewEntry({ ...newEntry, bedTime: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="wakeTime" className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Wake Time
              </Label>
              <Input
                id="wakeTime"
                type="time"
                value={newEntry.wakeTime}
                onChange={(e) => setNewEntry({ ...newEntry, wakeTime: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          {newEntry.bedTime && newEntry.wakeTime && (
            <div className="text-center p-2 bg-blue-50 rounded-md">
              <span className="text-sm text-blue-800 font-medium">
                Sleep Duration: {calculateSleepDuration(newEntry.bedTime, newEntry.wakeTime)}
              </span>
            </div>
          )}

          <div>
            <Label>Sleep Quality (1-5)</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map(quality => (
                <Button
                  key={quality}
                  variant={newEntry.sleepQuality === quality ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewEntry({ ...newEntry, sleepQuality: quality as 1 | 2 | 3 | 4 | 5 })}
                  className="flex-1"
                >
                  {quality}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Morning Mood</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {(Object.keys(moodEmojis) as Array<keyof typeof moodEmojis>).map(mood => (
                <Button
                  key={mood}
                  variant={newEntry.mood === mood ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewEntry({ ...newEntry, mood })}
                  className="flex-col h-auto py-2"
                >
                  <span className="text-2xl mb-1">{moodEmojis[mood]}</span>
                  <span className="text-xs capitalize">{mood}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              placeholder="How did you sleep? Any observations..."
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
            <Label htmlFor="advanced" className="cursor-pointer">
              Advanced Sleep Metrics
            </Label>
            <Switch
              id="advanced"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 border rounded-md bg-gray-50">
              <div className="flex items-center justify-between">
                <Label htmlFor="snoring">Snoring</Label>
                <Switch
                  id="snoring"
                  checked={newEntry.snoring}
                  onCheckedChange={(checked) => setNewEntry({ ...newEntry, snoring: checked })}
                />
              </div>

              <div>
                <Label htmlFor="dreams">Dreams</Label>
                <Input
                  id="dreams"
                  value={newEntry.dreams}
                  onChange={(e) => setNewEntry({ ...newEntry, dreams: e.target.value })}
                  placeholder="Describe any dreams..."
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="interruptions">Sleep Interruptions</Label>
                <Input
                  id="interruptions"
                  type="number"
                  min="0"
                  value={newEntry.interruptions}
                  onChange={(e) => setNewEntry({ ...newEntry, interruptions: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="napDuration">Nap Duration (minutes)</Label>
                <Input
                  id="napDuration"
                  type="number"
                  min="0"
                  value={newEntry.napDuration}
                  onChange={(e) => setNewEntry({ ...newEntry, napDuration: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={addEntry}
              className={editingId ? "flex-1" : "w-full"}
              disabled={!newEntry.bedTime || !newEntry.wakeTime}
            >
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? 'Update Entry' : 'Add Entry'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={cancelEditing} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sleep Log</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate.toLocaleDateString()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button variant="outline" size="icon" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentEntry ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <Moon className="h-6 w-6 mx-auto text-indigo-600" />
                      <div className="text-sm font-medium mt-1">{currentEntry.bedTime}</div>
                    </div>
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div className="text-center">
                      <Sun className="h-6 w-6 mx-auto text-amber-500" />
                      <div className="text-sm font-medium mt-1">{currentEntry.wakeTime}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(currentEntry)}
                      className="text-primary"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(currentEntry.id!)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-blue-50 rounded">
                    <div className="text-xs text-gray-600">Duration</div>
                    <div className="text-sm font-bold text-blue-700">{duration}</div>
                  </div>
                  <div className={`p-2 rounded border ${qualityColors[currentEntry.sleepQuality]}`}>
                    <div className="text-xs">Quality</div>
                    <div className="text-sm font-bold">{currentEntry.sleepQuality}/5</div>
                  </div>
                  <div className="p-2 bg-amber-50 rounded">
                    <div className="text-xs text-gray-600">Mood</div>
                    <div className="text-lg">{moodEmojis[currentEntry.mood]}</div>
                  </div>
                </div>

                {currentEntry.notes && (
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-xs text-gray-600 mb-1">Notes</div>
                    <div className="text-sm">{currentEntry.notes}</div>
                  </div>
                )}

                {(currentEntry.snoring || currentEntry.dreams || (currentEntry.interruptions && currentEntry.interruptions > 0) || (currentEntry.napDuration && currentEntry.napDuration > 0)) && (
                  <div className="p-3 bg-gray-50 rounded space-y-2">
                    <div className="text-xs font-semibold text-gray-700">Advanced Metrics</div>
                    {currentEntry.snoring && (
                      <div className="text-sm">• Snoring reported</div>
                    )}
                    {currentEntry.dreams && (
                      <div className="text-sm">• Dreams: {currentEntry.dreams}</div>
                    )}
                    {currentEntry.interruptions && currentEntry.interruptions > 0 && (
                      <div className="text-sm">• Interruptions: {currentEntry.interruptions}</div>
                    )}
                    {currentEntry.napDuration && currentEntry.napDuration > 0 && (
                      <div className="text-sm">• Nap: {currentEntry.napDuration} min</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Moon className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No sleep data for this date</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
