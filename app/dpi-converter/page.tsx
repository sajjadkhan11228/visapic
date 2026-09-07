"use client";

import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

type ImageInfo = {
  width: number;
  height: number;
  fileSize: number;
};

const DPI_OPTIONS = [
  72,
  96,
  150,
  200,
  300,
  600,
];

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function pixelsToMm(
  pixels: number,
  dpi: number
) {
  return (pixels / dpi) * 25.4;
}

function mmToPixels(
  mm: number,
  dpi: number
) {
  return Math.round(
    (mm / 25.4) * dpi
  );
}

export default function DpiConverterPage() {
  const [image, setImage] =
    useState<string | null>(null);

  const [fileName, setFileName] =
    useState("");

  const [imageInfo, setImageInfo] =
    useState<ImageInfo | null>(null);

  const [currentDpi, setCurrentDpi] =
    useState(72);

  const [targetDpi, setTargetDpi] =
    useState(300);

  const [outputFormat, setOutputFormat] =
    useState<"jpg" | "png">("jpg");

  const [quality, setQuality] =
    useState(92);

  const [result, setResult] =
    useState<string | null>(null);

  const [resultSize, setResultSize] =
    useState(0);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [physicalWidth, setPhysicalWidth] =
    useState(0);

  const [physicalHeight, setPhysicalHeight] =
    useState(0);

  useEffect(() => {
    if (!imageInfo) return;

    setPhysicalWidth(
      pixelsToMm(
        imageInfo.width,
        currentDpi
      )
    );

    setPhysicalHeight(
      pixelsToMm(
        imageInfo.height,
        currentDpi
      )
    );
  }, [imageInfo, currentDpi]);

  const targetWidth = imageInfo
    ? mmToPixels(
        physicalWidth,
        targetDpi
      )
    : 0;

  const targetHeight = imageInfo
    ? mmToPixels(
        physicalHeight,
        targetDpi
      )
    : 0;

  const handleFile = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    setError("");
    setResult(null);
    setResultSize(0);

    setFileName(file.name);

    const reader =
      new FileReader();

    reader.onload = () => {
      const dataUrl =
        reader.result as string;

      const img = new Image();

      img.onload = () => {
        setImage(dataUrl);

        setImageInfo({
          width: img.naturalWidth,
          height: img.naturalHeight,
          fileSize: file.size,
        });
      };

      img.onerror = () => {
        setError(
          "Unable to read this image."
        );
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      setError(
        "Could not read the selected file."
      );
    };

    reader.readAsDataURL(file);
  };

  const convertDpi = async () => {
    if (!image || !imageInfo) {
      setError(
        "Please upload an image first."
      );
      return;
    }

    if (
      targetWidth <= 0 ||
      targetHeight <= 0
    ) {
      setError(
        "Invalid output dimensions."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setResult(null);

      const img = new Image();

      await new Promise<void>(
        (resolve, reject) => {
          img.onload = () =>
            resolve();

          img.onerror = () =>
            reject(
              new Error(
                "Image loading failed."
              )
            );

          img.src = image;
        }
      );

      const canvas =
        document.createElement(
          "canvas"
        );

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Canvas is not supported."
        );
      }

      ctx.imageSmoothingEnabled =
        true;

      ctx.imageSmoothingQuality =
        "high";

      if (outputFormat === "jpg") {
        /*
         * JPEG cannot contain transparency,
         * so use a white background.
         */
        ctx.fillStyle =
          "#ffffff";

        ctx.fillRect(
          0,
          0,
          targetWidth,
          targetHeight
        );
      }

      ctx.drawImage(
        img,
        0,
        0,
        targetWidth,
        targetHeight
      );

      const mime =
        outputFormat === "png"
          ? "image/png"
          : "image/jpeg";

      const qualityValue =
        Math.max(
          0.1,
          Math.min(
            1,
            quality / 100
          )
        );

      const dataUrl =
        outputFormat === "png"
          ? canvas.toDataURL(mime)
          : canvas.toDataURL(
              mime,
              qualityValue
            );

      /*
       * Estimate generated file size.
       */
      const base64 =
        dataUrl.split(",")[1] || "";

      const estimatedBytes =
        Math.floor(
          (base64.length * 3) / 4
        );

      setResult(dataUrl);
      setResultSize(
        estimatedBytes
      );
    } catch (err) {
      console.error(
        "DPI conversion error:",
        err
      );

      setError(
        "Could not convert the image."
      );
    } finally {
      setProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;

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
      `${cleanName || "image"}-${targetDpi}dpi.${outputFormat}`;

    document.body.appendChild(link);

    link.click();

    link.remove();
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Free Online Image Tool
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Photo DPI Converter
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Change your image resolution from 72,
              96, 150, 200, 300 or 600 DPI while
              preserving its physical print size.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* SETTINGS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              DPI Settings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Upload an image and choose your target
              print resolution.
            </p>

            {/* UPLOAD */}

            <label className="mt-7 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50">
              <div className="text-5xl">
                📷
              </div>

              <div className="mt-4 text-lg font-bold text-slate-900">
                Upload Image
              </div>

              <div className="mt-2 text-sm text-slate-500">
                JPG, PNG, WebP and other image formats
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </label>

            {fileName && (
              <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                ✓ {fileName}
              </div>
            )}

            {/* IMAGE INFO */}

            {imageInfo && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="font-bold text-slate-900">
                  Original Image
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-white p-3">
                    <div className="text-xs text-slate-500">
                      Width
                    </div>

                    <div className="mt-1 font-bold">
                      {imageInfo.width}px
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <div className="text-xs text-slate-500">
                      Height
                    </div>

                    <div className="mt-1 font-bold">
                      {imageInfo.height}px
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <div className="text-xs text-slate-500">
                      File Size
                    </div>

                    <div className="mt-1 font-bold">
                      {formatBytes(
                        imageInfo.fileSize
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <div className="text-xs text-slate-500">
                      Aspect Ratio
                    </div>

                    <div className="mt-1 font-bold">
                      {(
                        imageInfo.width /
                        imageInfo.height
                      ).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CURRENT DPI */}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Current DPI
              </label>

              <select
                value={currentDpi}
                onChange={(e) =>
                  setCurrentDpi(
                    Number(e.target.value)
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {DPI_OPTIONS.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value} DPI
                    </option>
                  )
                )}
              </select>
            </div>

            {/* TARGET DPI */}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Target DPI
              </label>

              <select
                value={targetDpi}
                onChange={(e) =>
                  setTargetDpi(
                    Number(e.target.value)
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {DPI_OPTIONS.map(
                  (value) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {value} DPI
                    </option>
                  )
                )}
              </select>
            </div>

            {/* PHYSICAL SIZE */}

            {imageInfo && (
              <div className="mt-6 rounded-2xl bg-blue-50 p-5">
                <h3 className="font-bold text-slate-900">
                  Physical Print Size
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs text-slate-500">
                      Width
                    </div>

                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {physicalWidth.toFixed(
                        2
                      )} mm
                    </div>
                  </div>

                  <div className="rounded-xl bg-white p-4">
                    <div className="text-xs text-slate-500">
                      Height
                    </div>

                    <div className="mt-1 text-xl font-bold text-slate-900">
                      {physicalHeight.toFixed(
                        2
                      )} mm
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-blue-700">
                  The converter uses the selected current
                  DPI to calculate the physical size, then
                  generates the image at your target DPI.
                </p>
              </div>
            )}

            {/* OUTPUT */}

            {imageInfo && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900">
                  New Image Dimensions
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-500">
                      Target Width
                    </div>

                    <div className="mt-1 text-2xl font-bold text-slate-900">
                      {targetWidth}px
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">
                      Target Height
                    </div>

                    <div className="mt-1 text-2xl font-bold text-slate-900">
                      {targetHeight}px
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FORMAT */}

            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Output Format
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setOutputFormat("jpg")
                  }
                  className={`rounded-xl border px-4 py-3 font-semibold ${
                    outputFormat === "jpg"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-300"
                  }`}
                >
                  JPG
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setOutputFormat("png")
                  }
                  className={`rounded-xl border px-4 py-3 font-semibold ${
                    outputFormat === "png"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-slate-300"
                  }`}
                >
                  PNG
                </button>
              </div>
            </div>

            {/* QUALITY */}

            {outputFormat === "jpg" && (
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    JPG Quality
                  </label>

                  <span className="font-bold text-blue-600">
                    {quality}%
                  </span>
                </div>

                <input
                  type="range"
                  min="50"
                  max="100"
                  value={quality}
                  onChange={(e) =>
                    setQuality(
                      Number(e.target.value)
                    )
                  }
                  className="mt-3 w-full"
                />
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* CONVERT */}

            <button
              type="button"
              onClick={convertDpi}
              disabled={
                processing ||
                !imageInfo
              }
              className="mt-7 w-full rounded-xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? "Converting..."
                : `Convert to ${targetDpi} DPI`}
            </button>
          </div>

          {/* PREVIEW */}

          <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl font-bold text-slate-900">
              Preview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your converted image will appear here.
            </p>

            <div className="mt-6 flex min-h-[430px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-6">
              {result ? (
                <img
                  src={result}
                  alt={`Converted ${targetDpi} DPI image`}
                  className="max-h-[390px] max-w-full object-contain shadow-lg"
                />
              ) : image ? (
                <img
                  src={image}
                  alt="Original uploaded image"
                  className="max-h-[390px] max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <div className="text-5xl">
                    🖼️
                  </div>

                  <p className="mt-3 text-sm">
                    Upload an image to see the preview.
                  </p>
                </div>
              )}
            </div>

            {result && (
              <>
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500">
                        DPI
                      </div>

                      <div className="mt-1 font-bold text-slate-900">
                        {targetDpi}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">
                        Estimated Size
                      </div>

                      <div className="mt-1 font-bold text-slate-900">
                        {formatBytes(
                          resultSize
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadResult}
                  className="mt-5 w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white transition hover:bg-green-700"
                >
                  Download {outputFormat.toUpperCase()}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* INFO */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold text-slate-900">
            What is DPI?
          </h2>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
            DPI means dots per inch and is commonly used
            when discussing print resolution. Changing DPI
            while maintaining the same physical print size
            changes the number of pixels used to represent
            the image.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900">
                72 DPI
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Commonly encountered in older digital
                image workflows.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900">
                300 DPI
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                A common high-quality print resolution.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900">
                600 DPI
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Produces substantially more pixels for the
                same physical dimensions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-3xl font-bold text-slate-900">
            Photo DPI Converter FAQ
          </h2>

          <div className="mt-8 space-y-4">
            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                How do I convert an image to 300 DPI?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Upload your image, select its current DPI,
                choose 300 DPI as the target and click
                Convert.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Does changing DPI improve image quality?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Changing the DPI value itself does not create
                new photographic detail. This tool generates
                a new pixel dimension corresponding to the
                selected physical size and target DPI.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Is 300 DPI good for printing photos?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                300 DPI is a commonly used print-resolution
                target, although the ideal setting depends
                on the printer and intended use.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Are my photos uploaded to a server?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The conversion is performed in your browser.
                The image does not need to be uploaded to a
                server for this tool.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}