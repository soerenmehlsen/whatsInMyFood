# Camera Scan Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dropzone/file-upload in `ImageUploader` with a scan button that opens an in-app camera modal where the user takes and confirms a photo of an ingredient list.

**Architecture:** A new client component `CameraModal` opens a live camera feed via `getUserMedia`, captures a frame to a canvas, shows a preview with retake/confirm, and hands a `File` back to `ImageUploader` via an `onCapture` callback. `ImageUploader` swaps its `<Dropzone>` for a scan button + the modal, and reuses its existing `handleFileChange` flow unchanged.

**Tech Stack:** Next.js 16 (App Router), React client components, Tailwind, framer-motion, @heroicons/react. No test framework is configured — verification is `npm run lint`, `npm run build`, and manual browser checks.

---

> **Note on TDD:** This repo has no test runner, so tasks verify via `npm run lint`, `npm run build`, and explicit manual browser steps instead of automated tests.

## File Structure

- **Create** `app/components/CameraModal.tsx` — self-contained camera modal. Owns `getUserMedia` lifecycle, capture, preview/retake, error state, and cleanup. Communicates only through `onCapture(file)` and `onClose()`.
- **Modify** `app/components/ImageUploader.tsx` — remove `react-dropzone` usage, add a scan button + `showCamera` state, render `CameraModal`, wire `onCapture` to existing `handleFileChange`.

---

### Task 1: Create CameraModal with live feed, capture, preview, and error handling

**Files:**
- Create: `app/components/CameraModal.tsx`

- [ ] **Step 1: Create the component file**

Create `app/components/CameraModal.tsx` with the full content below.

```tsx
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
```

- [ ] **Step 2: Lint the new file**

Run: `npm run lint`
Expected: no errors/warnings for `app/components/CameraModal.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/components/CameraModal.tsx
git commit -m "Add: CameraModal component for in-app scanning"
```

---

### Task 2: Wire scan button + modal into ImageUploader, remove dropzone

**Files:**
- Modify: `app/components/ImageUploader.tsx`

- [ ] **Step 1: Update imports**

In `app/components/ImageUploader.tsx`, remove the dropzone import:

```tsx
import Dropzone from "react-dropzone";
```

Add the camera modal import and the `CameraIcon` to the existing heroicons import. Change:

```tsx
import { PhotoIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
```

to:

```tsx
import { CameraIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import CameraModal from "./CameraModal";
```

(`PhotoIcon` is no longer used after the dropzone is removed; `CameraIcon` replaces it.)

- [ ] **Step 2: Add showCamera state**

After the `selectedNovaFilters` state declaration (around line 32), add:

```tsx
  const [showCamera, setShowCamera] = useState(false);
```

- [ ] **Step 3: Reset showCamera in handleReset**

In `handleReset`, add `setShowCamera(false);` alongside the other resets so a closed/clean state is guaranteed:

```tsx
   const handleReset = () => {
    setStatus("initial");
    setIngredientUrl(undefined);
    setParsedIngredient([]);
    setSearchTerm("");
    setSelectedNovaFilters([]);
    setShowCamera(false);
  };
```

- [ ] **Step 4: Replace the Dropzone block with a scan button**

In the `status === "initial"` block, replace the entire `<Fade direction="right" delay={300}>...</Fade>` wrapping the `<Dropzone>` (lines ~119-155) with this scan button:

```tsx
          <Fade direction="right" delay={300}>
            <button
              onClick={() => setShowCamera(true)}
              className="mt-2 flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 transition hover:border-blue-500"
            >
              <CameraIcon
                className="h-12 w-12 text-gray-300"
                aria-hidden="true"
              />
              <p className="mt-4 text-xl font-semibold text-gray-800">
                Scan your ingredient list
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Open the camera to take a picture
              </p>
            </button>
          </Fade>
```

- [ ] **Step 5: Render the modal**

Immediately after the closing `</>` would be premature — instead render the modal inside the `status === "initial"` fragment, right after the example-image `<div>` block (after the closing `</div>` of the "Need an example image?" wrapper, before the fragment's closing `</>`):

```tsx
          {showCamera && (
            <CameraModal
              onClose={() => setShowCamera(false)}
              onCapture={(file) => {
                setShowCamera(false);
                handleFileChange(file);
              }}
            />
          )}
```

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: no errors. Confirm there is no "unused variable" warning for `PhotoIcon` or `Dropzone` (both should be fully removed).

- [ ] **Step 7: Build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 8: Commit**

```bash
git add app/components/ImageUploader.tsx
git commit -m "Refactor: replace dropzone upload with camera scan button"
```

---

### Task 3: Manual verification

**Files:** none (manual QA).

- [ ] **Step 1: Run the dev server**

Run: `npm run dev` and open the dashboard page (`/dashboard`) in a browser.

- [ ] **Step 2: Verify the happy path (desktop webcam)**

- Click "Scan your ingredient list" → modal opens, live webcam feed shows.
- Click the shutter button → preview of the captured still appears with "Tag om" / "Brug billede".
- Click "Tag om" → returns to live feed.
- Click shutter again, then "Brug billede" → modal closes, the existing
  "Uploading your image..." → "Processing the ingredient list..." flow runs and
  results render.

- [ ] **Step 3: Verify camera-denied path**

- Reset, click scan, deny the camera permission (or use a device/profile with no
  camera) → modal shows only the error message
  "Kunne ikke få adgang til kameraet…" and a Luk button. No file upload appears.

- [ ] **Step 4: Verify cleanup**

- Open the modal, then close it via X, backdrop click, and Escape (test each).
- Confirm the browser camera indicator turns off after closing (tracks stopped).

- [ ] **Step 5: Verify example image still works**

- Click "Need an example image? Try here." → existing example flow still renders
  the demo ingredients.

---

## Self-Review Notes

- **Spec coverage:** scan button replacing dropzone (Task 2 Step 4), camera modal with live/preview/retake/confirm (Task 1), error-only fallback (Task 1 error branch), File packaging with `scan_${Date.now()}.jpg` (Task 1 `handleConfirm`), stream cleanup + Escape/backdrop close (Task 1 effects/handlers), reuse of `handleFileChange` (Task 2 Step 5), example image untouched (verified Task 3 Step 5). All covered.
- **Type consistency:** `onCapture: (file: File) => void` and `onClose: () => void` used identically in both files. `CameraModal` is a default export, imported as default in `ImageUploader`.
- **No placeholders:** all steps contain concrete code/commands.
