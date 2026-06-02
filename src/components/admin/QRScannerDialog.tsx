'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

interface QRScannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
}

export function QRScannerDialog({ isOpen, onClose, onScan }: QRScannerDialogProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let scanner: Html5Qrcode | null = null;

    if (!isOpen) {
      return;
    }

    // Delay mounting slightly for the modal animation
    const timer = setTimeout(() => {
      if (!document.getElementById("qr-reader")) return;
      if (!isMounted) return;

      scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      setIsStarting(true);
      setErrorMsg(null);

      scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (scanner?.isScanning) {
            scanner.pause();
            onScan(decodedText);
            onClose();
          }
        },
        () => {
          // ignore parsing errors (happens continuously when no QR is found)
        }
      ).catch((err) => {
        if (isMounted) {
           setErrorMsg('Không thể mở Camera. Vui lòng cấp quyền truy cập Camera hoặc thử dùng ảnh có sẵn.');
           console.error(err);
        }
      }).finally(() => {
        if (isMounted) setIsStarting(false);
      });

    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      
      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().then(() => {
             scanner?.clear();
          }).catch(console.error);
        } else {
          try { scanner.clear(); } catch(e) {}
        }
      }
      scannerRef.current = null;
    };
  }, [isOpen, onScan, onClose]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("qr-reader");
        }
        const decodedText = await scannerRef.current.scanFile(file, true);
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        onScan(decodedText);
        onClose();
      } catch {
        setErrorMsg("Không tìm thấy mã QR trong ảnh này. Vui lòng thử ảnh khác.");
      }
    }
    // reset input
    e.target.value = '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-border/50 bg-card overflow-hidden rounded-[32px] p-6">
        <DialogHeader className="pt-2 pb-2">
          <DialogTitle className="text-2xl font-black text-center flex items-center justify-center gap-2">
            <Camera className="w-6 h-6 text-primary" />
            Quét mã QR
          </DialogTitle>
          <DialogDescription className="text-center font-medium">
            Camera sẽ tự động mở. Đưa mã QR của khách vào khung hình.
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative w-full overflow-hidden rounded-[24px] border border-border bg-muted/20 mt-2 min-h-[300px] flex items-center justify-center shadow-inner">
          {isStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-background/80 backdrop-blur-sm rounded-[24px]">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <p className="text-sm font-semibold text-muted-foreground animate-pulse">Đang khởi động Camera...</p>
            </div>
          )}
          
          {/* Custom style to override the default Html5Qrcode borders and buttons if any */}
          <style dangerouslySetInnerHTML={{__html: `
            #qr-reader { border: none !important; width: 100% !important; }
            #qr-reader__scan_region { background: transparent !important; }
            #qr-reader__dashboard { display: none !important; }
            #qr-reader video { border-radius: 24px !important; object-fit: cover !important; }
          `}} />
          
          <div id="qr-reader" className="w-full" />
          
          {errorMsg && !isStarting && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-background/90 z-10 text-center rounded-[24px]">
              <div className="bg-rose-500/10 text-rose-500 p-4 rounded-2xl border border-rose-500/20 font-semibold text-sm">
                {errorMsg}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border/50">
          <input
            id="qr-image-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full h-14 rounded-2xl font-bold border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary shadow-sm"
            onClick={() => document.getElementById('qr-image-upload')?.click()}
          >
            <ImageIcon className="w-5 h-5 mr-2" />
            Chọn mã QR từ thư viện ảnh
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
