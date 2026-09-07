"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import BackgroundRemoval from "./BackgroundRemoval";
import BackgroundPreview from "./BackgroundPreview";
import ComplianceChecker from "./ComplianceChecker";
import FaceDetection from "./FaceDetection";
import SmartAutoCrop from "./SmartAutoCrop";
import { getPhotoSize } from "./photoSizes";

type FaceData = {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  imageWidth?: number;
  imageHeight?: number;
  faceWidthRatio?: number;
  faceHeightRatio?: number;
  centerXRatio?: number;
  centerYRatio?: number;
};

type CropPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PhotoEditorProps = {
  image: string;
  country: string;
};

const backgroundOptions = [
  { name: "White", color: "#ffffff" },
  { name: "Off White", color: "#fff1c7" },
  { name: "Black", color: "#000000" },
  { name: "Blue", color: "#2563eb" },
  { name: "Red", color: "#ef4444" },
  { name: "Gray", color: "#9ca3af" },
  { name: "Light Blue", color: "#7dd3fc" },
  { name: "Green", color: "#16a34a" },
];

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unable to load the image."));
    img.src = src;
  });
}

/**
 * Uses the same crop/rotation approach recommended for react-easy-crop:
 * rotate the complete source image onto a temporary canvas, then extract
 * the selected crop from that rotated canvas.
 */
async function createCroppedCanvas(
  imageSrc: string,
  crop: CropPixels,
  rotation: number
): Promise<HTMLCanvasElement> {
  const image = await loadImage(imageSrc);
  const radians = (rotation * Math.PI) / 180;

  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));

  const rotatedWidth = Math.max(
    1,
    Math.round(image.naturalWidth * cos + image.naturalHeight * sin)
  );
  const rotatedHeight = Math.max(
    1,
    Math.round(image.naturalWidth * sin + image.naturalHeight * cos)
  );

  const rotatedCanvas = document.createElement("canvas");
  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;

  const rotatedContext = rotatedCanvas.getContext("2d");
  if (!rotatedContext) {
    throw new Error("Canvas is not supported by this browser.");
  }

  rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedContext.rotate(radians);
  rotatedContext.drawImage(
    image,
    -image.naturalWidth / 2,
    -image.naturalHeight / 2
  );

  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = Math.max(1, Math.round(crop.width));
  cropCanvas.height = Math.max(1, Math.round(crop.height));

  const cropContext = cropCanvas.getContext("2d");
  if (!cropContext) {
    throw new Error("Unable to create crop canvas.");
  }

  cropContext.drawImage(
    rotatedCanvas,
    Math.round(crop.x),
    Math.round(crop.y),
    Math.round(crop.width),
    Math.round(crop.height),
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

  return cropCanvas;
}

