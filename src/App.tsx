import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from './components/ui/dialog';
import { Button } from './components/ui/button';
import { FoodTracker } from './components/FoodTracker';
import { WaterTracker } from './components/WaterTracker';
import { ExerciseTracker } from './components/ExerciseTracker';
import { BowelTracker } from './components/BowelTracker';
import { SymptomsTracker } from './components/SymptomsTracker';
import { MedicationsTracker } from './components/MedicationsTracker';
import { WeightTracker } from './components/WeightTracker';
import { SleepTracker } from './components/SleepTracker';
import { InsightsTracker } from './components/InsightsTracker';
import { ProfilePage } from './components/ProfilePage';
import { InstallPrompt } from './components/InstallPrompt';
import { Utensils, Droplets, Dumbbell, Heart, Stethoscope, Pill, Scale, Moon, TrendingUp, User } from 'lucide-react';

export default function App() {
  return (
    <>
      <div className="min-h-screen bg-background pb-3 px-3 w-full overflow-x-hidden" style={{ paddingTop: '75px' }}>
        <div className="mb-4 max-w-full">
          <div className="flex items-center justify-between mb-2 gap-2">
            <h1 className="text-xl font-bold text-primary flex-shrink">Health Tracker</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="flex-shrink-0">
                  <User className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                <ProfilePage />
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-center text-muted-foreground text-xs mb-3">
            Track your daily wellness journey
          </p>
        </div>

        <Tabs defaultValue="food" className="w-full">
          <TabsList className="flex justify-between w-full mb-4 h-auto gap-1 p-2 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="food" className="p-2 h-auto min-h-0 flex-1" title="Food">
              <Utensils className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="water" className="p-2 h-auto min-h-0 flex-1" title="Water">
              <Droplets className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="exercise" className="p-2 h-auto min-h-0 flex-1" title="Exercise">
              <Dumbbell className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="bowel" className="p-2 h-auto min-h-0 flex-1" title="Bowel">
              <Heart className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="symptoms" className="p-2 h-auto min-h-0 flex-1" title="Symptoms">
              <Stethoscope className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="medicine" className="p-2 h-auto min-h-0 flex-1" title="Medicine">
              <Pill className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="weight" className="p-2 h-auto min-h-0 flex-1" title="Weight">
              <Scale className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="sleep" className="p-2 h-auto min-h-0 flex-1" title="Sleep">
              <Moon className="h-4 w-4" />
            </TabsTrigger>
            <TabsTrigger value="insights" className="p-2 h-auto min-h-0 flex-1" title="Insights">
              <TrendingUp className="h-4 w-4" />
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

          <TabsContent value="sleep">
            <SleepTracker />
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
