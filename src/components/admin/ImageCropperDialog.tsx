import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Check, X, Loader2 } from 'lucide-react';
import { getCroppedImg } from '@/lib/cropImage';

interface ImageCropperDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

export function ImageCropperDialog({ isOpen, onClose, imageUrl, onCropComplete }: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      setIsCropping(true);
      const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCropping(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card overflow-hidden rounded-[32px] p-6">
        <DialogHeader className="pt-2 pb-2">
          <DialogTitle className="text-2xl font-black text-center">
            Điều chỉnh ảnh
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-[300px] mt-2 rounded-2xl overflow-hidden bg-muted/20">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="mt-6 flex items-center gap-4 px-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => setZoom(Math.max(1, zoom - 0.1))}>
            <ZoomOut className="w-5 h-5" />
          </Button>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => setZoom(Math.min(3, zoom + 0.1))}>
            <ZoomIn className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-8 flex gap-4">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12 rounded-2xl font-bold border-border bg-card">
            <X className="w-4 h-4 mr-2" />
            Hủy
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={isCropping} className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20">
            {isCropping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
            Xác nhận
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
