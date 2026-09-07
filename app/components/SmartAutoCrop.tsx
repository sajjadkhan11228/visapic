"use client";

import { useState } from "react";

type FaceData = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
};

type SmartAutoCropProps = {
  image: string;
  face: FaceData | null;
  onApply: (position: {
    x: number;
    y: number;
    zoom: number;
  }) => void;
};

export default function SmartAutoCrop({
  image,
  face,
  onApply,
}: SmartAutoCropProps) {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  const calculatePosition = async () => {
    if (!image) return;

    if (!face) {
      setMessage(
        "No face detected. Please use manual cropping."
      );
      return;
    }

    try {
      setWorking(true);
      setMessage("");

      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();

        img.onerror = () =>
          reject(
            new Error("Image loading failed.")
          );

        img.src = image;
      });

      const imageWidth = img.naturalWidth;
      const imageHeight = img.naturalHeight;

      if (!imageWidth || !imageHeight) {
        throw new Error(
          "Invalid image dimensions."
        );
      }

      /*
       * Target face center.
       *
       * Passport-style photos normally need:
       * - enough space above the head
       * - face around the upper-middle area
       * - reasonable space below the chin
       */

      const targetCenterX =
        imageWidth / 2;

      const targetCenterY =
        imageHeight * 0.46;

      const moveX =
        targetCenterX - face.centerX;

      const moveY =
        targetCenterY - face.centerY;

      /*
       * Convert movement into react-easy-crop
       * percentage coordinates.
       */

      const positionX = Math.max(
        -100,
        Math.min(
          100,
          50 +
            (moveX / imageWidth) * 100
        )
      );

      const positionY = Math.max(
        -100,
        Math.min(
          100,
          50 +
            (moveY / imageHeight) * 100
        )
      );

      /*
       * Estimate face size.
       *
       * Smaller face -> zoom in
       * Larger face  -> zoom out
       */

      const faceRatio =
        face.height / imageHeight;

      let zoom = 1;

      if (faceRatio < 0.18) {
        zoom = 1.35;
      } else if (faceRatio < 0.23) {
        zoom = 1.2;
      } else if (faceRatio < 0.28) {
        zoom = 1.1;
      } else if (faceRatio > 0.45) {
        zoom = 0.85;
      }

      zoom = Math.max(
        0.8,
        Math.min(2, zoom)
      );

      onApply({
        x: positionX,
        y: positionY,
        zoom,
      });

      setMessage(
        "✓ Photo automatically positioned using the detected face."
      );
    } catch (error) {
      console.error(
        "Smart auto crop error:",
        error
      );

      setMessage(
        "Automatic positioning failed. Please crop manually."
      );
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Smart Auto Position
          </h3>

          <p className="mt-1 text-sm text-slate-600">
            Automatically position the detected face
            for a passport-style crop.
          </p>
        </div>

        <button
          type="button"
          onClick={calculatePosition}
          disabled={working || !face}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {working
            ? "Positioning..."
            : "✨ Auto Position"}
        </button>
      </div>

      {!face && (
        <div className="mt-4 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Detect a face first to use Smart Auto
          Position.
        </div>
      )}

      {message && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {message}
        </div>
      )}

      <div className="mt-4 text-xs leading-5 text-slate-500">
        Smart positioning is an automatic cropping aid.
        Always review the final photo against the
        official requirements of your application.
      </div>
    </div>
  );
}