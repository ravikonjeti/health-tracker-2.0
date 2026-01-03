import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { FoodTracker } from './components/FoodTracker';
import { WaterTracker } from './components/WaterTracker';
import { ExerciseTracker } from './components/ExerciseTracker';
import { BowelTracker } from './components/BowelTracker';
import { SymptomsTracker } from './components/SymptomsTracker';
import { InsightsTracker } from './components/InsightsTracker';
import { ExportModal } from './components/ExportModal';
import { ImportModal } from './components/ImportModal';
import { InstallPrompt } from './components/InstallPrompt';
import { Utensils, Droplets, Dumbbell, Heart, Stethoscope, TrendingUp } from 'lucide-react';

export default function App() {
  return (
    <>
      <div className="min-h-screen bg-background p-3 w-full overflow-x-hidden">
        <div className="mb-4 max-w-full">
          <div className="flex items-center justify-between mb-2 gap-2">
            <h1 className="text-xl font-bold text-primary flex-shrink">Health Tracker</h1>
            <div className="flex gap-1 flex-shrink-0">
              <ExportModal />
              <ImportModal />
            </div>
          </div>
          <p className="text-center text-muted-foreground text-xs">
            Track your daily wellness journey and discover patterns
          </p>
        </div>

        <Tabs defaultValue="food" className="w-full">
          <TabsList className="grid grid-cols-6 w-full mb-4 h-auto gap-0">
            <TabsTrigger value="food" className="flex-col py-2 px-1 h-auto min-h-[3rem]">
              <Utensils className="h-4 w-4 mb-1" />
              <span className="text-[10px] leading-tight">Food</span>
            </TabsTrigger>
            <TabsTrigger value="water" className="flex-col py-2 px-1 h-auto min-h-[3rem]">
              <Droplets className="h-4 w-4 mb-1" />
              <span className="text-[10px] leading-tight">Water</span>
            </TabsTrigger>
            <TabsTrigger value="exercise" className="flex-col py-2 px-1 h-auto min-h-[3rem]">
              <Dumbbell className="h-4 w-4 mb-1" />
              <span className="text-[10px] leading-tight">Exercise</span>
            </TabsTrigger>
            <TabsTrigger value="bowel" className="flex-col py-2 px-1 h-auto min-h-[3rem]">
              <Heart className="h-4 w-4 mb-1" />
              <span className="text-[10px] leading-tight">Bowel</span>
            </TabsTrigger>
            <TabsTrigger value="symptoms" className="flex-col py-2 px-1 h-auto min-h-[3rem]">
              <Stethoscope className="h-4 w-4 mb-1" />
              <span className="text-[10px] leading-tight">Symptoms</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex-col py-2 px-1 h-auto min-h-[3rem]">
              <TrendingUp className="h-4 w-4 mb-1" />
              <span className="text-[10px] leading-tight">Insights</span>
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

          <TabsContent value="insights">
            <InsightsTracker />
          </TabsContent>
        </Tabs>
      </div>

      <InstallPrompt />
    </>
  );
}
