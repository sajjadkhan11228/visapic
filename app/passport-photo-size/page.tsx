"use client";

import { ChangeEvent, useMemo, useState } from "react";

type Preset = {
  name: string;
  widthMm: number;
  heightMm: number;
  note: string;
};

const PRESETS: Record<string, Preset> = {
  us: {
    name: "United States",
    widthMm: 51,
    heightMm: 51,
    note: "US passport photo size",
  },
  uk: {
    name: "United Kingdom",
    widthMm: 35,
    heightMm: 45,
    note: "UK passport photo size",
  },
  canada: {
    name: "Canada",
    widthMm: 50,
    heightMm: 70,
    note: "Canadian passport photo size",
  },
  pakistan: {
    name: "Pakistan",
    widthMm: 35,
    heightMm: 45,
    note: "Pakistan visa/passport-style preset",
  },
  india: {
    name: "India",
    widthMm: 35,
    heightMm: 45,
    note: "VisaPic preset — verify your application",
  },
  germany: {
    name: "Germany",
    widthMm: 35,
    heightMm: 45,
    note: "VisaPic preset — verify your application",
  },
  france: {
    name: "France",
    widthMm: 35,
    heightMm: 45,
    note: "VisaPic preset — verify your application",
  },
  saudi: {
    name: "Saudi Arabia",
    widthMm: 35,
    heightMm: 45,
    note: "VisaPic preset — verify your application",
  },
  uae: {
    name: "United Arab Emirates",
    widthMm: 35,
    heightMm: 45,
    note: "VisaPic preset — verify your application",
  },
};

const dpiOptions = [150, 200, 300, 600];

const backgroundOptions = [
  { name: "White", value: "#ffffff" },
  { name: "Off White", value: "#f8f8f5" },
  { name: "Light Gray", value: "#eeeeee" },
  { name: "Blue", value: "#dcecff" },
];

function mmToPixels(mm: number, dpi: number) {
  return Math.round((mm / 25.4) * dpi);
}

