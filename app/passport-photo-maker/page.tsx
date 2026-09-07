"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type CountryPreset = {
  name: string;
  widthMm: number;
  heightMm: number;
  note: string;
};

const countries: Record<
  string,
  CountryPreset
> = {
  us: {
    name: "United States",
    widthMm: 51,
    heightMm: 51,
    note: "US passport photo preset",
  },
  uk: {
    name: "United Kingdom",
    widthMm: 35,
    heightMm: 45,
    note: "UK passport photo preset",
  },
  canada: {
    name: "Canada",
    widthMm: 50,
    heightMm: 70,
    note: "Canadian passport photo preset",
  },
  pakistan: {
    name: "Pakistan",
    widthMm: 35,
    heightMm: 45,
    note: "Pakistan passport/visa-style preset",
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

const backgrounds = [
  {
    name: "White",
    value: "#ffffff",
  },
  {
    name: "Off White",
    value: "#f8f8f5",
  },
  {
    name: "Light Gray",
    value: "#eeeeee",
  },
  {
    name: "Light Blue",
    value: "#e0f2fe",
  },
];

const dpi = 300;

function mmToPixels(mm: number) {
  return Math.round(
    (mm / 25.4) * dpi
  );
}

export default function PassportPhotoMakerPage() {
  const [country, setCountry] =
    useState("us");

  const [image, setImage] =
    useState<string | null>(null);

  const [fileName, setFileName] =
    useState("");

  const [zoom, setZoom] =
    useState(1);

  const [positionX, setPositionX] =
    useState(50);

  const [positionY, setPositionY] =
    useState(50);

  const [
    selectedBackground,
    setSelectedBackground,
  ] = useState("#ffffff");

  const [result, setResult] =
    useState<string | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const preset =
    countries[country];

  const outputWidth = useMemo(
    () =>
      mmToPixels(
        preset.widthMm
      ),
    [preset.widthMm]
  );

  const outputHeight = useMemo(
    () =>
      mmToPixels(
        preset.heightMm
      ),
    [preset.heightMm]
  );

  useEffect(() => {
    setResult(null);
    setZoom(1);
    setPositionX(50);
    setPositionY(50);
  }, [country]);

  const handleFile = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image."
      );
      return;
    }

    setError("");
    setResult(null);
    setFileName(file.name);

    const reader =
      new FileReader();

    reader.onload = () => {
      setImage(
        reader.result as string
      );

      setZoom(1);
      setPositionX(50);
      setPositionY(50);
    };

    reader.onerror = () => {
      setError(
        "Unable to read the image."
      );
    };

    reader.readAsDataURL(file);
  };

  const createPhoto = async () => {
    if (!image) {
      setError(
        "Please upload a photo first."
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

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Canvas is not supported."
        );
      }

      /*
       * Background
       */
      ctx.fillStyle =
        selectedBackground;

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      /*
       * Calculate cover crop.
       */
      const imageWidth =
        img.naturalWidth;

      const imageHeight =
        img.naturalHeight;

      const targetRatio =
        outputWidth /
        outputHeight;

      let baseWidth =
        imageWidth;

      let baseHeight =
        imageHeight;

      const imageRatio =
        imageWidth /
        imageHeight;

      if (imageRatio > targetRatio) {
        baseWidth =
          imageHeight *
          targetRatio;
      } else {
        baseHeight =
          imageWidth /
          targetRatio;
      }

      /*
       * Zoom in/out around center.
       */
      const cropWidth =
        baseWidth / zoom;

      const cropHeight =
        baseHeight / zoom;

      /*
       * Position ranges.
       */
      const maxX =
        imageWidth -
        cropWidth;

      const maxY =
        imageHeight -
        cropHeight;

      const cropX =
        (maxX *
          positionX) /
        100;

      const cropY =
        (maxY *
          positionY) /
        100;

      ctx.imageSmoothingEnabled =
        true;

      ctx.imageSmoothingQuality =
        "high";

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

      const output =
        canvas.toDataURL(
          "image/jpeg",
          0.94
        );

      setResult(output);
    } catch (err) {
      console.error(
        "Passport maker error:",
        err
      );

      setError(
        "Could not create the passport photo."
      );
    } finally {
      setProcessing(false);
    }
  };

  const downloadPhoto = () => {
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
      `${cleanName || "passport-photo"}-${country}.jpg`;

    document.body.appendChild(link);

    link.click();

    link.remove();
  };

  const resetEditor = () => {
    setZoom(1);
    setPositionX(50);
    setPositionY(50);
    setResult(null);
    setError("");
  };

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Free Online Passport Photo Maker
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Passport Photo Maker
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Create a passport, visa or ID-style photo
              online. Choose your country, adjust the
              crop and download a high-resolution JPG.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_430px]">
          {/* EDITOR */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Create Your Photo
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Upload a photo and adjust its position
                before creating the final image.
              </p>
            </div>

            {/* COUNTRY */}

            <div className="mt-7">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Country / Region
              </label>

              <select
                value={country}
                onChange={(e) =>
                  setCountry(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {Object.entries(
                  countries
                ).map(
                  ([
                    key,
                    item,
                  ]) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {item.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* SIZE */}

            <div className="mt-4 rounded-2xl bg-blue-50 p-5">
              <div className="text-sm font-semibold text-blue-800">
                Selected Photo Size
              </div>

              <div className="mt-1 text-2xl font-bold text-slate-900">
                {preset.widthMm} ×{" "}
                {preset.heightMm} mm
              </div>

              <div className="mt-1 text-sm text-blue-700">
                Generated at {dpi} DPI ·{" "}
                {outputWidth} ×{" "}
                {outputHeight}px
              </div>

              <div className="mt-2 text-xs text-blue-700">
                {preset.note}
              </div>
            </div>

            {/* UPLOAD */}

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50">
              <div className="text-5xl">
                📷
              </div>

              <div className="mt-4 font-bold text-slate-900">
                Upload Photo
              </div>

              <div className="mt-2 text-sm text-slate-500">
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
              <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                ✓ {fileName}
              </div>
            )}

            {/* CONTROLS */}

            {image && (
              <>
                <div className="mt-8">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      Zoom
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {zoom.toFixed(2)}×
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={(e) =>
                      setZoom(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="mt-3 w-full"
                  />
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      Horizontal Position
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {Math.round(
                        positionX
                      )}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={positionX}
                    onChange={(e) =>
                      setPositionX(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="mt-3 w-full"
                  />
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">
                      Vertical Position
                    </label>

                    <span className="text-sm font-bold text-blue-600">
                      {Math.round(
                        positionY
                      )}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={positionY}
                    onChange={(e) =>
                      setPositionY(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="mt-3 w-full"
                  />
                </div>

                {/* BACKGROUND */}

                <div className="mt-7">
                  <div className="mb-3 text-sm font-semibold text-slate-700">
                    Background
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {backgrounds.map(
                      (item) => {
                        const selected =
                          selectedBackground ===
                          item.value;

                        return (
                          <button
                            key={
                              item.value
                            }
                            type="button"
                            onClick={() =>
                              setSelectedBackground(
                                item.value
                              )
                            }
                            className={`rounded-xl border p-3 transition ${
                              selected
                                ? "border-blue-500 ring-2 ring-blue-100"
                                : "border-slate-200"
                            }`}
                          >
                            <div
                              className="h-8 rounded-lg border border-slate-300"
                              style={{
                                backgroundColor:
                                  item.value,
                              }}
                            />

                            <div className="mt-2 text-xs font-semibold">
                              {item.name}
                            </div>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* RESET */}

                <button
                  type="button"
                  onClick={resetEditor}
                  className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset Adjustments
                </button>
              </>
            )}

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* CREATE */}

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
              Photo Preview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review your photo before downloading.
            </p>

            <div
              className="mt-6 flex min-h-[500px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 p-6"
              style={{
                backgroundColor:
                  selectedBackground,
              }}
            >
              {image ? (
                <div
                  className="relative overflow-hidden shadow-xl"
                  style={{
                    width:
                      preset.widthMm ===
                      preset.heightMm
                        ? "330px"
                        : "280px",

                    aspectRatio: `${preset.widthMm} / ${preset.heightMm}`,

                    backgroundColor:
                      selectedBackground,
                  }}
                >
                  <img
                    src={image}
                    alt="Passport photo editor preview"
                    className="absolute left-1/2 top-1/2 max-w-none"
                    style={{
                      width: `${zoom * 100}%`,
                      height: `${zoom * 100}%`,
                      transform: `translate(
                        ${positionX - 50}%,
                        ${positionY - 50}%
                      ) translate(-50%, -50%)`,
                      objectFit: "cover",
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-slate-400">
                  <div className="text-5xl">
                    📷
                  </div>

                  <p className="mt-3 text-sm">
                    Upload a photo to start.
                  </p>
                </div>
              )}
            </div>

            {/* RESULT */}

            {result && (
              <>
                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-slate-500">
                        Size
                      </div>

                      <div className="mt-1 font-bold text-slate-900">
                        {preset.widthMm} ×{" "}
                        {preset.heightMm} mm
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-slate-500">
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
          <h2 className="text-3xl font-bold text-slate-900">
            Create Passport Photos Online
          </h2>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
            VisaPic lets you prepare a standardized
            passport-style image without installing desktop
            software. Select a destination, adjust the
            framing and generate a downloadable JPG.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="text-3xl">
                🌍
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Country Presets
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Start with common passport and visa-style
                dimensions.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="text-3xl">
                ✂️
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Easy Positioning
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Adjust zoom and positioning to frame your
                photo before exporting.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="text-3xl">
                🔒
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Browser Processing
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                The image is processed locally in your
                browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WARNING */}

      <section className="bg-yellow-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h2 className="text-xl font-bold text-yellow-900">
            Important Application Notice
          </h2>

          <p className="mt-3 text-sm leading-7 text-yellow-800">
            Passport and visa requirements can include
            additional rules for face size, head position,
            expression, lighting, background, clothing,
            image format, file size and photo recency.
            The dimensions generated here should not be
            treated as a guarantee of acceptance. Always
            check the official requirements for your specific
            application.
          </p>
        </div>
      </section>

      {/* FAQ */}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-3xl font-bold text-slate-900">
            Passport Photo Maker FAQ
          </h2>

          <div className="mt-8 space-y-4">
            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Can I make a passport photo online?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes. Upload your image, select a country
                preset, adjust the framing and create a JPG
                directly in your browser.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                What size is a passport photo?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Passport photo sizes vary by country and
                application. VisaPic provides common presets,
                but you should verify the official requirement
                before submitting.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Can I change the background?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                You can choose a background color in the
                editor. This does not automatically remove an
                existing opaque background from the original
                photo.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Are my photos uploaded to a server?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                This tool performs image processing in the
                browser, so the image does not need to be
                uploaded to a server for the conversion.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}