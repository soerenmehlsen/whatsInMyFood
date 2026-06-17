"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { XMarkIcon, CameraIcon } from "@heroicons/react/24/solid";
import { BrowserMultiFormatReader } from "@zxing/browser";
import {
  DecodeHintType,
  BarcodeFormat,
  type Result,
} from "@zxing/library";

interface BarcodeScannerProps {
  onDetect: (ean: string) => void;
  onClose: () => void;
  onUsePhotoInstead: () => void;
}

// Limit to retail food barcodes for faster, more reliable reads.
const hints = new Map();
hints.set(DecodeHintType.POSSIBLE_FORMATS, [
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
]);

export default function BarcodeScanner({
  onDetect,
  onClose,
  onUsePhotoInstead,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const detectedRef = useRef(false); // guard against double-firing onDetect
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reader = new BrowserMultiFormatReader(hints);
    let stopped = false;
    let controls: { stop: () => void } | undefined;

    const start = async () => {
      try {
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current!,
          (result: Result | undefined) => {
            if (result && !detectedRef.current) {
              detectedRef.current = true;
              controls?.stop();
              onDetect(result.getText());
            }
          },
        );
        if (stopped) controls.stop();
      } catch {
        if (!stopped) {
          setError(
            "Could not access the camera. Please grant permission and try again.",
          );
        }
      }
    };

    start();

    return () => {
      stopped = true;
      controls?.stop();
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
    // onDetect is only invoked once and guarded by detectedRef; an empty dep
    // array keeps the camera from restarting when the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Scan product barcode"
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-black shadow-xl"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {error ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <p className="text-base text-white">{error}</p>
            <button
              onClick={onClose}
              className="rounded-lg bg-white px-4 py-2 font-medium text-gray-900 transition hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[3/4] w-full bg-black object-cover sm:aspect-video"
              />
              {/* Framing guide */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="h-24 w-3/4 rounded-lg border-2 border-white/80" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-3 bg-black px-4 py-5 text-center">
              <p className="text-sm text-white/80">
                Point the camera at the product barcode
              </p>
              <button
                onClick={onUsePhotoInstead}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <CameraIcon className="h-5 w-5" />
                Take a photo instead
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
