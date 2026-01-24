import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Trash2, Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Pencil, Pill, Check, Settings } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { Medication, MedicationLog } from '../lib/database';

export function MedicationsTracker() {
  const {
    medications,
    medicationLogs,
    addMedication,
    updateMedication,
    deleteMedication,
    addMedicationLog,
    updateMedicationLog,
    deleteMedicationLog
  } = useHealthData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);
  const [editingQuickLogId, setEditingQuickLogId] = useState<string | null>(null);
  
  // For adding/editing medications in the list
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    notes: ''
  });

  // For logging medication intake
  const [newLog, setNewLog] = useState({
    medicationId: '',
    time: '',
    notes: ''
  });

  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // For one-time medication logging (without adding to list)
  const [quickMed, setQuickMed] = useState({
    name: '',
    dosage: '',
    time: '',
    notes: ''
  });

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

  const getLogsForDate = (date: Date): MedicationLog[] => {
    const dateStr = formatDate(date);
    return medicationLogs
      .filter(log => log.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const currentDateLogs = getLogsForDate(selectedDate);

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

  // Medication list management
  const handleAddMedication = async () => {
    if (newMedication.name && newMedication.dosage) {
      if (editingMedId) {
        await updateMedication(editingMedId, newMedication);
        setEditingMedId(null);
      } else {
        await addMedication(newMedication);
      }
      setNewMedication({ name: '', dosage: '', notes: '' });
    }
  };

  const handleRemoveMedication = async (id: string) => {
    await deleteMedication(id);
    if (editingMedId === id) {
      setEditingMedId(null);
      setNewMedication({ name: '', dosage: '', notes: '' });
    }
  };

  const startEditingMedication = (medication: Medication) => {
    setEditingMedId(medication.id);
    setNewMedication({
      name: medication.name,
      dosage: medication.dosage,
      notes: medication.notes || ''
    });
  };

  const cancelEditingMedication = () => {
    setEditingMedId(null);
    setNewMedication({ name: '', dosage: '', notes: '' });
  };

  // Medication log management
  const handleAddLog = async () => {
    if (newLog.medicationId && newLog.time) {
      const medication = medications.find(m => m.id === newLog.medicationId);
      if (!medication) return;

      if (editingId) {
        await updateMedicationLog(editingId, {
          medicationId: newLog.medicationId,
          medicationName: medication.name,
          dosage: medication.dosage,
          time: newLog.time,
          notes: newLog.notes,
          date: formatDate(selectedDate)
        });
        setEditingId(null);
      } else {
        await addMedicationLog({
          medicationId: newLog.medicationId,
          medicationName: medication.name,
          dosage: medication.dosage,
          time: newLog.time,
          notes: newLog.notes,
          date: formatDate(selectedDate)
        });
      }
      setNewLog({ medicationId: '', time: '', notes: '' });
    }
  };

  const handleRemoveLog = async (id: string) => {
    await deleteMedicationLog(id);
    if (editingId === id) {
      setEditingId(null);
      setNewLog({ medicationId: '', time: '', notes: '' });
    }
    if (editingQuickLogId === id) {
      setEditingQuickLogId(null);
      setQuickMed({ name: '', dosage: '', time: '', notes: '' });
    }
  };

  const startEditingLog = (log: MedicationLog) => {
    // Check if this log was created via quick-add (not in medication list)
    const isQuickAddLog = !medications.find(m => m.id === log.medicationId);

    if (isQuickAddLog) {
      // Edit in quick-add form (at top)
      setEditingQuickLogId(log.id || null);
      setQuickMed({
        name: log.medicationName,
        dosage: log.dosage,
        time: log.time,
        notes: log.notes || ''
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Edit in manual log form (further down page)
      setEditingId(log.id || null);
      setNewLog({
        medicationId: log.medicationId,
        time: log.time,
        notes: log.notes || ''
      });
      // Scroll to the manual log form
      setTimeout(() => {
        document.getElementById('manual-log-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const cancelEditingLog = () => {
    setEditingId(null);
    setNewLog({ medicationId: '', time: '', notes: '' });
  };

  // Quick log for a medication
  const handleQuickLog = async (medication: Medication) => {
    await addMedicationLog({
      medicationId: medication.id!,
      medicationName: medication.name,
      dosage: medication.dosage,
      time: getCurrentTime(),
      date: formatDate(selectedDate)
    });
  };

  // Add quick medication (one-time, not saved to list)
  const handleAddQuickMedication = async () => {
    if (quickMed.name && quickMed.dosage && quickMed.time) {
      if (editingQuickLogId) {
        // Update existing quick-add log
        await updateMedicationLog(editingQuickLogId, {
          medicationId: 'quick-' + Date.now(), // Keep it as a quick-add med
          medicationName: quickMed.name,
          dosage: quickMed.dosage,
          time: quickMed.time,
          notes: quickMed.notes,
          date: formatDate(selectedDate)
        });
        setEditingQuickLogId(null);
      } else {
        // Add new quick-add log
        await addMedicationLog({
          medicationId: 'quick-' + Date.now(), // Temporary ID for non-list meds
          medicationName: quickMed.name,
          dosage: quickMed.dosage,
          time: quickMed.time,
          notes: quickMed.notes,
          date: formatDate(selectedDate)
        });
      }
      setQuickMed({ name: '', dosage: '', time: '', notes: '' });
      setShowQuickAdd(false);
    }
  };

  const cancelQuickAdd = () => {
    setShowQuickAdd(false);
    setEditingQuickLogId(null);
    setQuickMed({ name: '', dosage: '', time: '', notes: '' });
  };

  // Check if medication has been logged today
  const isMedicationLoggedToday = (medicationId: string | undefined): boolean => {
    if (!medicationId) return false;
    return currentDateLogs.some(log => log.medicationId === medicationId);
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

      {/* Quick Add Medication Form (Always visible) */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingQuickLogId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingQuickLogId ? 'Edit Medication Log' : 'Log What I Took Today'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="quick-name">Medication Name</Label>
            <Input
              id="quick-name"
              value={quickMed.name}
              onChange={(e) => setQuickMed({ ...quickMed, name: e.target.value })}
              placeholder="e.g., Aspirin, Vitamin D"
            />
          </div>

          <div>
            <Label htmlFor="quick-dosage">Dosage</Label>
            <Input
              id="quick-dosage"
              value={quickMed.dosage}
              onChange={(e) => setQuickMed({ ...quickMed, dosage: e.target.value })}
              placeholder="e.g., 100mg, 1 tablet"
            />
          </div>

          <div>
            <Label htmlFor="quick-time">Time</Label>
            <div className="flex gap-2">
              <Input
                id="quick-time"
                type="time"
                value={quickMed.time}
                onChange={(e) => setQuickMed({ ...quickMed, time: e.target.value })}
                className="flex-1"
              />
              <Button
                type="button"
                variant="default"
                size="default"
                onClick={() => setQuickMed({ ...quickMed, time: getCurrentTime() })}
                className="px-4 py-2 shrink-0"
              >
                <Clock className="h-4 w-4 mr-2" />
                Now
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="quick-notes">Notes (optional)</Label>
            <Textarea
              id="quick-notes"
              value={quickMed.notes}
              onChange={(e) => setQuickMed({ ...quickMed, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleAddQuickMedication} className={editingQuickLogId ? "flex-1" : "w-full"}>
              {editingQuickLogId ? 'Update Medication' : 'Log Medication'}
            </Button>
            {editingQuickLogId && (
              <Button
                variant="outline"
                onClick={cancelQuickAdd}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manage Medications Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Manage My Medication List
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Medications</DialogTitle>
            <DialogDescription>
              Add or edit your daily medications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="med-name">Medication Name</Label>
                <Input
                  id="med-name"
                  value={newMedication.name}
                  onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
                  placeholder="e.g., Aspirin, Vitamin D"
                />
              </div>

              <div>
                <Label htmlFor="med-dosage">Dosage</Label>
                <Input
                  id="med-dosage"
                  value={newMedication.dosage}
                  onChange={(e) => setNewMedication({ ...newMedication, dosage: e.target.value })}
                  placeholder="e.g., 100mg, 1 tablet"
                />
              </div>

              <div>
                <Label htmlFor="med-notes">Notes (optional)</Label>
                <Textarea
                  id="med-notes"
                  value={newMedication.notes}
                  onChange={(e) => setNewMedication({ ...newMedication, notes: e.target.value })}
                  placeholder="e.g., Take with food, morning only"
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddMedication} className={editingMedId ? "flex-1" : "w-full"}>
                  {editingMedId ? 'Update Medication' : 'Add Medication'}
                </Button>
                {editingMedId && (
                  <Button
                    variant="outline"
                    onClick={cancelEditingMedication}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>

            {medications.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm">Your Medications</h4>
                {medications.map((medication) => (
                  <Card key={medication.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="mb-1">{medication.name}</p>
                          <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                          {medication.notes && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              {medication.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingMedication(medication)}
                            className="text-primary hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMedication(medication.id!)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Log Section */}
      {medications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5" />
              Quick Log
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {medications.map((medication) => (
              <div key={medication.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex-1">
                  <p className="text-sm">{medication.name}</p>
                  <p className="text-xs text-muted-foreground">{medication.dosage}</p>
                </div>
                {isMedicationLoggedToday(medication.id) ? (
                  <Badge className="bg-green-100 text-green-800">
                    <Check className="h-3 w-3 mr-1" />
                    Logged
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleQuickLog(medication)}
                  >
                    Log Now
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Manual Log Entry Form */}
      {medications.length > 0 && (
        <Card id="manual-log-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingId ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId ? 'Edit Medication Log' : 'Manual Log Entry'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="log-medication">Medication</Label>
              <select
                id="log-medication"
                value={newLog.medicationId}
                onChange={(e) => setNewLog({ ...newLog, medicationId: e.target.value })}
                className="w-full h-10 px-3 border border-input bg-background rounded-md"
              >
                <option value="">Select medication...</option>
                {medications.map((medication) => (
                  <option key={medication.id} value={medication.id}>
                    {medication.name} - {medication.dosage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="log-time">Time</Label>
              <div className="flex gap-2">
                <Input
                  id="log-time"
                  type="time"
                  value={newLog.time}
                  onChange={(e) => setNewLog({ ...newLog, time: e.target.value })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="default"
                  size="default"
                  onClick={() => setNewLog({ ...newLog, time: getCurrentTime() })}
                  className="px-4 py-2 shrink-0"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Now
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="log-notes">Notes (optional)</Label>
              <Textarea
                id="log-notes"
                value={newLog.notes}
                onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddLog} className={editingId ? "flex-1" : "w-full"}>
                {editingId ? 'Update Log' : 'Add Log'}
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={cancelEditingLog}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No medications message */}
      {medications.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No medications in your list. Click "Manage Medication List" to add your daily medications.
          </CardContent>
        </Card>
      )}

      {/* Medication Log for Selected Date */}
      <div className="space-y-3">
        <h3>Medication Log - {getDateDisplay(selectedDate)}</h3>
        {currentDateLogs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No medications logged for {getDateDisplay(selectedDate).toLowerCase()}.
            </CardContent>
          </Card>
        ) : (
          currentDateLogs.map((log) => (
            <Card key={log.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Pill className="h-4 w-4 text-primary" />
                      <p>{log.medicationName}</p>
                      <span className="text-sm text-muted-foreground ml-auto">{log.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.dosage}</p>
                    {log.notes && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        {log.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditingLog(log)}
                      className="text-primary hover:text-primary ml-2"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLog(log.id!)}
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