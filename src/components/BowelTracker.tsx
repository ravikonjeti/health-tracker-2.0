import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Plus, Trash2, Clock, Info, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { BowelEntry } from '../lib/database';

const bristolTypes = [
  { type: 1, description: "Separate hard lumps", detail: "Hard to pass, constipated" },
  { type: 2, description: "Lumpy sausage", detail: "Slightly constipated" },
  { type: 3, description: "Sausage with cracks", detail: "Normal" },
  { type: 4, description: "Smooth sausage", detail: "Normal" },
  { type: 5, description: "Soft blobs", detail: "Lacking fiber" },
  { type: 6, description: "Mushy consistency", detail: "Mild diarrhea" },
  { type: 7, description: "Liquid consistency", detail: "Severe diarrhea" }
];

export function BowelTracker() {
  const { bowelEntries: entries, addBowelEntry, deleteBowelEntry } = useHealthData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newEntry, setNewEntry] = useState({
    type: '',
    time: '',
    notes: ''
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

  const getEntriesForDate = (date: Date): BowelEntry[] => {
    const dateStr = formatDate(date);
    return entries
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
    if (newEntry.type && newEntry.time) {
      await addBowelEntry({
        type: parseInt(newEntry.type),
        time: newEntry.time,
        notes: newEntry.notes,
        date: formatDate(selectedDate)
      });
      setNewEntry({
        type: '',
        time: '',
        notes: ''
      });
    }
  };

  const removeEntry = async (id: string) => {
    await deleteBowelEntry(id);
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const getBristolInfo = (type: number) => {
    return bristolTypes.find(bt => bt.type === type);
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
            Log Bowel Movement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Label htmlFor="bristol-type">Bristol Stool Type</Label>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Info className="h-4 w-4" />
                    Chart
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Bristol Stool Chart</DialogTitle>
                    <DialogDescription>
                      Reference chart for categorizing bowel movements by type and consistency
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {bristolTypes.map((bristol) => (
                      <div key={bristol.type} className="border rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm">
                            {bristol.type}
                          </div>
                          <span className="text-sm">{bristol.description}</span>
                        </div>
                        <p className="text-xs text-muted-foreground ml-8">
                          {bristol.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Select value={newEntry.type} onValueChange={(value) => setNewEntry({ ...newEntry, type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {bristolTypes.map((bristol) => (
                  <SelectItem key={bristol.type} value={bristol.type.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs">
                        {bristol.type}
                      </div>
                      {bristol.description}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="bowel-time">Time</Label>
            <div className="flex gap-2">
              <Input
                id="bowel-time"
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

          <div>
            <Label htmlFor="bowel-notes">Notes (optional)</Label>
            <Textarea
              id="bowel-notes"
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              placeholder="Any observations, pain, difficulty, etc..."
              rows={2}
            />
          </div>

          <Button onClick={addEntry} className="w-full">
            Add Entry
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3>Bowel Log - {getDateDisplay(selectedDate)}</h3>
        {currentDateEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No entries for {getDateDisplay(selectedDate).toLowerCase()}.
            </CardContent>
          </Card>
        ) : (
          currentDateEntries.map((entry) => {
            const bristolInfo = getBristolInfo(entry.type);
            return (
              <Card key={entry.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                          {entry.type}
                        </div>
                        <div>
                          <p className="text-sm">{bristolInfo?.description}</p>
                          <p className="text-xs text-muted-foreground">{bristolInfo?.detail}</p>
                        </div>
                        <span className="text-sm text-muted-foreground ml-auto">{entry.time}</span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground italic mt-2">
                          {entry.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
                      className="text-destructive hover:text-destructive ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
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