export default function PassportPhotoSizePage() {
  const [country, setCountry] = useState("us");

  const [widthMm, setWidthMm] = useState(51);
  const [heightMm, setHeightMm] = useState(51);

  const [dpi, setDpi] = useState(300);
  const [quality, setQuality] = useState(92);

  const [background, setBackground] = useState("#ffffff");

  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  const [result, setResult] = useState<string | null>(null);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const outputWidth = useMemo(
    () => mmToPixels(widthMm, dpi),
    [widthMm, dpi]
  );

  const outputHeight = useMemo(
    () => mmToPixels(heightMm, dpi),
    [heightMm, dpi]
  );

  const selectedPreset = PRESETS[country];

  const handleCountryChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const value = event.target.value;

    setCountry(value);

    if (value !== "custom") {
      const preset = PRESETS[value];

      setWidthMm(preset.widthMm);
      setHeightMm(preset.heightMm);
    }

    setResult(null);
    setError("");
  };

  const handleFile = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError("");
    setResult(null);

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result as string);
    };

    reader.onerror = () => {
      setError("Could not read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  const createPhoto = async () => {
    if (!image) {
      setError("Please upload a photo first.");
      return;
    }

    if (
      widthMm <= 0 ||
      heightMm <= 0 ||
      outputWidth <= 0 ||
      outputHeight <= 0
    ) {
      setError("Please enter valid dimensions.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setResult(null);

      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();

        img.onerror = () =>
          reject(
            new Error("Unable to load the selected image.")
          );

        img.src = image;
      });

      const canvas = document.createElement("canvas");

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas is not supported.");
      }

      /*
       * Fill the selected background first.
       */
      ctx.fillStyle = background;
      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      /*
       * Cover crop:
       * The original photo is cropped to the selected
       * passport/visa aspect ratio.
       */
      const sourceWidth = img.naturalWidth;
      const sourceHeight = img.naturalHeight;

      const sourceRatio =
        sourceWidth / sourceHeight;

      const targetRatio =
        outputWidth / outputHeight;

      let cropWidth = sourceWidth;
      let cropHeight = sourceHeight;
      let cropX = 0;
      let cropY = 0;

      if (sourceRatio > targetRatio) {
        cropWidth =
          sourceHeight * targetRatio;

        cropX =
          (sourceWidth - cropWidth) / 2;
      } else {
        cropHeight =
          sourceWidth / targetRatio;

        cropY =
          (sourceHeight - cropHeight) / 2;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      const jpegQuality =
        Math.max(
          0.1,
          Math.min(1, quality / 100)
        );

      const dataUrl =
        canvas.toDataURL(
          "image/jpeg",
          jpegQuality
        );

      setResult(dataUrl);
    } catch (err) {
      console.error(
        "Passport photo size conversion error:",
        err
      );

      setError(
        "Could not create the photo. Please try another image."
      );
    } finally {
      setProcessing(false);
    }
  };

  const downloadPhoto = () => {
    if (!result) return;

    const link =
      document.createElement("a");

    const cleanName =
      fileName
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]/g, "-");

    link.href = result;

    link.download =
      `${cleanName || "passport-photo"}-${outputWidth}x${outputHeight}.jpg`;

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
              Free Online Photo Tool
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Passport Photo Size Converter
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Convert your photo to a standard passport,
              visa or ID photo size. Select a country,
              choose the required dimensions and create
              a high-quality JPG directly in your browser.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* SETTINGS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900">
                Photo Size Settings
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose a country preset or enter your own
                dimensions.
              </p>
            </div>

            {/* COUNTRY */}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Country / Region
              </span>

              <select
                value={country}
                onChange={handleCountryChange}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
              >
                <option value="us">
                  United States
                </option>

                <option value="uk">
                  United Kingdom
                </option>

                <option value="canada">
                  Canada
                </option>

                <option value="pakistan">
                  Pakistan
                </option>

                <option value="india">
                  India
                </option>

                <option value="germany">
                  Germany
                </option>

                <option value="france">
                  France
                </option>

                <option value="saudi">
                  Saudi Arabia
                </option>

                <option value="uae">
                  United Arab Emirates
                </option>

                <option value="custom">
                  Custom Size
                </option>
              </select>
            </label>

            {country !== "custom" &&
              selectedPreset && (
                <div className="mt-3 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  <strong>
                    {selectedPreset.widthMm} ×{" "}
                    {selectedPreset.heightMm} mm
                  </strong>

                  <div className="mt-1 text-xs text-blue-700">
                    {selectedPreset.note}
                  </div>
                </div>
              )}

            {/* DIMENSIONS */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Width (mm)
                </span>

                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.1"
                  value={widthMm}
                  onChange={(e) => {
                    setCountry("custom");
                    setWidthMm(
                      Number(e.target.value)
                    );
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>

              <label>
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Height (mm)
                </span>

                <input
                  type="number"
                  min="1"
                  max="500"
                  step="0.1"
                  value={heightMm}
                  onChange={(e) => {
                    setCountry("custom");
                    setHeightMm(
                      Number(e.target.value)
                    );
                  }}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </label>
            </div>

            {/* DPI */}

            <label className="mt-6 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Output Resolution (DPI)
              </span>

              <select
                value={dpi}
                onChange={(e) =>
                  setDpi(
                    Number(e.target.value)
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {dpiOptions.map((value) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {value} DPI
                  </option>
                ))}
              </select>
            </label>

            {/* OUTPUT */}

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">
                Generated Output
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white p-4">
                  <div className="text-xs text-slate-500">
                    Width
                  </div>

                  <div className="mt-1 text-xl font-bold text-slate-900">
                    {outputWidth}px
                  </div>
                </div>

                <div className="rounded-xl bg-white p-4">
                  <div className="text-xs text-slate-500">
                    Height
                  </div>

                  <div className="mt-1 text-xl font-bold text-slate-900">
                    {outputHeight}px
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-slate-500">
                These are the dimensions generated by
                VisaPic at your selected DPI. Always
                verify the exact digital requirements of
                your application.
              </p>
            </div>

            {/* QUALITY */}

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  JPG Quality
                </label>

                <span className="text-sm font-bold text-blue-600">
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

            {/* BACKGROUND */}

            <div className="mt-6">
              <div className="mb-3 text-sm font-semibold text-slate-700">
                Background
              </div>

              <div className="flex flex-wrap gap-3">
                {backgroundOptions.map(
                  (option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setBackground(
                          option.value
                        )
                      }
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                        background ===
                        option.value
                          ? "border-blue-500 ring-2 ring-blue-100"
                          : "border-slate-300"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-slate-300"
                        style={{
                          backgroundColor:
                            option.value,
                        }}
                      />

                      {option.name}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* UPLOAD */}

            <div className="mt-8">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <div className="text-4xl">
                  📷
                </div>

                <div className="mt-3 font-bold text-slate-900">
                  Upload Your Photo
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  JPG, PNG, WebP and other common image
                  formats
                </div>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>

              {fileName && (
                <div className="mt-3 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
                  ✓ {fileName}
                </div>
              )}
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* BUTTON */}

            <button
              type="button"
              onClick={createPhoto}
              disabled={
                processing || !image
              }
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? "Creating Photo..."
                : "Create Passport Photo"}
            </button>
          </div>

          {/* PREVIEW */}

          <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl font-bold text-slate-900">
              Preview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your generated photo will appear here.
            </p>

            <div className="mt-6 flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 p-6">
              {result ? (
                <img
                  src={result}
                  alt="Generated passport photo"
                  className="max-h-[380px] max-w-full object-contain shadow-lg"
                />
              ) : image ? (
                <img
                  src={image}
                  alt="Uploaded photo preview"
                  className="max-h-[380px] max-w-full object-contain"
                />
              ) : (
                <div className="text-center text-slate-400">
                  <div className="text-5xl">
                    🖼️
                  </div>

                  <p className="mt-3 text-sm">
                    Upload a photo to see the preview.
                  </p>
                </div>
              )}
            </div>

            {result && (
              <>
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-slate-500">
                        Physical size
                      </div>

                      <div className="mt-1 font-bold text-slate-900">
                        {widthMm} × {heightMm} mm
                      </div>
                    </div>

                    <div>
                      <div className="text-slate-500">
                        Pixels
                      </div>

                      <div className="mt-1 font-bold text-slate-900">
                        {outputWidth} ×{" "}
                        {outputHeight}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadPhoto}
                  className="mt-5 w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white transition hover:bg-green-700"
                >
                  Download JPG
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* INFO */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Country Photo Sizes
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Quickly generate common passport and visa
                photo dimensions for different countries.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                High Resolution
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Choose from 150, 200, 300 or 600 DPI and
                generate the corresponding pixel dimensions.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Private Processing
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your image is processed directly in your
                browser. It does not need to be uploaded to
                a server for conversion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-3xl font-bold text-slate-900">
            Passport Photo Size Converter FAQ
          </h2>

          <div className="mt-8 space-y-4">
            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                What size should a passport photo be?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Passport and visa photo dimensions vary
                by country and application. Select your
                destination above to use a common VisaPic
                size preset.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                What is DPI?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                DPI means dots per inch. It determines how
                many pixels are generated from the physical
                millimetre dimensions.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Does this tool make my photo officially
                compliant?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                No. This tool standardizes the image size
                and output format. Official applications
                may also have requirements for face size,
                pose, lighting, background, recency and
                digital file limits.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}