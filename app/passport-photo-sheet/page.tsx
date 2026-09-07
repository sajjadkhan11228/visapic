"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type PaperType = "a4" | "4x6";

type PhotoPreset = {
  name: string;
  widthMm: number;
  heightMm: number;
};

const photoPresets: Record<string, PhotoPreset> = {
  us: {
    name: "US Passport",
    widthMm: 51,
    heightMm: 51,
  },
  uk: {
    name: "UK / Pakistan / Visa",
    widthMm: 35,
    heightMm: 45,
  },
  canada: {
    name: "Canada Passport",
    widthMm: 50,
    heightMm: 70,
  },
  custom35x45: {
    name: "35 × 45 mm",
    widthMm: 35,
    heightMm: 45,
  },
};

const copiesOptions = [4, 6, 8, 10, 12];

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

const DPI = 300;

function mmToPixels(mm: number) {
  return Math.round((mm / 25.4) * DPI);
}

function inchToPixels(inch: number) {
  return Math.round(inch * DPI);
}

export default function PassportPhotoSheetPage() {
  const [paper, setPaper] =
    useState<PaperType>("a4");

  const [photoPreset, setPhotoPreset] =
    useState("us");

  const [copies, setCopies] =
    useState(8);

  const [spacing, setSpacing] =
    useState(6);

  const [background, setBackground] =
    useState("#ffffff");

  const [image, setImage] =
    useState<string | null>(null);

  const [fileName, setFileName] =
    useState("");

  const [result, setResult] =
    useState<string | null>(null);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState("");

  const preset =
    photoPresets[photoPreset];

  const photoWidthPx = useMemo(
    () => mmToPixels(preset.widthMm),
    [preset.widthMm]
  );

  const photoHeightPx = useMemo(
    () => mmToPixels(preset.heightMm),
    [preset.heightMm]
  );

  const paperWidthPx =
    paper === "a4"
      ? mmToPixels(210)
      : inchToPixels(6);

  const paperHeightPx =
    paper === "a4"
      ? mmToPixels(297)
      : inchToPixels(4);

  const paperLabel =
    paper === "a4"
      ? "A4 — 210 × 297 mm"
      : "4 × 6 inch";

  useEffect(() => {
    setResult(null);
  }, [
    paper,
    photoPreset,
    copies,
    spacing,
    background,
  ]);

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
    setFileName(file.name);

    const reader =
      new FileReader();

    reader.onload = () => {
      setImage(
        reader.result as string
      );
    };

    reader.onerror = () => {
      setError(
        "Unable to read the image."
      );
    };

    reader.readAsDataURL(file);
  };

  const createSheet = async () => {
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

      canvas.width =
        paperWidthPx;

      canvas.height =
        paperHeightPx;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Canvas is not supported."
        );
      }

      ctx.fillStyle =
        background;

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.imageSmoothingEnabled =
        true;

      ctx.imageSmoothingQuality =
        "high";

      /*
       * Determine the maximum number
       * of photos that can fit into
       * the selected paper.
       */

      const gapPx =
        mmToPixels(spacing);

      const marginPx =
        mmToPixels(8);

      const availableWidth =
        canvas.width -
        marginPx * 2;

      const availableHeight =
        canvas.height -
        marginPx * 2;

      const columns =
        Math.max(
          1,
          Math.floor(
            (availableWidth + gapPx) /
              (photoWidthPx + gapPx)
          )
        );

      const rows =
        Math.max(
          1,
          Math.floor(
            (availableHeight + gapPx) /
              (photoHeightPx + gapPx)
          )
        );

      const maxPhotos =
        columns * rows;

      if (maxPhotos < copies) {
        throw new Error(
          `Only ${maxPhotos} photos fit on this sheet with the current size and spacing. Reduce spacing, choose a smaller photo size, or choose fewer copies.`
        );
      }

      /*
       * Center the complete grid
       * on the paper.
       */

      const gridWidth =
        columns * photoWidthPx +
        (columns - 1) * gapPx;

      const gridHeight =
        rows * photoHeightPx +
        (rows - 1) * gapPx;

      const startX =
        (canvas.width -
          gridWidth) /
        2;

      const startY =
        (canvas.height -
          gridHeight) /
        2;

      /*
       * Draw each passport photo.
       * The image is cover-cropped
       * to the selected photo ratio.
       */

      for (
        let index = 0;
        index < copies;
        index++
      ) {
        const column =
          index % columns;

        const row =
          Math.floor(
            index / columns
          );

        const x =
          startX +
          column *
            (photoWidthPx + gapPx);

        const y =
          startY +
          row *
            (photoHeightPx + gapPx);

        const sourceWidth =
          img.naturalWidth;

        const sourceHeight =
          img.naturalHeight;

        const sourceRatio =
          sourceWidth /
          sourceHeight;

        const targetRatio =
          photoWidthPx /
          photoHeightPx;

        let sx = 0;
        let sy = 0;
        let sw = sourceWidth;
        let sh = sourceHeight;

        if (
          sourceRatio >
          targetRatio
        ) {
          sw =
            sourceHeight *
            targetRatio;

          sx =
            (sourceWidth - sw) /
            2;
        } else {
          sh =
            sourceWidth /
            targetRatio;

          sy =
            (sourceHeight - sh) /
            2;
        }

        ctx.drawImage(
          img,
          sx,
          sy,
          sw,
          sh,
          x,
          y,
          photoWidthPx,
          photoHeightPx
        );
      }

      const output =
        canvas.toDataURL(
          "image/jpeg",
          0.95
        );

      setResult(output);
    } catch (err) {
      console.error(
        "Passport sheet error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not create the photo sheet."
      );
    } finally {
      setProcessing(false);
    }
  };

  const downloadSheet = () => {
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
      `${cleanName || "passport-photo"}-sheet-${paper}.jpg`;

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
              Free Printable Passport Photo Sheet
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Passport Photo Sheet Generator
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Put multiple passport or visa photos on
              one printable A4 or 4×6 inch photo sheet.
              Choose the photo size, number of copies and
              spacing, then download a high-resolution JPG.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_430px]">

          {/* LEFT */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-2xl font-bold text-slate-900">
              Create Photo Sheet
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Configure your printable sheet below.
            </p>

            {/* PAPER */}

            <div className="mt-7">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Paper Size
              </label>

              <select
                value={paper}
                onChange={(e) =>
                  setPaper(
                    e.target.value as PaperType
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                <option value="a4">
                  A4 — 210 × 297 mm
                </option>

                <option value="4x6">
                  4 × 6 inch Photo Paper
                </option>
              </select>
            </div>

            {/* PHOTO SIZE */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Passport Photo Size
              </label>

              <select
                value={photoPreset}
                onChange={(e) =>
                  setPhotoPreset(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
              >
                {Object.entries(
                  photoPresets
                ).map(
                  ([key, item]) => (
                    <option
                      key={key}
                      value={key}
                    >
                      {item.name} —{" "}
                      {item.widthMm} ×{" "}
                      {item.heightMm} mm
                    </option>
                  )
                )}
              </select>
            </div>

            {/* COPIES */}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Number of Copies
              </label>

              <div className="grid grid-cols-5 gap-2">
                {copiesOptions.map(
                  (number) => {
                    const selected =
                      copies === number;

                    return (
                      <button
                        key={number}
                        type="button"
                        onClick={() =>
                          setCopies(
                            number
                          )
                        }
                        className={`rounded-xl border px-3 py-3 text-sm font-bold transition ${
                          selected
                            ? "border-blue-500 bg-blue-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {number}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* SPACING */}

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">
                  Spacing
                </label>

                <span className="text-sm font-bold text-blue-600">
                  {spacing} mm
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={spacing}
                onChange={(e) =>
                  setSpacing(
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
                Sheet Background
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {backgrounds.map(
                  (item) => {
                    const selected =
                      background ===
                      item.value;

                    return (
                      <button
                        key={
                          item.value
                        }
                        type="button"
                        onClick={() =>
                          setBackground(
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

            {/* UPLOAD */}

            <label className="mt-7 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50">

              <div className="text-5xl">
                📷
              </div>

              <div className="mt-4 font-bold text-slate-900">
                Upload Photo
              </div>

              <div className="mt-2 text-sm text-slate-500">
                JPG, PNG, WebP and other
                common image formats
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

            {/* INFO */}

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <div className="grid grid-cols-2 gap-4">

                <div>
                  <div className="text-xs text-slate-500">
                    Paper
                  </div>

                  <div className="mt-1 font-bold text-slate-900">
                    {paperLabel}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">
                    Photo
                  </div>

                  <div className="mt-1 font-bold text-slate-900">
                    {preset.widthMm} ×{" "}
                    {preset.heightMm} mm
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">
                    Copies
                  </div>

                  <div className="mt-1 font-bold text-slate-900">
                    {copies}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">
                    Quality
                  </div>

                  <div className="mt-1 font-bold text-slate-900">
                    {DPI} DPI
                  </div>
                </div>

              </div>
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={createSheet}
              disabled={
                processing || !image
              }
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? "Creating Sheet..."
                : "Create Printable Sheet"}
            </button>
          </div>

          {/* RIGHT PREVIEW */}

          <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">

            <h2 className="text-xl font-bold text-slate-900">
              Sheet Preview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Preview of your printable layout.
            </p>

            <div className="mt-6 flex min-h-[560px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-5">

              <div
                className="relative overflow-hidden border border-slate-300 shadow-xl"
                style={{
                  width:
                    paper === "a4"
                      ? "300px"
                      : "360px",
                  aspectRatio:
                    `${paperWidthPx} / ${paperHeightPx}`,
                  backgroundColor:
                    background,
                }}
              >

                {image ? (
                  <>
                    {Array.from({
                      length: copies,
                    }).map(
                      (_, index) => {
                        const columns =
                          paper === "a4"
                            ? photoWidthPx <
                              mmToPixels(
                                40
                              )
                              ? 4
                              : 3
                            : photoWidthPx <
                              mmToPixels(
                                40
                              )
                            ? 3
                            : 2;

                        const rows =
                          Math.ceil(
                            copies /
                              columns
                          );

                        const gap =
                          3;

                        const previewPhotoWidth =
                          (
                            100 -
                            gap *
                              (columns -
                                1)
                          ) /
                          columns;

                        const previewPhotoHeight =
                          previewPhotoWidth *
                          (preset.heightMm /
                            preset.widthMm);

                        const column =
                          index %
                          columns;

                        const row =
                          Math.floor(
                            index /
                              columns
                          );

                        const totalHeight =
                          rows *
                            previewPhotoHeight +
                          (rows - 1) *
                            gap;

                        const topOffset =
                          Math.max(
                            2,
                            (100 -
                              totalHeight) /
                              2
                          );

                        return (
                          <div
                            key={index}
                            className="absolute overflow-hidden border border-slate-300 bg-white"
                            style={{
                              width: `${previewPhotoWidth}%`,
                              height: `${previewPhotoHeight}%`,
                              left: `${column * (previewPhotoWidth + gap)}%`,
                              top: `${topOffset + row * (previewPhotoHeight + gap)}%`,
                            }}
                          >
                            <img
                              src={image}
                              alt={`Passport photo ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        );
                      }
                    )}
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-slate-400">
                    <div>
                      <div className="text-5xl">
                        📄
                      </div>

                      <p className="mt-3 text-sm">
                        Upload a photo to preview
                        the sheet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {result && (
              <button
                type="button"
                onClick={downloadSheet}
                className="mt-5 w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white transition hover:bg-green-700"
              >
                Download JPG Sheet
              </button>
            )}

            <div className="mt-5 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">
              The generated sheet is designed for
              printing at {DPI} DPI. For accurate physical
              dimensions, print at 100% / actual size and
              disable options such as “Fit to Page”.
            </div>
          </div>
        </div>
      </section>

      {/* SEO CONTENT */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">

          <h2 className="text-3xl font-bold text-slate-900">
            Print Multiple Passport Photos on One Sheet
          </h2>

          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-600">
            VisaPic Passport Photo Sheet Generator helps
            you arrange multiple copies of a passport,
            visa or ID-style photo onto printable photo
            paper. Select your paper size, choose the
            required photo dimensions and generate a
            high-resolution sheet in your browser.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">

            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="text-3xl">
                📄
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                A4 & 4×6 Paper
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Create layouts for standard A4 paper or
                common 4×6 inch photo paper.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-6">
              <div className="text-3xl">
                🖨️
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Print Ready
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Generate a 300 DPI image suitable for
                printing at actual size.
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
                Your image is processed locally in the
                browser instead of being uploaded to a
                server.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ */}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">

          <h2 className="text-3xl font-bold text-slate-900">
            Passport Photo Sheet FAQ
          </h2>

          <div className="mt-8 space-y-4">

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                How many passport photos can fit on an A4 sheet?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The number depends on the selected photo
                dimensions and spacing. VisaPic automatically
                calculates the available layout for the
                selected number of copies.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Can I print passport photos at home?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes. Download the generated sheet and print
                it at 100% or actual size. Avoid printer
                settings that automatically scale the image.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                What DPI should passport photos use?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                This generator creates the printable sheet at
                300 DPI. The exact submission requirements
                depend on the passport, visa or ID application.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Are my photos uploaded to a server?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The sheet is generated in your browser, so the
                image does not need to be uploaded to a server
                for this tool.
              </p>
            </details>

          </div>
        </div>
      </section>

      {/* NOTICE */}

      <section className="bg-yellow-50">
        <div className="mx-auto max-w-5xl px-6 py-10">

          <h2 className="text-xl font-bold text-yellow-900">
            Important Printing Notice
          </h2>

          <p className="mt-3 text-sm leading-7 text-yellow-800">
            Passport and visa authorities may have specific
            requirements for photo dimensions, face size,
            background, lighting, image quality and printing.
            The presets in this tool are layout presets and
            should not be treated as a guarantee of acceptance.
            Always verify the official requirements for your
            specific application.
          </p>

        </div>
      </section>
    </main>
  );
}