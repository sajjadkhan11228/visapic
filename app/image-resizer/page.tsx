"use client";

import { useEffect, useRef, useState } from "react";

const PRESETS = [
  { name: "600 × 600", width: 600, height: 600 },
  { name: "1200 × 1200", width: 1200, height: 1200 },
  { name: "600 × 750", width: 600, height: 750 },
  { name: "300 × 400", width: 300, height: 400 },
  { name: "400 × 600", width: 400, height: 600 },
  { name: "800 × 1000", width: 800, height: 1000 },
];

export default function ImageResizerPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");

  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(600);

  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);

  const [lockRatio, setLockRatio] = useState(true);
  const [format, setFormat] = useState<"jpeg" | "png">(
    "jpeg"
  );

  const [quality, setQuality] = useState(90);

  const [result, setResult] = useState("");
  const [resultSize, setResultSize] = useState(0);

  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const ratioRef = useRef(1);

  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }

      if (result) {
        URL.revokeObjectURL(result);
      }
    };
  }, [image, result]);

  const loadImageDimensions = (
    url: string
  ) => {
    const img = new Image();

    img.onload = () => {
      setOriginalWidth(img.naturalWidth);
      setOriginalHeight(img.naturalHeight);

      ratioRef.current =
        img.naturalWidth /
        img.naturalHeight;
    };

    img.onerror = () => {
      setError("Unable to read image dimensions.");
    };

    img.src = url;
  };

  const handleFile = (file: File) => {
    setError("");
    setResult("");
    setResultSize(0);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("Maximum original file size is 25 MB.");
      return;
    }

    if (image) {
      URL.revokeObjectURL(image);
    }

    const url = URL.createObjectURL(file);

    setImage(url);
    setFileName(file.name);

    loadImageDimensions(url);
  };

  const handleInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (file) {
      handleFile(file);
    }
  };

  const changeWidth = (value: number) => {
    setWidth(value);

    if (
      lockRatio &&
      ratioRef.current > 0 &&
      Number.isFinite(value)
    ) {
      setHeight(
        Math.max(
          1,
          Math.round(
            value / ratioRef.current
          )
        )
      );
    }
  };

  const changeHeight = (value: number) => {
    setHeight(value);

    if (
      lockRatio &&
      ratioRef.current > 0 &&
      Number.isFinite(value)
    ) {
      setWidth(
        Math.max(
          1,
          Math.round(
            value * ratioRef.current
          )
        )
      );
    }
  };

  const applyPreset = (
    presetWidth: number,
    presetHeight: number
  ) => {
    setWidth(presetWidth);
    setHeight(presetHeight);
    setLockRatio(false);
  };

  const resizeImage = async () => {
    if (!image) return;

    if (
      width < 1 ||
      height < 1 ||
      width > 10000 ||
      height > 10000
    ) {
      setError(
        "Width and height must be between 1 and 10,000 pixels."
      );
      return;
    }

    try {
      setWorking(true);
      setError("");

      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();

        img.onerror = () =>
          reject(
            new Error("Unable to load image.")
          );

        img.src = image;
      });

      const canvas =
        document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Canvas is not supported."
        );
      }

      // Better quality when resizing down.
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(
          0,
          0,
          width,
          height
        );
      }

      ctx.drawImage(
        img,
        0,
        0,
        width,
        height
      );

      const mimeType =
        format === "png"
          ? "image/png"
          : "image/jpeg";

      const outputQuality =
        format === "jpeg"
          ? quality / 100
          : undefined;

      const blob =
        await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              (createdBlob) =>
                resolve(createdBlob),
              mimeType,
              outputQuality
            );
          }
        );

      if (!blob) {
        throw new Error(
          "Image resize failed."
        );
      }

      if (result) {
        URL.revokeObjectURL(result);
      }

      const outputUrl =
        URL.createObjectURL(blob);

      setResult(outputUrl);
      setResultSize(blob.size);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to resize this image. Please try another image."
      );
    } finally {
      setWorking(false);
    }
  };

  const downloadImage = () => {
    if (!result) return;

    const extension =
      format === "png"
        ? "png"
        : "jpg";

    const cleanName =
      fileName
        .replace(/\.[^/.]+$/, "")
        .replace(
          /[^a-zA-Z0-9-_]/g,
          "-"
        );

    const link =
      document.createElement("a");

    link.href = result;

    link.download =
      `${cleanName || "visapic"}-${width}x${height}.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const formatBytes = (
    bytes: number
  ) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  };

  const reset = () => {
    if (image) {
      URL.revokeObjectURL(image);
    }

    if (result) {
      URL.revokeObjectURL(result);
    }

    setImage("");
    setResult("");
    setFileName("");
    setOriginalWidth(0);
    setOriginalHeight(0);
    setResultSize(0);
    setError("");
    setWidth(600);
    setHeight(600);
    setLockRatio(true);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

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
              Resize Image to Exact Pixels
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Resize your photo to an exact width and
              height in pixels. Choose a preset or enter
              your own dimensions.
            </p>
          </div>
        </div>
      </section>

      {/* Tool */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {!image ? (
              <div
                onDrop={handleDrop}
                onDragOver={(event) =>
                  event.preventDefault()
                }
                onClick={() =>
                  inputRef.current?.click()
                }
                className="flex min-h-[430px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-4xl">
                  📐
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Upload Your Image
                </h2>

                <p className="mt-3 max-w-md text-slate-500">
                  Drag & drop your image here or click
                  to select a photo.
                </p>

                <button
                  type="button"
                  className="mt-7 rounded-xl bg-blue-600 px-7 py-3 font-bold text-white transition hover:bg-blue-700"
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
                  onChange={handleInput}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                {/* Preview */}

                <div className="rounded-2xl bg-slate-100 p-5">
                  <div className="flex min-h-[430px] items-center justify-center">
                    {result ? (
                      <img
                        src={result}
                        alt="Resized image"
                        className="max-h-[430px] max-w-full rounded-xl object-contain shadow"
                      />
                    ) : (
                      <img
                        src={image}
                        alt="Original image"
                        className="max-h-[430px] max-w-full rounded-xl object-contain shadow"
                      />
                    )}
                  </div>
                </div>

                {/* Original Info */}

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Original Size
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {originalWidth} ×{" "}
                      {originalHeight}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      New Size
                    </p>

                    <p className="mt-1 font-bold text-blue-600">
                      {width} × {height}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs text-slate-500">
                      Output
                    </p>

                    <p className="mt-1 font-bold uppercase text-slate-900">
                      {format}
                    </p>
                  </div>
                </div>

                {/* Resize Button */}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={resizeImage}
                    disabled={working}
                    className="flex-1 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {working
                      ? "Resizing..."
                      : "Resize Image"}
                  </button>

                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Change Image
                  </button>
                </div>

                {/* Result */}

                {result && (
                  <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
                    <h3 className="font-bold text-green-900">
                      ✓ Image Resized Successfully
                    </h3>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs text-slate-500">
                          Dimensions
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {width} × {height} px
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-xs text-slate-500">
                          File Size
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {formatBytes(
                            resultSize
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={downloadImage}
                      className="mt-5 w-full rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700"
                    >
                      ⬇ Download Resized Image
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
              Resize Settings
            </h2>

            {/* Presets */}

            <div className="mt-6">
              <label className="text-sm font-bold text-slate-700">
                Quick Presets
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {PRESETS.map(
                  (preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() =>
                        applyPreset(
                          preset.width,
                          preset.height
                        )
                      }
                      className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-400 hover:bg-blue-50"
                    >
                      {preset.name}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Width */}

            <div className="mt-6">
              <label
                htmlFor="width"
                className="text-sm font-bold text-slate-700"
              >
                Width (pixels)
              </label>

              <input
                id="width"
                type="number"
                min="1"
                max="10000"
                value={width}
                onChange={(event) =>
                  changeWidth(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Ratio Lock */}

            <button
              type="button"
              onClick={() =>
                setLockRatio(
                  !lockRatio
                )
              }
              className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                lockRatio
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              {lockRatio
                ? "🔒 Aspect Ratio Locked"
                : "🔓 Aspect Ratio Unlocked"}
            </button>

            {/* Height */}

            <div className="mt-4">
              <label
                htmlFor="height"
                className="text-sm font-bold text-slate-700"
              >
                Height (pixels)
              </label>

              <input
                id="height"
                type="number"
                min="1"
                max="10000"
                value={height}
                onChange={(event) =>
                  changeHeight(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Format */}

            <div className="mt-6">
              <label className="text-sm font-bold text-slate-700">
                Output Format
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormat("jpeg")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-bold uppercase transition ${
                    format === "jpeg"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  JPG
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFormat("png")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-bold uppercase transition ${
                    format === "png"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  PNG
                </button>
              </div>
            </div>

            {/* Quality */}

            {format === "jpeg" && (
              <div className="mt-6">
                <label
                  htmlFor="quality"
                  className="text-sm font-bold text-slate-700"
                >
                  JPG Quality: {quality}%
                </label>

                <input
                  id="quality"
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(event) =>
                    setQuality(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="mt-3 w-full"
                />

                <div className="flex justify-between text-xs text-slate-400">
                  <span>Smaller</span>
                  <span>Higher Quality</span>
                </div>
              </div>
            )}

            {/* Privacy */}

            <div className="mt-6 rounded-2xl bg-blue-50 p-5">
              <h3 className="font-bold text-blue-900">
                🔒 Privacy
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-700">
                Your image is resized directly in your
                browser. It does not need to be uploaded
                to our server.
              </p>
            </div>

            {/* Warning */}

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">
                Important
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Resizing changes the pixel dimensions.
                It does not automatically crop the image
                to preserve a particular composition.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* SEO Content */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Resize Image to 600×600
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Quickly resize an image to exactly
                600 by 600 pixels.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Resize Image to 1200×1200
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create a larger square image with exact
                pixel dimensions.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Custom Pixel Size
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Enter your own exact width and height
                when an application requires specific
                dimensions.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl bg-slate-50 p-6 text-sm leading-7 text-slate-500">
            <strong className="text-slate-700">
              Important:
            </strong>{" "}
            Exact image dimensions are technical settings.
            Always check the current requirements of the
            website, organization or application where you
            intend to submit the image.
          </div>
        </div>
      </section>
    </main>
  );
}