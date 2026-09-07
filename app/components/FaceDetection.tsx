"use client";

import { useEffect, useState } from "react";

type FaceDetectionProps = {
  image: string;

  onFaceDetected?: (face: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;

    imageWidth: number;
    imageHeight: number;

    faceWidthRatio: number;
    faceHeightRatio: number;
    centerXRatio: number;
    centerYRatio: number;
  } | null) => void;
};

type FaceApiModule =
  typeof import("@vladmandic/face-api");

export default function FaceDetection({
  image,
  onFaceDetected,
}: FaceDetectionProps) {
  const [faceApi, setFaceApi] =
    useState<FaceApiModule | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [modelsLoaded, setModelsLoaded] =
    useState(false);

  const [faceFound, setFaceFound] =
    useState(false);

  const [message, setMessage] =
    useState("");

  /*
   * Load face-api only in browser.
   */

  useEffect(() => {
    let cancelled = false;

    const loadFaceApi = async () => {
      try {
        setLoading(true);
        setMessage(
          "Loading AI face detector..."
        );

        const module =
          await import(
            "@vladmandic/face-api"
          );

        if (cancelled) return;

        setFaceApi(module);
      } catch (error) {
        console.error(
          "Face API loading error:",
          error
        );

        if (!cancelled) {
          setMessage(
            "AI face detector could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFaceApi();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Load Tiny Face Detector model.
   */

  useEffect(() => {
    if (!faceApi) return;

    let cancelled = false;

    const loadModel = async () => {
      try {
        setLoading(true);

        setMessage(
          "Loading face detection model..."
        );

        await faceApi.nets.tinyFaceDetector.loadFromUri(
          "/models"
        );

        if (cancelled) return;

        setModelsLoaded(true);
        setMessage(
          "Face detection model ready."
        );
      } catch (error) {
        console.error(
          "Face model loading error:",
          error
        );

        if (!cancelled) {
          setModelsLoaded(false);

          setMessage(
            "Face model could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadModel();

    return () => {
      cancelled = true;
    };
  }, [faceApi]);

  /*
   * Detect face whenever image changes.
   */

  useEffect(() => {
    if (!faceApi) return;
    if (!modelsLoaded) return;
    if (!image) return;

    let cancelled = false;

    const detectFace = async () => {
      try {
        setLoading(true);
        setFaceFound(false);

        setMessage(
          "Detecting face..."
        );

        const img =
          document.createElement(
            "img"
          );

        await new Promise<void>(
          (resolve, reject) => {
            img.onload = () =>
              resolve();

            img.onerror = () =>
              reject(
                new Error(
                  "Image could not be loaded."
                )
              );

            img.src = image;
          }
        );

        if (cancelled) return;

        const imageWidth =
          img.naturalWidth;

        const imageHeight =
          img.naturalHeight;

        if (
          !imageWidth ||
          !imageHeight
        ) {
          throw new Error(
            "Invalid image dimensions."
          );
        }

        /*
         * Detect one face.
         */

        const detection =
          await faceApi.detectSingleFace(
            img,
            new faceApi.TinyFaceDetectorOptions(
              {
                inputSize: 416,
                scoreThreshold: 0.5,
              }
            )
          );

        if (cancelled) return;

        if (!detection) {
          setFaceFound(false);
          setMessage(
            "No clear face detected. You can crop the photo manually."
          );
          onFaceDetected?.(null);
          return;
        }

        const box =
          detection.box;

        const centerX =
          box.x +
          box.width / 2;

        const centerY =
          box.y +
          box.height / 2;

        /*
         * Ratios allow ComplianceChecker
         * to work with any image resolution.
         */

        const faceWidthRatio =
          box.width /
          imageWidth;

        const faceHeightRatio =
          box.height /
          imageHeight;

        const centerXRatio =
          centerX /
          imageWidth;

        const centerYRatio =
          centerY /
          imageHeight;

        const face = {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,

          centerX,
          centerY,

          imageWidth,
          imageHeight,

          faceWidthRatio,
          faceHeightRatio,

          centerXRatio,
          centerYRatio,
        };

        setFaceFound(true);

        setMessage(
          "Face detected successfully."
        );

        onFaceDetected?.(
          face
        );
      } catch (error) {
        console.error(
          "Face detection error:",
          error
        );

        if (!cancelled) {
          setFaceFound(false);
          setMessage(
            "Face detection failed. You can still crop manually."
          );
          onFaceDetected?.(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    detectFace();

    return () => {
      cancelled = true;
    };
  }, [
    faceApi,
    modelsLoaded,
    image,
    onFaceDetected,
  ]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between gap-4">

        <div>
          <h3 className="font-bold text-slate-900">
            AI Face Detection
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            VisaPic analyzes the face position
            to improve passport-photo cropping.
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
            loading
              ? "bg-blue-100"
              : faceFound
              ? "bg-green-100"
              : "bg-slate-100"
          }`}
        >
          {loading
            ? "⏳"
            : faceFound
            ? "✓"
            : "👤"}
        </div>

      </div>

      {message && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            faceFound
              ? "bg-green-50 text-green-700"
              : loading
              ? "bg-blue-50 text-blue-700"
              : "bg-slate-50 text-slate-600"
          }`}
        >
          {message}
        </div>
      )}

      {faceFound && (
        <div className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-xs text-green-700">
          ✓ Face position detected successfully.
          VisaPic can now analyze the face size
          and position.
        </div>
      )}

    </div>
  );
}