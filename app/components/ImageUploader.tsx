"use client";

import Image from "next/image";
import { useState } from "react";
import { uploadImageToSupabase } from "@/lib/supabase";
import {
  CameraIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
} from "@heroicons/react/20/solid";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { AnimatePresence } from "framer-motion";
import CameraModal from "./CameraModal";
import { Input } from "./ui/input";
import { IngredientGrid } from "./ingredient-grid";
import { ResultSummary } from "./ResultSummary";
import { Fade } from "./ui/fade";
import { exampleUrl, exampleIngredient } from "@/lib/consant";
import FilterDropdown from "./FilterDropdown";  

export interface IngredientItem {
  name: string;
  description: string;
  nova_classification: number;
  reason: string;
}

export function ImageUploader() {
  const [status, setStatus] = useState<
    "initial" | "uploading" | "parsing" | "created" | "error"
  >("initial");
  const [ingredientUrl, setIngredientUrl] = useState<string | undefined>(
    undefined,
  );
  const [parsedIngredient, setParsedIngredient] = useState<IngredientItem[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNovaFilters, setSelectedNovaFilters] = useState<number[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [language, setLanguage] = useState<string>("en");

   // Reset function
   const handleReset = () => {
    setStatus("initial");
    setIngredientUrl(undefined);
    setParsedIngredient([]);
    setSearchTerm("");
    setSelectedNovaFilters([]);
    setShowCamera(false);
    setLanguage("en");
  };

  const handleFileChange = async (file: File) => {
    let objectUrl: string | undefined;
    try {
      objectUrl = URL.createObjectURL(file);
      setStatus("uploading");
      setIngredientUrl(objectUrl);
      
      const publicUrl = await uploadImageToSupabase(file);
      
      // Clean up the temporary blob URL
      URL.revokeObjectURL(objectUrl);
      setIngredientUrl(publicUrl);

      setStatus("parsing");
      const res = await fetch("/api/parseIngredient", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ingredientUrl: publicUrl }),
      });

      if (!res.ok) {
        throw new Error("Failed to parse ingredient");
      }

      const json = await res.json();

      if (!json.ingredient || !Array.isArray(json.ingredient)) {
        throw new Error(
          "Unexpected response structure: 'ingredient' is not an array",
        );
      }

      setStatus("created");
      setLanguage(typeof json.language === "string" ? json.language : "en");
      const normalizedIngredients = json.ingredient.map((item: IngredientItem) => ({
        ...item,
        nova_classification: Number(item.nova_classification),
      }));
      setParsedIngredient(normalizedIngredients);
    } catch (error) {
      console.error("Error processing image:", error);
      setStatus("error");
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setIngredientUrl(undefined);
    }
  };

  const filteredIngredient = [...(parsedIngredient || [])]
    .filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((item) =>
      selectedNovaFilters.length === 0 ||
      selectedNovaFilters.includes(item.nova_classification)
    )
    .sort((a, b) => b.nova_classification - a.nova_classification);

  const handleExampleImage = async () => {
    setStatus("uploading");
    setIngredientUrl(exampleUrl);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setStatus("parsing");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setStatus("created");
    setLanguage("da");
    setParsedIngredient(exampleIngredient);
  };

  return (
    <div className="container mx-auto max-w-full px-4 py-10 text-center">
      {status === "initial" && (
        <>
        <div className="mx-auto max-w-xl">
          <Fade direction="up" delay={300}>
            <button
              onClick={() => setShowCamera(true)}
              className="group mt-2 flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-hairline-strong bg-surface transition hover:border-accent"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#34c759]/10 transition group-hover:bg-[#34c759]/15">
                <CameraIcon className="h-7 w-7 text-accent" aria-hidden="true" />
              </span>
              <p className="mt-4 text-xl font-semibold tracking-tight text-ink">
                Scan your ingredient list
              </p>
              <p className="mt-1 text-sm text-muted">
                Take a photo and let AI break it down
              </p>
            </button>
          </Fade>

          <div className="mt-6 flex flex-col items-center gap-3">
            <Fade direction="up" delay={400}>
              <button
                onClick={handleExampleImage}
                className="text-sm font-semibold text-accent-fg transition hover:underline"
              >
                Need an example image? Try here →
              </button>
            </Fade>
            <p className="text-xs text-muted">Free · No sign-up needed</p>
          </div>
        </div>
          <AnimatePresence>
            {showCamera && (
              <CameraModal
                onClose={() => setShowCamera(false)}
                onCapture={(file) => {
                  setShowCamera(false);
                  handleFileChange(file);
                }}
              />
            )}
          </AnimatePresence>
        </>
      )}

      {ingredientUrl && (
        <div className="mx-auto my-10 flex max-w-2xl flex-col items-center">
          <button
            onClick={handleReset}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:border-muted"
          >
            <ArrowUpTrayIcon className="h-4 w-4" />
            Upload a new image
          </button>
          <Image
            width={1024}
            height={768}
            src={ingredientUrl}
            alt="Scanned ingredient label"
            className="w-40 rounded-2xl border border-hairline shadow-sm"
          />
        </div>
      )}

      {status === "uploading" && (
        <div className="mt-10 flex flex-col items-center max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-hairline border-t-accent" />
            <p className="text-lg text-muted">Uploading your image...</p>
          </div>
          <div className="w-full max-w-2xl space-y-4">
            <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
          </div>
        </div>
      )}

      {status === "parsing" && (
        <div className="mt-10 flex flex-col items-center max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-hairline border-t-accent" />
            <p className="text-lg text-muted">
              Processing the ingredient list...
            </p>
          </div>
          <div className="w-full max-w-2xl space-y-4">
            <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="h-4 bg-gray-100 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 rounded-2xl border border-hairline bg-surface p-8 shadow-sm">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
          </span>
          <p className="text-base text-ink">
            Something went wrong reading that image. Please try again.
          </p>
          <button
            onClick={handleReset}
            className="rounded-full bg-accent px-5 py-2.5 font-semibold text-white transition hover:bg-accent-hover"
          >
            Try again
          </button>
        </div>
      )}

      {parsedIngredient.length > 0 && (
        <div className="mx-auto mt-10 max-w-7xl text-left">
          <h2 className="mb-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Found {parsedIngredient.length} ingredients
          </h2>
          <ResultSummary items={parsedIngredient} language={language} />
          <div className="mb-8 flex gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <Input
                type="text"
                placeholder="Search ingredients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 rounded-full border-hairline-strong bg-surface pl-11 text-ink shadow-none focus-visible:ring-2 focus-visible:ring-[#34c759]/40"
              />
            </div>
            <FilterDropdown onFilterChange={setSelectedNovaFilters} />
          </div>
          <IngredientGrid items={filteredIngredient} language={language} />
        </div>
      )}
    </div>
  );
} 