import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Droplets, Plus, Minus, Target, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { WaterEntry } from '../lib/database';

export function WaterTracker() {
  const { waterEntries: entries, addWaterEntry, deleteWaterEntry, updateWaterEntry, waterGoal: dailyGoal, setWaterGoal: setDailyGoal } = useHealthData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMetric, setIsMetric] = useState(false); // false = OZ (default), true = ML
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editTime, setEditTime] = useState<string>('');
  
  // Conversion functions
  const mlToOz = (ml: number) => Math.round((ml / 29.5735) * 10) / 10;
  const ozToMl = (oz: number) => Math.round(oz * 29.5735);
  
  // Display functions
  const formatAmount = (ml: number) => {
    return isMetric ? `${ml}ml` : `${mlToOz(ml)}oz`;
  };
  
  const formatGoal = (ml: number) => {
    return isMetric 
      ? `${(ml / 1000).toFixed(1)}L` 
      : `${mlToOz(ml)}oz`;
  };

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

  const getEntriesForDate = (date: Date): WaterEntry[] => {
    const dateStr = formatDate(date);
    return entries
      .filter(entry => entry.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const getWaterIntakeForDate = (date: Date): number => {
    return getEntriesForDate(date).reduce((sum, entry) => sum + entry.amount, 0);
  };

  const currentDateEntries = getEntriesForDate(selectedDate);
  const waterIntake = getWaterIntakeForDate(selectedDate);

  const startEditing = (entry: WaterEntry) => {
    setEditingId(entry.id!);
    setEditAmount(entry.amount);
    setEditTime(entry.time);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditAmount(0);
    setEditTime('');
  };

  const addWater = async (amount: number) => {
    if (editingId) {
      await updateWaterEntry(editingId, {
        amount: editAmount,
        time: editTime,
        date: formatDate(selectedDate)
      });
      setEditingId(null);
      setEditAmount(0);
      setEditTime('');
    } else {
      const now = new Date();
      await addWaterEntry({
        amount,
        time: now.toTimeString().slice(0, 5),
        date: formatDate(selectedDate)
      });
    }
  };

  const removeWater = async (amount: number) => {
    // Remove the most recent entry for the selected date that matches or is closest to the amount
    const currentEntries = getEntriesForDate(selectedDate);
    if (currentEntries.length === 0) return;

    // Find the most recent entry
    const lastEntry = currentEntries[currentEntries.length - 1];
    await deleteWaterEntry(lastEntry.id!);
  };

  const deleteEntry = async (id: string) => {
    await deleteWaterEntry(id);
  };

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

  const progressPercentage = Math.min((waterIntake / dailyGoal) * 100, 100);

  // Quick amounts based on unit
  const quickAmounts = isMetric 
    ? [250, 500, 750, 1000] // ml
    : [ozToMl(8), ozToMl(16), ozToMl(24), ozToMl(32)]; // 8, 16, 24, 32 oz converted to ml
  
  const quickAmountLabels = isMetric 
    ? ['250ml', '500ml', '750ml', '1000ml']
    : ['8oz', '16oz', '24oz', '32oz'];
  
  const removeAmount = isMetric ? 250 : ozToMl(8); // 250ml or 8oz

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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              {editingId ? 'Edit Water Entry' : 'Water Intake'}
            </div>
            {!editingId && (
              <div className="flex items-center gap-2">
                <Label htmlFor="unit-toggle" className="text-sm">
                  {isMetric ? 'ML' : 'OZ'}
                </Label>
                <Switch
                  id="unit-toggle"
                  checked={isMetric}
                  onCheckedChange={setIsMetric}
                />
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editingId ? (
            <>
              <div>
                <Label htmlFor="edit-amount">Amount ({isMetric ? 'ml' : 'oz'})</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  value={isMetric ? editAmount : mlToOz(editAmount)}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setEditAmount(isMetric ? value : ozToMl(value));
                  }}
                  placeholder={`Enter amount in ${isMetric ? 'ml' : 'oz'}`}
                />
              </div>

              <div>
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="[&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={() => addWater(0)} className="flex-1">
                  Update Entry
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelEditing}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-center space-y-2">
                <div className="text-3xl text-blue-500">{formatAmount(waterIntake)}</div>
                <div className="text-sm text-muted-foreground">
                  of {formatGoal(dailyGoal)} goal
                </div>
                <Progress
                  value={progressPercentage}
                  className="h-3 bg-blue-100 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-blue-600"
                />
                <div className="text-sm text-muted-foreground">
                  {Math.round(progressPercentage)}% complete
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quick Add</Label>
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.map((amount, index) => (
                    <Button
                      key={amount}
                      variant="outline"
                      onClick={() => addWater(amount)}
                      className="flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      {quickAmountLabels[index]}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => removeWater(removeAmount)}
                  className="flex-1 flex items-center gap-1"
                  disabled={waterIntake === 0}
                >
                  <Minus className="h-4 w-4" />
                  Remove {isMetric ? '250ml' : '8oz'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDailyGoal(dailyGoal === 2000 ? 2500 : 2000)}
                  className="flex items-center gap-1"
                >
                  <Target className="h-4 w-4" />
                  Goal: {formatGoal(dailyGoal === 2000 ? 2500 : 2000)}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Water Log for Selected Date */}
      <div className="space-y-3">
        <h3>Water Log - {getDateDisplay(selectedDate)}</h3>
        {currentDateEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No water entries for {getDateDisplay(selectedDate).toLowerCase()}. Add your first drink above!
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Water Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {currentDateEntries.slice().reverse().map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center py-2 border-b border-border/50 last:border-b-0">
                    <span className="text-sm text-muted-foreground">{entry.time}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">+{formatAmount(entry.amount)}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(entry)}
                        className="text-primary hover:text-primary h-6 w-6 p-0"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

      {waterIntake >= dailyGoal && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 text-center">
            <div className="text-green-600 mb-2">🎉 Congratulations!</div>
            <p className="text-green-700">You've reached your daily water goal!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}