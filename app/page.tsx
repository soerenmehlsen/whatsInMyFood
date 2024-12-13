"use client";

import Image from "next/image";
import { useState } from "react";
import Dropzone from "react-dropzone";
import { uploadImageToSupabase } from "@/lib/supabase";
import { PhotoIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { Input } from "./components/ui/input";
import { IngredientGrid } from "./components/ingredient-grid";
import { Fade } from "react-awesome-reveal";
import { exampleUrl, exampleIngredient } from "@/lib/consant";

export interface IngredientItem {
  name: string;
  description: string;
  nova_classification: string;
  reason: string;
}

export default function Home() {
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

  const handleFileChange = async (file: File) => {
    // Upload the file to Supabase
    const objectUrl = URL.createObjectURL(file);
    setStatus("uploading");
    setIngredientUrl(objectUrl);
    const publicUrl = await uploadImageToSupabase(file);
    console.log("Signed URL:", publicUrl);
    setIngredientUrl(publicUrl);

    // Using the signed URL in the API request
    setStatus("parsing");
    const res = await fetch("/api/parseIngredient", {
      method: "POST",
      body: JSON.stringify({ ingredientUrl: publicUrl }),
    });

    if (!res.ok) {
      throw new Error("Failed to parse ingredient");
    }

    console.log("API Response Status:", res.status);
    console.log("API Response Body:", await res.clone().text());

    const json = await res.json();
    console.log({ json });

    if (!json.ingredient || !Array.isArray(json.ingredient)) {
      throw new Error(
        "Unexpected response structure: 'ingredient' is not an array",
      );
    }

    setStatus("created");
    setParsedIngredient(json.ingredient);
    console.log(json.ingredient);
  };

  const filteredIngredient = (parsedIngredient || []).filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleExampleImage = async () => {
    setStatus("uploading");
    setIngredientUrl(exampleUrl);
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setStatus("parsing");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setStatus("created");
    setParsedIngredient(exampleIngredient);
  };

  return (
    <div className="container text-center px-4 py-8 max-w-5xl mx-auto">
      <Fade
        direction="up"
        delay={400}
        cascade
        damping={1e-1}
        triggerOnce={true}
      >
        <div className="max-w-2xl text-center mx-auto sm:mt-20 mt-2">
          <h1 className="mb-6 text-balance text-6xl font-bold text-zinc-800">
            Understand your food ingredients with AI
          </h1>
        </div>
      </Fade>

      <div className="max-w-3xl text-center mx-auto">
        <Fade
          direction="up"
          delay={400}
          cascade
          damping={1e-1}
          triggerOnce={true}
        >
          <p className="mb-8 text-lg text-gray-500 text-balance">
            Take a picture of your food&apos;s ingredient list and let AI help
            you understand each ingredient, so you know what you&apos;re eating.
          </p>
        </Fade>
      </div>

      <div className="max-w-2xl mx-auto">
        {status === "initial" && (
          <>
            <Fade
              direction="right"
              delay={300}
              cascade
              damping={1e-1}
              triggerOnce={true}
            >
              <Dropzone
                accept={{
                  "image/*": [".jpg", ".jpeg", ".png"],
                }}
                multiple={false}
                onDrop={(acceptedFiles) => handleFileChange(acceptedFiles[0])}
              >
                {({ getRootProps, getInputProps, isDragAccept }) => (
                  <div
                    className={`mt-2 flex aspect-video cursor-pointer items-center justify-center rounded-lg border-2 border-dashed ${
                      isDragAccept ? "border-blue-500" : "border-gray-300"
                    }`}
                    {...getRootProps()}
                  >
                    <input {...getInputProps()} />
                    <div className="text-center">
                      <PhotoIcon
                        className="mx-auto h-12 w-12 text-gray-300"
                        aria-hidden="true"
                      />
                      <div className="mt-4 flex text-sm leading-6 text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative rounded-md bg-white font-semibold text-gray-800 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-gray-600"
                        >
                          <p className="text-xl">Upload your ingredient list</p>
                          <p className="mt-1 font-normal text-gray-600">
                            or take a picture
                          </p>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </Dropzone>
            </Fade>
            <Fade
              direction="up"
              delay={400}
              cascade
              damping={1e-1}
              triggerOnce={true}
            >
              <button
                className="mt-5 font-medium text-blue-400 text-md underline decoration-transparent hover:decoration-blue-200 decoration-2 underline-offset-4 transition hover:text-blue-500"
                onClick={handleExampleImage}
              >
                Need an example image? Try here.
              </button>
            </Fade>
          </>
        )}

        {ingredientUrl && (
          <div className="my-10 mx-auto flex  flex-col items-center">
            <Image
              width={1024}
              height={768}
              src={ingredientUrl}
              alt="Menu"
              className="w-40 rounded-lg shadow-md"
            />
          </div>
        )}

        {status === "uploading" && (
          <div className="mt-10 flex flex-col items-center">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
              <p className="text-lg text-gray-600">Uploading your image...</p>
            </div>
            <div className="w-full max-w-2xl space-y-4">
              <div className="h-8 bg-gray-200 rounded-lg animate-pulse" />
            </div>
          </div>
        )}

        {status === "parsing" && (
          <div className="mt-10 flex flex-col items-center">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
              <p className="text-lg text-gray-600">
                Processing the ingredient list...
              </p>
            </div>
            <div className="w-full max-w-2xl space-y-4">
              <div className="h-8 bg-gray-200 rounded-lg animate-pulse" />
              <div className="grid grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-32 bg-gray-200 rounded-lg animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {status === "error" && (
        <div className="mt-10 flex flex-col items-center">
          <p className="text-lg text-red-600">
            Oops! Something went wrong. Please try again.
          </p>
        </div>
      )}

      {parsedIngredient.length > 0 && (
        <div className="mt-10">
          <h2 className="text-4xl font-bold mb-5">
           Found {parsedIngredient.length} ingredients
          </h2>
          <div className="relative mb-6">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search ingredient items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <IngredientGrid items={filteredIngredient} />
        </div>
      )}
    </div>
  );
}
