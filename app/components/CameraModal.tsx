"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckIcon,
} from "@heroicons/react/24/solid";

interface CameraModalProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedBlobRef = useRef<Blob | null>(null);

  const [view, setView] = useState<"live" | "preview">("live");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  // Start the camera on mount, clean everything up on unmount.
  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (!cancelled) {
          setError(
            "Kunne ikke få adgang til kameraet. Giv tilladelse og prøv igen.",
          );
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [stopStream]);

  // Revoke the preview object URL whenever it changes or on unmount.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return; // stay on live view; user can retry
        capturedBlobRef.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        setView("preview");
      },
      "image/jpeg",
      0.92,
    );
  };

  const handleRetake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    capturedBlobRef.current = null;
    setView("live");
  };

  const handleConfirm = () => {
    const blob = capturedBlobRef.current;
    if (!blob) return;
    const file = new File([blob], `scan_${Date.now()}.jpg`, {
      type: "image/jpeg",
    });
    onCapture(file);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-black shadow-xl"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            aria-label="Luk"
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
                Luk
              </button>
            </div>
          ) : view === "live" ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[3/4] w-full bg-black object-cover sm:aspect-video"
              />
              <div className="flex items-center justify-center bg-black py-5">
                <button
                  onClick={handleCapture}
                  aria-label="Tag billede"
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-gray-900 ring-4 ring-white/40 transition hover:bg-gray-100"
                >
                  <CameraIcon className="h-7 w-7" />
                </button>
              </div>
            </>
          ) : (
            <>
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Optaget billede"
                  width={1024}
                  height={768}
                  unoptimized
                  className="aspect-[3/4] w-full bg-black object-contain sm:aspect-video"
                />
              )}
              <div className="flex items-center justify-center gap-4 bg-black py-5">
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/20"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Tag om
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition hover:bg-blue-600"
                >
                  <CheckIcon className="h-5 w-5" />
                  Brug billede
                </button>
              </div>
            </>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
