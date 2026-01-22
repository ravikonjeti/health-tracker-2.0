import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Badge } from './ui/badge';
import { Plus, Trash2, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Utensils, Pencil } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { FoodEntry } from '../lib/database';

export function FoodTracker() {
  const { foodEntries, addFoodEntry, updateFoodEntry, deleteFoodEntry } = useHealthData();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    type: 'breakfast' as const,
    description: '',
    time: '',
    portion: '',
    ingredients: [] as string[],
    notes: ''
  });
  const [newIngredient, setNewIngredient] = useState('');

  const getTimeBasedColor = (type: string, time: string): string => {
    if (type === 'breakfast') {
      return 'bg-amber-100 text-amber-800 border-amber-200'; // Morning colors
    }
    
    if (type === 'lunch') {
      return 'bg-sky-100 text-sky-800 border-sky-200'; // Midday colors
    }
    
    if (type === 'dinner') {
      return 'bg-purple-100 text-purple-800 border-purple-200'; // Evening colors
    }
    
    // For snacks, use time to determine color
    if (type === 'snack' && time) {
      const hour = parseInt(time.split(':')[0]);
      
      if (hour >= 5 && hour < 10) {
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Early morning
      } else if (hour >= 10 && hour < 14) {
        return 'bg-green-100 text-green-800 border-green-200'; // Mid-morning to early afternoon
      } else if (hour >= 14 && hour < 18) {
        return 'bg-blue-100 text-blue-800 border-blue-200'; // Afternoon
      } else if (hour >= 18 && hour < 22) {
        return 'bg-orange-100 text-orange-800 border-orange-200'; // Evening
      } else {
        return 'bg-indigo-100 text-indigo-800 border-indigo-200'; // Night
      }
    }
    
    return 'bg-gray-100 text-gray-800 border-gray-200'; // Default
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setNewEntry({
        ...newEntry,
        ingredients: [...newEntry.ingredients, newIngredient.trim()]
      });
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setNewEntry({
      ...newEntry,
      ingredients: newEntry.ingredients.filter((_, i) => i !== index)
    });
  };

  const addEntry = async () => {
    if (newEntry.description && newEntry.time) {
      if (editingId) {
        // Update existing entry
        await updateFoodEntry(editingId, {
          ...newEntry,
          date: formatDate(selectedDate)
        });
        setEditingId(null);
      } else {
        // Add new entry
        await addFoodEntry({
          ...newEntry,
          date: formatDate(selectedDate)
        });
      }
      setNewEntry({
        type: 'breakfast',
        description: '',
        time: '',
        portion: '',
        ingredients: [],
        notes: ''
      });
      setNewIngredient('');
    }
  };

  const removeEntry = async (id: string) => {
    await deleteFoodEntry(id);
    if (editingId === id) {
      setEditingId(null);
      setNewEntry({
        type: 'breakfast',
        description: '',
        time: '',
        portion: '',
        ingredients: [],
        notes: ''
      });
    }
  };

  const startEditing = (entry: FoodEntry) => {
    setEditingId(entry.id || null);
    setNewEntry({
      type: entry.type,
      description: entry.description,
      time: entry.time,
      portion: entry.portion || '',
      ingredients: entry.ingredients,
      notes: entry.notes || ''
    });
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setNewEntry({
      type: 'breakfast',
      description: '',
      time: '',
      portion: '',
      ingredients: [],
      notes: ''
    });
    setNewIngredient('');
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
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

  const getEntriesForDate = (date: Date): FoodEntry[] => {
    const dateStr = formatDate(date);
    return foodEntries
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

  const getMealStats = () => {
    const stats = {
      breakfast: currentDateEntries.filter(e => e.type === 'breakfast').length,
      lunch: currentDateEntries.filter(e => e.type === 'lunch').length,
      dinner: currentDateEntries.filter(e => e.type === 'dinner').length,
      snacks: currentDateEntries.filter(e => e.type === 'snack').length,
    };
    return stats;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return formatDate(date) === formatDate(today);
  };

  const stats = getMealStats();

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
        
        {/* Daily Stats */}
        {currentDateEntries.length > 0 && (
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {stats.breakfast > 0 && (
                <Badge className={getTimeBasedColor('breakfast', '')}>
                  {stats.breakfast} Breakfast{stats.breakfast > 1 ? 's' : ''}
                </Badge>
              )}
              {stats.lunch > 0 && (
                <Badge className={getTimeBasedColor('lunch', '')}>
                  {stats.lunch} Lunch{stats.lunch > 1 ? 'es' : ''}
                </Badge>
              )}
              {stats.dinner > 0 && (
                <Badge className={getTimeBasedColor('dinner', '')}>
                  {stats.dinner} Dinner{stats.dinner > 1 ? 's' : ''}
                </Badge>
              )}
              {stats.snacks > 0 && (
                <Badge className="bg-slate-100 text-slate-800 border-slate-200">
                  {stats.snacks} Snack{stats.snacks > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Add New Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" style={{ color: '#CD7F32' }} />
            Food Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="meal-type">Meal Type</Label>
            <Select value={newEntry.type} onValueChange={(value: any) => setNewEntry({ ...newEntry, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">What did you eat?</Label>
            <Input
              id="description"
              value={newEntry.description}
              onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
              placeholder="e.g., Grilled chicken salad with quinoa"
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
                className="flex-1 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
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

          <div>
            <Label htmlFor="portion">Portion/Quantity (optional)</Label>
            <Input
              id="portion"
              value={newEntry.portion}
              onChange={(e) => setNewEntry({ ...newEntry, portion: e.target.value })}
              placeholder="e.g., 1 cup, 200g, medium size"
            />
          </div>

          <div>
            <Label>Major Ingredients (optional)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  placeholder="Add an ingredient..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addIngredient();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addIngredient}
                  disabled={!newIngredient.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newEntry.ingredients.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {newEntry.ingredients.map((ingredient, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-xs flex items-center gap-1"
                    >
                      {ingredient}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredient(index)}
                        className="h-3 w-3 p-0 hover:bg-transparent"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={newEntry.notes}
              onChange={(e) => setNewEntry({ ...newEntry, notes: e.target.value })}
              placeholder="Any additional notes about the meal..."
              rows={2}
            />
          </div>

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

      {/* Food Log for Selected Date */}
      <div className="space-y-3">
        <h3>Food Log - {getDateDisplay(selectedDate)}</h3>
        {currentDateEntries.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No food entries for {getDateDisplay(selectedDate).toLowerCase()}. Add your first meal above!
            </CardContent>
          </Card>
        ) : (
          currentDateEntries.map((entry) => (
            <Card key={entry.id} className="relative overflow-hidden">
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        className={`${getTimeBasedColor(entry.type, entry.time)} border`}
                      >
                        <span className="capitalize">{entry.type}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">{entry.time}</span>
                    </div>
                    <p className="mb-1">{entry.description}</p>
                    {entry.portion && (
                      <p className="text-sm text-muted-foreground">
                        Portion: {entry.portion}
                      </p>
                    )}
                    {entry.ingredients && entry.ingredients.length > 0 && (
                      <div className="mb-1">
                        <p className="text-sm text-muted-foreground mb-1">Ingredients:</p>
                        <div className="flex flex-wrap gap-1">
                          {entry.ingredients.map((ingredient, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {ingredient}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
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
                      className="text-primary hover:text-primary hover:bg-primary/10 ml-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
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