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
import { Plus, Trash2, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Utensils, Pencil, BookOpen, ChefHat, ScanBarcode, Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { useHealthData } from '../contexts/HealthDataContext';
import { FoodEntry, Recipe, RecipeIngredient } from '../lib/database';
import { BarcodeScanner } from './BarcodeScanner';

export function FoodTracker() {
  const { foodEntries, addFoodEntry, updateFoodEntry, deleteFoodEntry, recipes, addRecipe, deleteRecipe, updateRecipe } = useHealthData();
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
  const [showRecipeBook, setShowRecipeBook] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    ingredients: [] as RecipeIngredient[],
    notes: ''
  });
  const [newRecipeIngredient, setNewRecipeIngredient] = useState({ name: '', quantity: '' });
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySearchQuery, setCopySearchQuery] = useState('');

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

  const handleBarcodeScanSuccess = (productInfo: any) => {
    // Build description
    const description = productInfo.brand
      ? `${productInfo.brand} - ${productInfo.name}`
      : productInfo.name;

    // Build nutrition notes
    let notes = '';
    if (productInfo.nutrition) {
      const parts = [];
      if (productInfo.nutrition.calories) parts.push(`Calories: ${productInfo.nutrition.calories}kcal`);
      if (productInfo.nutrition.protein) parts.push(`Protein: ${productInfo.nutrition.protein}g`);
      if (productInfo.nutrition.carbs) parts.push(`Carbs: ${productInfo.nutrition.carbs}g`);
      if (productInfo.nutrition.fat) parts.push(`Fat: ${productInfo.nutrition.fat}g`);
      notes = parts.join(', ');
    }

    // Auto-populate form
    setNewEntry({
      ...newEntry,
      description,
      portion: productInfo.portion || '',
      ingredients: productInfo.ingredients || [],
      notes
    });
  };

  const addEntry = async () => {
    if (newEntry.description && newEntry.time) {
      if (editingId) {
        // Update existing entry - use editDate if set, otherwise selectedDate
        await updateFoodEntry(editingId, {
          ...newEntry,
          date: formatDate(editDate || selectedDate)
        });
        setEditingId(null);
        setEditDate(null);
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
    // Set the edit date from the entry
    setEditDate(new Date(entry.date + 'T00:00:00'));
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditDate(null);
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

  const copyEntry = (entry: FoodEntry) => {
    setNewEntry({
      type: entry.type,
      description: entry.description,
      time: getCurrentTime(), // Use current time instead of original
      portion: entry.portion || '',
      ingredients: [...entry.ingredients], // Create a copy of the array
      notes: entry.notes || ''
    });
    setShowCopyDialog(false);
    // Scroll to top to show the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getCurrentTime = () => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  };

  const getMealTypeFromTime = (time: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // 6 AM - 12 PM: Breakfast (360 - 720 minutes)
    if (totalMinutes >= 360 && totalMinutes < 720) {
      return 'breakfast';
    }
    // 12 PM - 3 PM: Lunch (720 - 900 minutes)
    else if (totalMinutes >= 720 && totalMinutes < 900) {
      return 'lunch';
    }
    // 3 PM - 6 PM: Snack (900 - 1080 minutes)
    else if (totalMinutes >= 900 && totalMinutes < 1080) {
      return 'snack';
    }
    // 6 PM - 10 PM: Dinner (1080 - 1320 minutes)
    else if (totalMinutes >= 1080 && totalMinutes < 1320) {
      return 'dinner';
    }
    // 10 PM - 6 AM: Default to snack
    else {
      return 'snack';
    }
  };

  const handleTimeChange = (time: string) => {
    const mealType = getMealTypeFromTime(time);
    setNewEntry({ ...newEntry, time, type: mealType });
  };

  const handleNowClick = () => {
    const currentTime = getCurrentTime();
    const mealType = getMealTypeFromTime(currentTime);
    setNewEntry({ ...newEntry, time: currentTime, type: mealType });
  };

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

  // Recipe management functions
  const addRecipeIngredient = () => {
    if (newRecipeIngredient.name.trim() && newRecipeIngredient.quantity.trim()) {
      setNewRecipe({
        ...newRecipe,
        ingredients: [...newRecipe.ingredients, { ...newRecipeIngredient }]
      });
      setNewRecipeIngredient({ name: '', quantity: '' });
    }
  };

  const removeRecipeIngredient = (index: number) => {
    setNewRecipe({
      ...newRecipe,
      ingredients: newRecipe.ingredients.filter((_, i) => i !== index)
    });
  };

  const saveRecipe = async () => {
    if (newRecipe.name && newRecipe.ingredients.length > 0) {
      if (editingRecipeId) {
        await updateRecipe(editingRecipeId, newRecipe);
        setEditingRecipeId(null);
      } else {
        await addRecipe(newRecipe);
      }
      setNewRecipe({ name: '', ingredients: [], notes: '' });
      setNewRecipeIngredient({ name: '', quantity: '' });
    }
  };

  const removeRecipe = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recipe?')) {
      await deleteRecipe(id);
      if (editingRecipeId === id) {
        setEditingRecipeId(null);
        setNewRecipe({ name: '', ingredients: [], notes: '' });
      }
    }
  };

  const startEditingRecipe = (recipe: Recipe) => {
    setEditingRecipeId(recipe.id || null);
    setNewRecipe({
      name: recipe.name,
      ingredients: recipe.ingredients,
      notes: recipe.notes || ''
    });
    setShowRecipeBook(true);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const cancelEditingRecipe = () => {
    setEditingRecipeId(null);
    setNewRecipe({ name: '', ingredients: [], notes: '' });
    setNewRecipeIngredient({ name: '', quantity: '' });
  };

  const useRecipeForFood = (recipe: Recipe) => {
    setNewEntry({
      ...newEntry,
      description: recipe.name,
      ingredients: recipe.ingredients.map(ing => ing.name)
    });
    setShowRecipeBook(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5" style={{ color: '#CD7F32' }} />
              Food Entry
            </div>
            {!editingId && (
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowCopyDialog(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
                <Button
                  onClick={() => setShowBarcodeScanner(true)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <ScanBarcode className="h-4 w-4" />
                  Scan
                </Button>
              </div>
            )}
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

          {editingId && editDate && (
            <div>
              <Label htmlFor="edit-date">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {getDateDisplay(editDate)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={(date) => date && setEditDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

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
                onChange={(e) => handleTimeChange(e.target.value)}
                className="flex-1 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
              />
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={handleNowClick}
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

      {/* Recipe Book Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Recipe Book
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecipeBook(!showRecipeBook)}
            >
              {showRecipeBook ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showRecipeBook && (
          <CardContent className="space-y-4">
            {/* Add/Edit Recipe Form */}
            <Card className="border-2 border-dashed">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <Label htmlFor="recipe-name">Recipe Name</Label>
                  <Input
                    id="recipe-name"
                    value={newRecipe.name}
                    onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                    placeholder="e.g., My favorite smoothie"
                  />
                </div>

                <div>
                  <Label>Ingredients</Label>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={newRecipeIngredient.name}
                        onChange={(e) => setNewRecipeIngredient({ ...newRecipeIngredient, name: e.target.value })}
                        placeholder="Ingredient name"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            document.getElementById('ingredient-quantity')?.focus();
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Input
                          id="ingredient-quantity"
                          value={newRecipeIngredient.quantity}
                          onChange={(e) => setNewRecipeIngredient({ ...newRecipeIngredient, quantity: e.target.value })}
                          placeholder="Quantity"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addRecipeIngredient();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={addRecipeIngredient}
                          disabled={!newRecipeIngredient.name.trim() || !newRecipeIngredient.quantity.trim()}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {newRecipe.ingredients.length > 0 && (
                      <div className="space-y-1">
                        {newRecipe.ingredients.map((ingredient, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">
                              <span className="font-medium">{ingredient.name}</span> - {ingredient.quantity}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRecipeIngredient(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="recipe-notes">Notes (optional)</Label>
                  <Textarea
                    id="recipe-notes"
                    value={newRecipe.notes}
                    onChange={(e) => setNewRecipe({ ...newRecipe, notes: e.target.value })}
                    placeholder="Cooking instructions or additional notes..."
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={saveRecipe} className={editingRecipeId ? "flex-1" : "w-full"} disabled={!newRecipe.name || newRecipe.ingredients.length === 0}>
                    <ChefHat className="h-4 w-4 mr-2" />
                    {editingRecipeId ? 'Update Recipe' : 'Save Recipe'}
                  </Button>
                  {editingRecipeId && (
                    <Button
                      variant="outline"
                      onClick={cancelEditingRecipe}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Saved Recipes List */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Saved Recipes ({recipes.length})</h4>
              {recipes.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground text-sm">
                    No recipes saved yet. Create your first recipe above!
                  </CardContent>
                </Card>
              ) : (
                recipes.map((recipe) => (
                  <Card key={recipe.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <ChefHat className="h-4 w-4" />
                            {recipe.name}
                          </h4>
                          <div className="space-y-1 mb-2">
                            {recipe.ingredients.map((ingredient, index) => (
                              <div key={index} className="text-sm text-muted-foreground">
                                • {ingredient.name} - {ingredient.quantity}
                              </div>
                            ))}
                          </div>
                          {recipe.notes && (
                            <p className="text-sm text-muted-foreground italic">
                              {recipe.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => useRecipeForFood(recipe)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Use this recipe for a food entry"
                          >
                            <Utensils className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingRecipe(recipe)}
                            className="text-primary hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRecipe(recipe.id!)}
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
          </CardContent>
        )}
      </Card>

      {/* Copy from Previous Dialog */}
      <Dialog
        open={showCopyDialog}
        onOpenChange={(open) => {
          setShowCopyDialog(open);
          if (!open) setCopySearchQuery(''); // Reset search when closing
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle>Copy from Previous Entries</DialogTitle>
          </DialogHeader>

          {/* Search Input - Fixed at top */}
          <div className="px-6 pb-4">
            <Input
              placeholder="Search by name, ingredients, or notes..."
              value={copySearchQuery}
              onChange={(e) => setCopySearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Scrollable Results */}
          <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
            {(() => {
              const filteredEntries = foodEntries
                .filter((entry) => {
                  if (!copySearchQuery) return true;
                  const query = copySearchQuery.toLowerCase();
                  return (
                    entry.description.toLowerCase().includes(query) ||
                    entry.ingredients.some(ing => ing.toLowerCase().includes(query)) ||
                    entry.notes?.toLowerCase().includes(query) ||
                    entry.portion?.toLowerCase().includes(query)
                  );
                })
                .sort((a, b) => {
                  const dateCompare = b.date.localeCompare(a.date);
                  if (dateCompare !== 0) return dateCompare;
                  return b.time.localeCompare(a.time);
                });

              if (filteredEntries.length === 0) {
                return (
                  <div className="text-center py-8 text-muted-foreground">
                    {copySearchQuery
                      ? 'No entries match your search'
                      : 'No previous entries to copy from'}
                  </div>
                );
              }

              return filteredEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => copyEntry(entry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTimeBasedColor(entry.type, entry.time)}>
                            {entry.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {getDateDisplay(new Date(entry.date + 'T00:00:00'))} at {entry.time}
                          </span>
                        </div>
                        <h4 className="font-medium mb-1">{entry.description}</h4>
                        {entry.portion && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Portion: {entry.portion}
                          </p>
                        )}
                        {entry.ingredients.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {entry.ingredients.map((ing, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {ing}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <Copy className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <BarcodeScanner
          onScanSuccess={handleBarcodeScanSuccess}
          onClose={() => setShowBarcodeScanner(false)}
        />
      )}
    </div>
  );
}