import React, { useEffect, useState } from 'react';
import { BarcodeScanner as CapacitorBarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, X, CheckCircle2, ScanBarcode } from 'lucide-react';

interface ProductInfo {
  name: string;
  brand?: string;
  ingredients?: string[];
  portion?: string;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

interface BarcodeScannerProps {
  onScanSuccess: (productInfo: ProductInfo) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  useEffect(() => {
    // Check permissions on mount
    checkPermissions();

    return () => {
      // Cleanup on unmount
      stopScanning();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const { camera } = await CapacitorBarcodeScanner.checkPermissions();

      if (camera === 'granted') {
        setPermissionGranted(true);
      } else if (camera === 'denied') {
        setPermissionGranted(false);
        setError('Camera permission denied. Please enable camera access in your device settings.');
      } else {
        // Permission not determined yet - will be requested when starting scan
        setPermissionGranted(null);
      }
    } catch (err: any) {
      console.error('Error checking permissions:', err);
      setError(`Permission check failed: ${err.message || 'Unknown error'}`);
      setPermissionGranted(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const { camera } = await CapacitorBarcodeScanner.requestPermissions();

      if (camera === 'granted') {
        setPermissionGranted(true);
        return true;
      } else {
        setPermissionGranted(false);
        setError('Camera permission denied. Please enable camera access in your device settings.');
        return false;
      }
    } catch (err: any) {
      console.error('Error requesting permissions:', err);
      setError(`Permission request failed: ${err.message || 'Unknown error'}`);
      setPermissionGranted(false);
      return false;
    }
  };

  const startScanning = async () => {
    try {
      setError(null);

      // Check/request permissions first
      if (permissionGranted !== true) {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      setIsScanning(true);

      // Use the direct scan() method which opens camera UI and returns result
      const result = await CapacitorBarcodeScanner.scan();

      if (result.barcodes && result.barcodes.length > 0) {
        const barcode = result.barcodes[0].rawValue;
        setScannedCode(barcode);
        setIsScanning(false);

        // Look up product
        await lookupProduct(barcode);
      } else {
        setError('No barcode detected. Please try again.');
        setIsScanning(false);
      }

    } catch (err: any) {
      if (err.message && err.message.includes('cancelled')) {
        // User cancelled - just close
        setIsScanning(false);
      } else {
        setError(`Scan failed: ${err.message || 'Unknown error'}`);
        setIsScanning(false);
      }
    }
  };

  const stopScanning = async () => {
    try {
      // With the direct scan() method, there's nothing to stop
      // The scan dialog handles its own lifecycle
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scan:', err);
    }
  };

  const lookupProduct = async (barcode: string) => {
    setIsLookingUp(true);
    setError(null);

    try {
      // OpenFoodFacts API
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`
      );

      if (!response.ok) {
        throw new Error('Product not found');
      }

      const data = await response.json();

      if (data.status === 0) {
        setError('Product not found in database. Please enter manually.');
        setIsLookingUp(false);
        setIsScanning(false);
        return;
      }

      const product = data.product;

      // Extract ingredients
      const ingredients: string[] = [];
      if (product.ingredients_text) {
        const rawIngredients = product.ingredients_text
          .split(/[,;]/)
          .map((i: string) => i.trim())
          .filter((i: string) => i.length > 0);
        ingredients.push(...rawIngredients);
      }

      // Build product info
      const productInfo: ProductInfo = {
        name: product.product_name || 'Unknown Product',
        brand: product.brands || undefined,
        ingredients: ingredients.length > 0 ? ingredients : undefined,
        portion: product.serving_size || undefined,
        nutrition: {
          calories: product.nutriments?.['energy-kcal_100g'],
          protein: product.nutriments?.proteins_100g,
          carbs: product.nutriments?.carbohydrates_100g,
          fat: product.nutriments?.fat_100g
        }
      };

      // Success - pass data to parent
      onScanSuccess(productInfo);
      setIsLookingUp(false);
      setIsScanning(false);

      // Auto-close after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Product lookup failed:', err);
      setError('Failed to lookup product. Please enter manually.');
      setIsLookingUp(false);
      setIsScanning(false);
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 flex items-center justify-between p-4 bg-background border-b">
        <h2 className="text-lg font-semibold">Scan Barcode</h2>
        <Button
          onClick={handleClose}
          variant="ghost"
          size="icon"
          disabled={isScanning || isLookingUp}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Scanner Container */}
      <div className="p-4 space-y-4">
        {permissionGranted === null && !error && (
          <Alert>
            <AlertDescription>
              Camera permission needed for barcode scanning
            </AlertDescription>
          </Alert>
        )}

        {permissionGranted === false && (
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Camera permission denied. Please enable camera access in your device settings.'}
            </AlertDescription>
          </Alert>
        )}

        {error && permissionGranted !== false && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {scannedCode && isLookingUp && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Looking up product... (Code: {scannedCode})
            </AlertDescription>
          </Alert>
        )}

        {scannedCode && !isLookingUp && !error && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Product found! Adding to form...
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        {!isScanning && !isLookingUp && (
          <div className="text-center space-y-4 py-8">
            <ScanBarcode className="h-24 w-24 mx-auto text-primary/20" />
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Ready to scan</p>
              <p>Point your camera at a product barcode</p>
              <p className="text-xs">UPC, EAN, QR codes supported</p>
            </div>
          </div>
        )}

        {/* Scan Status */}
        {isScanning && !isLookingUp && (
          <div className="text-center space-y-4 py-8">
            <Loader2 className="h-24 w-24 mx-auto text-primary animate-spin" />
            <p className="text-sm font-medium">Scanning...</p>
            <p className="text-xs text-muted-foreground">Position barcode in camera view</p>
          </div>
        )}

        {/* Scan Button */}
        {!isScanning && !isLookingUp && permissionGranted !== false && (
          <Button
            onClick={startScanning}
            className="w-full"
            size="lg"
          >
            <ScanBarcode className="mr-2 h-5 w-5" />
            Start Scanning
          </Button>
        )}

        {/* Close Button */}
        {!isScanning && (
          <Button
            onClick={handleClose}
            variant="outline"
            className="w-full"
            disabled={isLookingUp}
          >
            {isLookingUp ? 'Looking up...' : 'Cancel'}
          </Button>
        )}
      </div>
    </div>
  );
}
