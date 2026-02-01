import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Plus, Trash2, AlertTriangle, Edit2, X, Check } from 'lucide-react';
import { useHealthData } from '../contexts/HealthDataContext';
import { KnownAllergy } from '../lib/database';

export function KnownAllergiesTracker() {
  const { knownAllergies, addKnownAllergy, deleteKnownAllergy, updateKnownAllergy } = useHealthData();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    severity: 'moderate' as 'mild' | 'moderate' | 'severe' | 'anaphylaxis',
    symptoms: [] as string[],
    symptomInput: '',
    notes: '',
    diagnosedDate: '',
    lastReaction: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      severity: 'moderate',
      symptoms: [],
      symptomInput: '',
      notes: '',
      diagnosedDate: '',
      lastReaction: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (allergy: KnownAllergy) => {
    setFormData({
      name: allergy.name,
      severity: allergy.severity,
      symptoms: allergy.symptoms || [],
      symptomInput: '',
      notes: allergy.notes || '',
      diagnosedDate: allergy.diagnosedDate || '',
      lastReaction: allergy.lastReaction || ''
    });
    setEditingId(allergy.id!);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const allergyData = {
      name: formData.name,
      severity: formData.severity,
      symptoms: formData.symptoms,
      notes: formData.notes || undefined,
      diagnosedDate: formData.diagnosedDate || undefined,
      lastReaction: formData.lastReaction || undefined
    };

    if (editingId) {
      await updateKnownAllergy(editingId, allergyData);
    } else {
      await addKnownAllergy(allergyData);
    }

    resetForm();
  };

  const handleAddSymptom = () => {
    if (formData.symptomInput.trim()) {
      setFormData({
        ...formData,
        symptoms: [...formData.symptoms, formData.symptomInput.trim()],
        symptomInput: ''
      });
    }
  };

  const handleRemoveSymptom = (index: number) => {
    setFormData({
      ...formData,
      symptoms: formData.symptoms.filter((_, i) => i !== index)
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'anaphylaxis':
        return 'bg-red-600 text-white';
      case 'severe':
        return 'bg-red-500 text-white';
      case 'moderate':
        return 'bg-orange-500 text-white';
      case 'mild':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <CardTitle>Known Allergies</CardTitle>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Allergy
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Add/Edit Form */}
          {showForm && (
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="allergy-name">Allergen Name *</Label>
                    <Input
                      id="allergy-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Peanuts, Shellfish, Dairy"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="severity">Severity *</Label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                    >
                      <SelectTrigger id="severity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mild">Mild (Minor discomfort)</SelectItem>
                        <SelectItem value="moderate">Moderate (Noticeable symptoms)</SelectItem>
                        <SelectItem value="severe">Severe (Serious reaction)</SelectItem>
                        <SelectItem value="anaphylaxis">Anaphylaxis (Life-threatening)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Common Symptoms</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.symptomInput}
                        onChange={(e) => setFormData({ ...formData, symptomInput: e.target.value })}
                        placeholder="e.g., Hives, Nausea, Swelling"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSymptom();
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddSymptom} variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {formData.symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.symptoms.map((symptom, index) => (
                          <Badge key={index} variant="secondary" className="gap-1">
                            {symptom}
                            <button
                              type="button"
                              onClick={() => handleRemoveSymptom(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="diagnosed-date">Diagnosed Date</Label>
                      <Input
                        id="diagnosed-date"
                        type="date"
                        value={formData.diagnosedDate}
                        onChange={(e) => setFormData({ ...formData, diagnosedDate: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last-reaction">Last Reaction</Label>
                      <Input
                        id="last-reaction"
                        type="date"
                        value={formData.lastReaction}
                        onChange={(e) => setFormData({ ...formData, lastReaction: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="allergy-notes">Notes</Label>
                    <Input
                      id="allergy-notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Additional information..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      <Check className="h-4 w-4 mr-2" />
                      {editingId ? 'Update' : 'Add'} Allergy
                    </Button>
                    <Button type="button" onClick={resetForm} variant="outline">
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Allergies List */}
          <div className="space-y-3">
            {knownAllergies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                <p>No known allergies recorded</p>
                <p className="text-sm mt-1">Click "Add Allergy" to track your food allergies</p>
              </div>
            ) : (
              knownAllergies.map((allergy) => (
                <Card key={allergy.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold capitalize">{allergy.name}</h4>
                          <Badge className={getSeverityColor(allergy.severity)}>
                            {allergy.severity}
                          </Badge>
                        </div>

                        {allergy.symptoms && allergy.symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {allergy.symptoms.map((symptom, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {allergy.notes && (
                          <p className="text-sm text-muted-foreground mb-2">{allergy.notes}</p>
                        )}

                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {allergy.diagnosedDate && (
                            <span>Diagnosed: {new Date(allergy.diagnosedDate).toLocaleDateString()}</span>
                          )}
                          {allergy.lastReaction && (
                            <span>Last reaction: {new Date(allergy.lastReaction).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleEdit(allergy)}
                          variant="ghost"
                          size="icon"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => {
                            if (confirm(`Delete allergy: ${allergy.name}?`)) {
                              deleteKnownAllergy(allergy.id!);
                            }
                          }}
                          variant="ghost"
                          size="icon"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
