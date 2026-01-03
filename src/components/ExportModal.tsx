import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import {
  exportAllDataAsJSON,
  exportFoodAsCSV,
  exportWaterAsCSV,
  exportExerciseAsCSV,
  exportSymptomsAsCSV
} from '../lib/export';

export function ExportModal() {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = async (exportFn: () => Promise<void>) => {
    await exportFn();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Your Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 py-4">
          <Button
            onClick={() => handleExport(exportAllDataAsJSON)}
            variant="outline"
            className="w-full justify-start"
          >
            <FileJson className="h-4 w-4 mr-2" />
            Complete Backup (JSON)
          </Button>

          <Button
            onClick={() => handleExport(exportFoodAsCSV)}
            variant="outline"
            className="w-full justify-start"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Food Log (CSV)
          </Button>

          <Button
            onClick={() => handleExport(exportWaterAsCSV)}
            variant="outline"
            className="w-full justify-start"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Water Log (CSV)
          </Button>

          <Button
            onClick={() => handleExport(exportExerciseAsCSV)}
            variant="outline"
            className="w-full justify-start"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exercise Log (CSV)
          </Button>

          <Button
            onClick={() => handleExport(exportSymptomsAsCSV)}
            variant="outline"
            className="w-full justify-start"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Symptoms Log (CSV)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
