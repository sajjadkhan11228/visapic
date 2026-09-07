"use client";

import { useEffect, useRef, useState } from "react";

type CompressionResult = {
  blob: Blob;
  url: string;
  size: number;
  quality: number;
  width: number;
  height: number;
};

const TARGET_OPTIONS = [
  { label: "20 KB", value: 20 },
  { label: "50 KB", value: 50 },
  { label: "100 KB", value: 100 },
  { label: "200 KB", value: 200 },
  { label: "500 KB", value: 500 },
  { label: "1 MB", value: 1024 },
];

export default function ImageCompressorPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [targetKB, setTargetKB] = useState(100);
  const [result, setResult] = useState<CompressionResult | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }

      if (result?.url) {
        URL.revokeObjectURL(result.url);
      }
    };
  }, [imageUrl, result?.url]);

  const handleFile = (selectedFile: File) => {
    setError("");
    setResult(null);

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("Maximum original file size is 25 MB.");
      return;
    }

    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }

    const url = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setImageUrl(url);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const compressImage = async () => {
    if (!file || !imageUrl) return;

    try {
      setWorking(true);
      setError("");
      setResult(null);

      const image = new Image();

      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error("Unable to load image."));
        image.src = imageUrl;
      });

      let width = image.naturalWidth;
      let height = image.naturalHeight;

      if (!width || !height) {
        throw new Error("Invalid image dimensions.");
      }

      const maxDimension = 2400;

      if (Math.max(width, height) > maxDimension) {
        const scale = maxDimension / Math.max(width, height);

        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas is not supported.");
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(image, 0, 0, width, height);

      const targetBytes = targetKB * 1024;

      let low = 0.05;
      let high = 0.95;

      let bestBlob: Blob | null = null;
      let bestQuality = 0.05;

      // First try quality-only compression.
      for (let i = 0; i < 12; i++) {
        const quality = (low + high) / 2;

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(
            (createdBlob) => resolve(createdBlob),
            "image/jpeg",
            quality
          );
        });

        if (!blob) {
          throw new Error("Image compression failed.");
        }

        if (blob.size <= targetBytes) {
          bestBlob = blob;
          bestQuality = quality;
          low = quality;
        } else {
          high = quality;
        }
      }

      // If quality compression wasn't enough,
      // gradually reduce dimensions.
      let currentWidth = width;
      let currentHeight = height;

      if (!bestBlob || bestBlob.size > targetBytes) {
        for (let attempt = 0; attempt < 12; attempt++) {
          currentWidth = Math.max(
            200,
            Math.round(currentWidth * 0.85)
          );

          currentHeight = Math.max(
            200,
            Math.round(currentHeight * 0.85)
          );

          canvas.width = currentWidth;
          canvas.height = currentHeight;

          ctx.clearRect(
            0,
            0,
            currentWidth,
            currentHeight
          );

          ctx.drawImage(
            image,
            0,
            0,
            currentWidth,
            currentHeight
          );

          low = 0.05;
          high = 0.95;

          for (let i = 0; i < 10; i++) {
            const quality = (low + high) / 2;

            const blob = await new Promise<Blob | null>(
              (resolve) => {
                canvas.toBlob(
                  (createdBlob) => resolve(createdBlob),
                  "image/jpeg",
                  quality
                );
              }
            );

            if (!blob) continue;

            if (blob.size <= targetBytes) {
              bestBlob = blob;
              bestQuality = quality;
              low = quality;
            } else {
              high = quality;
            }
          }

          if (bestBlob && bestBlob.size <= targetBytes) {
            break;
          }
        }
      }

      // Final fallback: lowest reasonable JPEG quality.
      if (!bestBlob) {
        const fallback = await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              (createdBlob) => resolve(createdBlob),
              "image/jpeg",
              0.05
            );
          }
        );

        if (!fallback) {
          throw new Error(
            "Unable to create compressed image."
          );
        }

        bestBlob = fallback;
        bestQuality = 0.05;
      }

      const outputUrl = URL.createObjectURL(bestBlob);

      setResult({
        blob: bestBlob,
        url: outputUrl,
        size: bestBlob.size,
        quality: bestQuality,
        width: currentWidth,
        height: currentHeight,
      });
    } catch (err) {
      console.error(err);

      setError(
        "Compression failed. Please try another image."
      );
    } finally {
      setWorking(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;

    const link = document.createElement("a");

    link.href = result.url;
    link.download = "visapic-compressed.jpg";

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const compressionPercentage =
    file && result
      ? Math.max(
          0,
          Math.round(
            (1 - result.size / file.size) * 100
          )
        )
      : 0;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              VisaPic Free Tool
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Compress Image to Specific KB
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Reduce your image size to 20KB, 50KB, 100KB,
              200KB or another target size while keeping
              the best possible image quality.
            </p>
          </div>
        </div>
      </section>

      {/* Tool */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {!file ? (
              <div
                onDrop={handleDrop}
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onClick={() => inputRef.current?.click()}
                className="flex min-h-[380px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-4xl">
                  🗜️
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Upload your image
                </h2>

                <p className="mt-3 max-w-md text-slate-500">
                  Drag & drop your photo here or click to
                  select an image from your computer.
                </p>

                <button
                  type="button"
                  className="mt-7 rounded-xl bg-blue-600 px-7 py-3 font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  Choose Image
                </button>

                <p className="mt-4 text-xs text-slate-400">
                  JPG, JPEG, PNG, WEBP • Maximum 25 MB
                </p>

                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleInputChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                {/* Preview */}
                <div className="rounded-2xl bg-slate-100 p-5">
                  <div className="flex min-h-[380px] items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Uploaded image"
                      className="max-h-[420px] max-w-full rounded-xl object-contain shadow-sm"
                    />
                  </div>
                </div>

                {/* File info */}
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Original File
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      {formatSize(file.size)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      File Type
                    </p>
                    <p className="mt-1 font-bold uppercase text-slate-900">
                      {file.type.replace(
                        "image/",
                        ""
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium text-slate-500">
                      Target
                    </p>
                    <p className="mt-1 font-bold text-blue-600">
                      {targetKB} KB
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={compressImage}
                    disabled={working}
                    className="flex-1 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {working
                      ? "Compressing..."
                      : `Compress to ${targetKB} KB`}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (imageUrl) {
                        URL.revokeObjectURL(
                          imageUrl
                        );
                      }

                      if (result?.url) {
                        URL.revokeObjectURL(
                          result.url
                        );
                      }

                      setFile(null);
                      setImageUrl("");
                      setResult(null);
                      setError("");

                      if (inputRef.current) {
                        inputRef.current.value = "";
                      }
                    }}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Change Image
                  </button>
                </div>

                {result && (
                  <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-xl">
                        ✓
                      </div>

                      <div>
                        <h3 className="font-bold text-green-900">
                          Compression Complete
                        </h3>

                        <p className="text-sm text-green-700">
                          Your image is ready.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs text-slate-500">
                          New Size
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {formatSize(result.size)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs text-slate-500">
                          Saved
                        </p>
                        <p className="mt-1 text-lg font-bold text-green-600">
                          {compressionPercentage}%
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs text-slate-500">
                          Dimensions
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {result.width} ×{" "}
                          {result.height}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-xl bg-white">
                      <img
                        src={result.url}
                        alt="Compressed result"
                        className="mx-auto max-h-[400px] max-w-full object-contain"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={downloadImage}
                      className="mt-5 w-full rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700"
                    >
                      ⬇ Download Compressed Image
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Settings */}
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Compression Settings
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose the maximum file size you need.
            </p>

            <div className="mt-6">
              <label className="text-sm font-bold text-slate-700">
                Target File Size
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">
                {TARGET_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setTargetKB(option.value)
                    }
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      targetKB === option.value
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="customKB"
                className="text-sm font-bold text-slate-700"
              >
                Custom Size (KB)
              </label>

              <input
                id="customKB"
                type="number"
                min="5"
                max="5000"
                value={targetKB}
                onChange={(event) => {
                  const value = Number(
                    event.target.value
                  );

                  if (
                    Number.isFinite(value) &&
                    value >= 5 &&
                    value <= 5000
                  ) {
                    setTargetKB(value);
                  }
                }}
                className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="mt-6 rounded-2xl bg-blue-50 p-5">
              <h3 className="font-bold text-blue-900">
                🔒 Privacy
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-700">
                Images are processed directly in your
                browser. Your photo does not need to be
                uploaded to our server.
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">
                Supported Formats
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                JPG, JPEG, PNG and WEBP images can be
                compressed. The output is generated as
                JPEG for efficient file size.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* SEO / Information */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Compress to 20KB
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Reduce photos for websites, online forms
                and applications that have very small
                upload limits.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Compress to 50KB
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Quickly create a smaller JPEG when an
                application specifies a low maximum file
                size.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Compress to 100KB
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Useful for reducing passport, visa and
                document photos before uploading them.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl bg-slate-50 p-6 text-sm leading-7 text-slate-500">
            <strong className="text-slate-700">
              Important:
            </strong>{" "}
            A target file size is a technical compression
            target. Always check the specific application
            or government website for its current image
            dimensions, format and file-size requirements.
          </div>
        </div>
      </section>
    </main>
  );
}