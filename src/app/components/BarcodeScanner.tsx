import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, X, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
  language?: string;
}

export default function BarcodeScanner({ onScan, onClose, language = "fa" }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>(undefined);
  const [scanning, setScanning] = useState(false);

  const startScanner = async (deviceId?: string) => {
    setError(null);
    setScanning(true);

    if (controlsRef.current) {
      try { controlsRef.current.stop(); } catch {}
      controlsRef.current = null;
    }

    if (!videoRef.current) return;

    const reader = new BrowserMultiFormatReader();

    try {
      const controls = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result) => {
          if (result) {
            const code = result.getText();
            try { controls.stop(); } catch {}
            onScan(code);
          }
        }
      );
      controlsRef.current = controls;
    } catch (error: any) {
      setError(error?.message || "Camera error");
      setScanning(false);
    }
  };

  useEffect(() => {
    BrowserMultiFormatReader.listVideoInputDevices().then((devices) => {
      setCameras(devices);
      // Prefer back camera on mobile
      const back = devices.find(
        (d) =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear") ||
          d.label.toLowerCase().includes("environment")
      );
      const id = back?.deviceId || devices[0]?.deviceId;
      setSelectedCamera(id);
      startScanner(id);
    }).catch(() => {
      startScanner(undefined);
    });

    return () => {
      if (controlsRef.current) {
        try { controlsRef.current.stop(); } catch {}
      }
    };
  }, []);

  const t = {
    title: language === "fa" ? "اسکن بارکود با دوربین" : language === "ps" ? "د کمرې سره د بارکوډ سکین" : "Camera Barcode Scanner",
    guide: language === "fa" ? "بارکود را داخل کادر قرار دهید" : language === "ps" ? "بارکوډ د کادر دننه کیږدئ" : "Place barcode inside the frame",
    cameraError: language === "fa" ? "خطا در دسترسی به دوربین" : language === "ps" ? "د کمرې لاسرسي کې تیروتنه" : "Camera access error",
    retry: language === "fa" ? "تلاش مجدد" : language === "ps" ? "بیا هڅه" : "Retry",
    camera: language === "fa" ? "دوربین" : language === "ps" ? "کمره" : "Camera",
    permissionMsg: language === "fa"
      ? "لطفاً دسترسی به دوربین را در مرورگر مجاز کنید"
      : language === "ps"
      ? "مهرباني وکړئ د براوزر کې د کمرې اجازه ورکړئ"
      : "Please allow camera access in your browser",
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl overflow-hidden w-full max-w-sm shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-500" />
            <span className="text-gray-800 text-sm font-semibold">
              {t.title}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-black h-[280px]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanning overlay */}
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-52 h-36">
                <div className="absolute inset-0 border-2 border-green-400 rounded-lg opacity-80" />
                {/* Corners */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-green-400 rounded-tl" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-green-400 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-green-400 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-green-400 rounded-br" />
                {/* Scanning line animation */}
                <div className="absolute left-1 right-1 h-0.5 bg-green-400 opacity-80 top-1/2 animate-[scanLine_1.5s_ease-in-out_infinite_alternate]" />
              </div>

              {scanning && (
                <div className="absolute bottom-4 left-4 text-xs text-white/80">
                  {t.permissionMsg}
                </div>
              )}
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 p-4">
              <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
              <p className="text-white text-sm text-center mb-1">{t.cameraError}</p>
              <p className="text-gray-300 text-xs text-center mb-4">{t.permissionMsg}</p>
              <Button
                size="sm"
                variant="outline"
                className="bg-white text-gray-800"
                onClick={() => startScanner(selectedCamera)}
              >
                <RefreshCw className="w-4 h-4 ml-1" />
                {t.retry}
              </Button>
            </div>
          )}
        </div>

        {/* Camera selector (if multiple cameras) */}
        {cameras.length > 1 && (
          <div className="px-4 pt-3 pb-1">
            <select
              value={selectedCamera}
              onChange={(e) => {
                setSelectedCamera(e.target.value);
                startScanner(e.target.value);
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            >
              {cameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `${t.camera} ${cameras.indexOf(cam) + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Footer guide */}
        <div className="px-4 py-3 text-center">
          <p className="text-gray-500 text-xs">{t.guide}</p>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          from { top: 15%; }
          to { top: 85%; }
        }
      `}</style>
    </div>
  );
}