export default function PhotoEditor({
  image,
  country,
}: PhotoEditorProps) {
  const size = useMemo(() => getPhotoSize(country), [country]);
  const aspectRatio = size.widthMm / size.heightMm;

  const [originalImage] = useState(image);
  const [editorImage, setEditorImage] = useState(image);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);

  const [face, setFace] = useState<FaceData | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CropPixels | null>(null);

  const [selectedBackground, setSelectedBackground] = useState("#ffffff");
  const [backgroundName, setBackgroundName] = useState("White");

  const [creating, setCreating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const clearGeneratedFile = useCallback(() => {
    setDownloadUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
  }, []);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setFace(null);
    setSuccess("");
    setError("");
    clearGeneratedFile();
  }, [country, clearGeneratedFile]);

  const handleFaceDetected = useCallback(
    (detectedFace: FaceData | null) => {
      setFace(detectedFace);
    },
    []
  );

  const handleBackgroundRemoved = useCallback(
    (result: string) => {
      if (!result) return;

      setEditorImage(result);
      setBackgroundRemoved(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
      setError("");
      setSuccess(
        "AI background removed. You can now choose a new background."
      );
      clearGeneratedFile();
    },
    [clearGeneratedFile]
  );

  const restoreOriginal = useCallback(() => {
    if (editorImage !== originalImage && editorImage.startsWith("blob:")) {
      URL.revokeObjectURL(editorImage);
    }

    setEditorImage(originalImage);
    setBackgroundRemoved(false);
    setFace(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setError("");
    setSuccess("Original photo restored.");
    clearGeneratedFile();
  }, [clearGeneratedFile, editorImage, originalImage]);

  const handleSmartPosition = useCallback(
    ({ x, y, zoom: smartZoom }: { x: number; y: number; zoom: number }) => {
      setCrop({ x, y });
      setZoom(smartZoom);
      setError("");
      setSuccess("Smart Auto Position applied.");
      clearGeneratedFile();
    },
    [clearGeneratedFile]
  );

  const handleCropComplete = useCallback(
    (
      _area: CropPixels,
      pixels: CropPixels
    ) => {
      setCroppedAreaPixels(pixels);
    },
    []
  );

  const handleBackgroundChange = useCallback(
    (name: string, color: string) => {
      setBackgroundName(name);
      setSelectedBackground(color);
      setError("");
      setSuccess("");
      clearGeneratedFile();
    },
    [clearGeneratedFile]
  );

  const resetPosition = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setError("");
    setSuccess("");
    clearGeneratedFile();
  };

  const createFinalPhoto = async () => {
    if (!editorImage) {
      setError("Please select an image first.");
      return;
    }

    if (!croppedAreaPixels) {
      setError("Please wait for the crop area to be ready.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      clearGeneratedFile();

      const cropCanvas = await createCroppedCanvas(
        editorImage,
        croppedAreaPixels,
        rotation
      );

      const outputWidth = size.outputWidth;
      const outputHeight = size.outputHeight;

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = outputWidth;
      finalCanvas.height = outputHeight;

      const context = finalCanvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to create the final canvas.");
      }

      // Background is meaningful when the editor image has transparency.
      // With an untouched opaque photo, no browser-only tool can magically
      // replace its existing background without segmentation.
      context.fillStyle = selectedBackground;
      context.fillRect(0, 0, outputWidth, outputHeight);

      const cropRatio = cropCanvas.width / cropCanvas.height;
      const outputRatio = outputWidth / outputHeight;

      let drawWidth = outputWidth;
      let drawHeight = outputHeight;

      if (cropRatio > outputRatio) {
        drawWidth = outputHeight * cropRatio;
      } else {
        drawHeight = outputWidth / cropRatio;
      }

      const drawX = (outputWidth - drawWidth) / 2;
      const drawY = (outputHeight - drawHeight) / 2;

      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(
        cropCanvas,
        drawX,
        drawY,
        drawWidth,
        drawHeight
      );

      const blob = await new Promise<Blob | null>((resolve) => {
        finalCanvas.toBlob(resolve, "image/jpeg", 0.95);
      });

      if (!blob) {
        throw new Error("Failed to generate the final JPG.");
      }

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      setSuccess(
        `${country} photo created successfully (${outputWidth} × ${outputHeight} px).`
      );
    } catch (err) {
      console.error("Create final photo error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create the final photo."
      );
    } finally {
      setCreating(false);
    }
  };

  const downloadFinalPhoto = () => {
    if (!downloadUrl) return;

    const safeCountry = country
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${safeCountry || "passport"}-photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">Selected Country</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              {country}
            </h2>
          </div>

          <div className="rounded-xl bg-slate-100 px-5 py-3 text-center">
            <div className="text-xs font-medium text-slate-500">
              Photo Size
            </div>
            <div className="mt-1 text-lg font-bold text-slate-900">
              {size.widthMm} × {size.heightMm} mm
            </div>
            <div className="mt-1 text-xs text-slate-500">
              VisaPic output: {size.outputWidth} × {size.outputHeight} px
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FaceDetection
          image={editorImage}
          onFaceDetected={handleFaceDetected}
        />

        <SmartAutoCrop
          image={editorImage}
          face={face}
          onApply={handleSmartPosition}
        />
      </div>

      <BackgroundRemoval
        image={editorImage}
        onComplete={handleBackgroundRemoved}
      />

      {backgroundRemoved && (
        <div className="flex flex-col gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-green-800">
              AI background removal is active
            </p>
            <p className="mt-1 text-sm text-green-700">
              The selected background color will now appear behind the
              transparent subject.
            </p>
          </div>

          <button
            type="button"
            onClick={restoreOriginal}
            className="rounded-xl border border-green-300 bg-white px-4 py-2.5 text-sm font-semibold text-green-800 hover:bg-green-100"
          >
            Restore Original
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-slate-900">
            Crop & Position
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Move, zoom and rotate the image until the face is correctly framed.
          </p>
        </div>

        <div
          className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-2xl bg-slate-900"
          style={{ aspectRatio: `${size.widthMm} / ${size.heightMm}`, minHeight: 360 }}
        >
          <Cropper
            image={editorImage}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onZoomChange={(value) => {
              setZoom(value);
              clearGeneratedFile();
              setSuccess("");
            }}
            onRotationChange={(value) => {
              setRotation(value);
              clearGeneratedFile();
              setSuccess("");
            }}
            onCropComplete={handleCropComplete}
            showGrid
            restrictPosition
            objectFit="contain"
          />
        </div>

        <div className="mx-auto mt-6 max-w-[420px] space-y-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="zoom" className="text-sm font-semibold text-slate-700">
                Zoom
              </label>
              <span className="text-sm text-slate-500">{zoom.toFixed(2)}×</span>
            </div>
            <input
              id="zoom"
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(event) => {
                setZoom(Number(event.target.value));
                clearGeneratedFile();
                setSuccess("");
              }}
              className="w-full"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="rotation"
                className="text-sm font-semibold text-slate-700"
              >
                Rotation
              </label>
              <span className="text-sm text-slate-500">{rotation}°</span>
            </div>
            <input
              id="rotation"
              type="range"
              min="-45"
              max="45"
              step="1"
              value={rotation}
              onChange={(event) => {
                setRotation(Number(event.target.value));
                clearGeneratedFile();
                setSuccess("");
              }}
              className="w-full"
            />
          </div>

          <button
            type="button"
            onClick={resetPosition}
            className="w-full rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reset Position
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Background Color
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Choose the background for the exported photo. For an actual
            replacement, run AI Background Removal first.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {backgroundOptions.map((background) => {
            const selected = selectedBackground === background.color;

            return (
              <button
                key={background.color}
                type="button"
                onClick={() =>
                  handleBackgroundChange(
                    background.name,
                    background.color
                  )
                }
                className={`rounded-xl border-2 p-3 transition ${
                  selected
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200 hover:border-slate-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-8 w-8 shrink-0 rounded-full border border-slate-300"
                    style={{ backgroundColor: background.color }}
                  />
                  <span className="text-sm font-semibold text-slate-700">
                    {background.name}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Selected: <span className="font-semibold">{backgroundName}</span>
        </div>
      </section>

      <BackgroundPreview
        image={editorImage}
        backgroundColor={selectedBackground}
        backgroundName={backgroundName}
        isTransparent={backgroundRemoved}
      />

      <ComplianceChecker
        country={country}
        widthMm={size.widthMm}
        heightMm={size.heightMm}
        backgroundColor={selectedBackground}
        face={face}
        backgroundRemoved={backgroundRemoved}
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {success}
        </div>
      )}

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900">
            Ready to Create Your Photo?
          </h3>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Review the crop, face position and background before exporting the
            final JPG.
          </p>

          <button
            type="button"
            onClick={createFinalPhoto}
            disabled={creating}
            className="mt-5 rounded-xl bg-blue-600 px-7 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? "Creating Photo..." : "Create Final Photo"}
          </button>
        </div>
      </section>

      {downloadUrl && (
        <section className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-slate-900">Final Photo</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your generated {country} photo is ready.
            </p>
          </div>

          <div className="flex justify-center">
            <div
              className="overflow-hidden rounded-xl border border-slate-200 p-2"
              style={{ backgroundColor: selectedBackground }}
            >
              <img
                src={downloadUrl}
                alt={`${country} passport photo`}
                className="max-h-[500px] max-w-full object-contain"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <div className="text-xs text-slate-500">Country</div>
              <div className="mt-1 font-bold text-slate-900">{country}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <div className="text-xs text-slate-500">Printed Size</div>
              <div className="mt-1 font-bold text-slate-900">
                {size.widthMm} × {size.heightMm} mm
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <div className="text-xs text-slate-500">Digital Output</div>
              <div className="mt-1 font-bold text-slate-900">
                {size.outputWidth} × {size.outputHeight} px
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={downloadFinalPhoto}
            className="mt-5 w-full rounded-xl bg-green-600 px-6 py-3.5 font-bold text-white transition hover:bg-green-700"
          >
            ↓ Download Final Photo
          </button>
        </section>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs leading-5 text-slate-500">
        VisaPic provides automated photo editing and requirement guidance. It
        does not guarantee acceptance. Always verify the current official
        requirements for your exact passport, visa or immigration application.
      </div>
    </div>
  );
}
