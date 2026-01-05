import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { FoodTracker } from './components/FoodTracker';
import { WaterTracker } from './components/WaterTracker';
import { ExerciseTracker } from './components/ExerciseTracker';
import { BowelTracker } from './components/BowelTracker';
import { SymptomsTracker } from './components/SymptomsTracker';
import { MedicationsTracker } from './components/MedicationsTracker';
import { WeightTracker } from './components/WeightTracker';
import { InsightsTracker } from './components/InsightsTracker';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { InstallPrompt } from './components/InstallPrompt';
import { Utensils, Droplets, Dumbbell, Heart, Stethoscope, Pill, Scale, TrendingUp } from 'lucide-react';

export default function App() {
  return (
    <>
      <div className="min-h-screen bg-background pb-3 px-3 w-full overflow-x-hidden" style={{ paddingTop: '75px' }}>
        <div className="mb-4 max-w-full">
          <div className="flex items-center justify-between mb-2 gap-2">
            <h1 className="text-xl font-bold text-primary flex-shrink">Health Tracker</h1>
            <div className="flex gap-1 flex-shrink-0">
              <ExportModal />
              <ImportModal />
            </div>
          </div>
          <p className="text-center text-muted-foreground text-xs mb-3">
            Track your daily wellness journey
          </p>
        </div>

        <Tabs defaultValue="food" className="w-full">
          <TabsList className="flex justify-between w-full mb-4 h-auto gap-1 p-2 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="food" className="p-3 h-auto min-h-0 flex-1" title="Food">
              <Utensils className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger value="water" className="p-3 h-auto min-h-0 flex-1" title="Water">
              <Droplets className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger value="exercise" className="p-3 h-auto min-h-0 flex-1" title="Exercise">
              <Dumbbell className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger value="bowel" className="p-3 h-auto min-h-0 flex-1" title="Bowel">
              <Heart className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger value="symptoms" className="p-3 h-auto min-h-0 flex-1" title="Symptoms">
              <Stethoscope className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger value="medicine" className="p-3 h-auto min-h-0 flex-1" title="Medicine">
              <Pill className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger value="weight" className="p-3 h-auto min-h-0 flex-1" title="Weight">
              <Scale className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger value="insights" className="p-3 h-auto min-h-0 flex-1" title="Insights">
              <TrendingUp className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="food">
            <FoodTracker />
          </TabsContent>

          <TabsContent value="water">
            <WaterTracker />
          </TabsContent>

          <TabsContent value="exercise">
            <ExerciseTracker />
          </TabsContent>

          <TabsContent value="bowel">
            <BowelTracker />
          </TabsContent>

          <TabsContent value="symptoms">
            <SymptomsTracker />
          </TabsContent>

          <TabsContent value="medicine">
            <MedicationsTracker />
          </TabsContent>

          <TabsContent value="weight">
            <WeightTracker />
          </TabsContent>

          <TabsContent value="insights">
            <InsightsTracker />
          </TabsContent>
        </Tabs>
      </div>

      <InstallPrompt />
    </>
  );
}
