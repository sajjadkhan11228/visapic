"use client";

import { useState } from "react";

type BackgroundRemovalProps = {
  image: string;
  onComplete: (image: string) => void;
};

export default function BackgroundRemoval({
  image,
  onComplete,
}: BackgroundRemovalProps) {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleRemoveBackground = async () => {
    if (!image || processing) return;

    try {
      setProcessing(true);
      setProgress(0);
      setError("");

      // Load the browser-only package lazily. This prevents the
      // background-removal library from being evaluated during
      // Next.js server rendering/build.
      const { removeBackground } = await import(
        "@imgly/background-removal"
      );

      const result = await removeBackground(image, {
        progress: (_key: string, current: number, total: number) => {
          if (total > 0) {
            setProgress(
              Math.min(100, Math.round((current / total) * 100))
            );
          }
        },
      });

      const resultUrl = URL.createObjectURL(result);
      onComplete(resultUrl);
      setProgress(100);
    } catch (err) {
      console.error("Background removal error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Background removal failed. Please try another photo."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            AI Background Removal
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Remove the original background in your browser. The transparent
            result is then used by the main photo editor.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRemoveBackground}
          disabled={processing || !image}
          className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {processing ? `Removing... ${progress}%` : "Remove Background"}
        </button>
      </div>

      {processing && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600">
              Processing image...
            </span>
            <span className="font-bold text-purple-600">{progress}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-purple-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            The first run can take longer because the AI model has to load in
            your browser.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!processing && !error && (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Tip: use this before choosing a new background color. Without
          background removal, a color cannot replace an opaque original photo
          background.
        </p>
      )}
    </div>
  );
}
