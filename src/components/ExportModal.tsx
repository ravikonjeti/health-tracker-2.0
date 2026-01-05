import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import {
  exportAllDataAsJSON,
  exportUnifiedCSV
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
            onClick={() => handleExport(exportUnifiedCSV)}
            variant="outline"
            className="w-full justify-start"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Unified Health Log (CSV)
          </Button>

          <p className="text-xs text-muted-foreground px-1 pt-2">
            The unified CSV includes all categories (Food, Water, Exercise, Bowel, Symptoms, Medicine, Weight) sorted chronologically.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
