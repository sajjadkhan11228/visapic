"use client";

import { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";

type PaperSize = "A4" | "LETTER" | "4X6";

const PAPER_SIZES = {
  A4: {
    label: "A4",
    width: 210,
    height: 297,
  },
  LETTER: {
    label: "US Letter",
    width: 215.9,
    height: 279.4,
  },
  "4X6": {
    label: "4 × 6 inch",
    width: 101.6,
    height: 152.4,
  },
};

export default function PhotoToPDFPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [paper, setPaper] = useState<PaperSize>("A4");
  const [orientation, setOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");

  const [margin, setMargin] = useState(10);
  const [fitMode, setFitMode] = useState<
    "fit" | "fill"
  >("fit");

  const [working, setWorking] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  const handleFile = (file: File) => {
    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setError("Maximum file size is 25 MB.");
      return;
    }

    if (image) {
      URL.revokeObjectURL(image);
    }

    const url = URL.createObjectURL(file);

    setImage(url);
    setFileName(file.name);
  };

  const handleInputChange = (
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

  const loadImage = async () => {
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();

      img.onerror = () =>
        reject(
          new Error("Unable to load the selected image.")
        );

      img.src = image;
    });

    return img;
  };

  const generatePDF = async () => {
    if (!image) return;

    try {
      setWorking(true);
      setError("");
      setSuccess("");

      const img = await loadImage();

      let pageWidth =
        PAPER_SIZES[paper].width;

      let pageHeight =
        PAPER_SIZES[paper].height;

      if (orientation === "landscape") {
        [pageWidth, pageHeight] = [
          pageHeight,
          pageWidth,
        ];
      }

      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format:
          paper === "A4"
            ? "a4"
            : paper === "LETTER"
            ? "letter"
            : [
                PAPER_SIZES["4X6"].width,
                PAPER_SIZES["4X6"].height,
              ],
        compress: true,
      });

      const availableWidth =
        pageWidth - margin * 2;

      const availableHeight =
        pageHeight - margin * 2;

      const imageRatio =
        img.naturalWidth /
        img.naturalHeight;

      const pageRatio =
        availableWidth /
        availableHeight;

      let drawWidth = availableWidth;
      let drawHeight = availableHeight;

      if (fitMode === "fit") {
        if (imageRatio > pageRatio) {
          drawWidth = availableWidth;
          drawHeight =
            drawWidth / imageRatio;
        } else {
          drawHeight = availableHeight;
          drawWidth =
            drawHeight * imageRatio;
        }
      } else {
        if (imageRatio > pageRatio) {
          drawHeight = availableHeight;
          drawWidth =
            drawHeight * imageRatio;
        } else {
          drawWidth = availableWidth;
          drawHeight =
            drawWidth / imageRatio;
        }
      }

      const x =
        (pageWidth - drawWidth) / 2;

      const y =
        (pageHeight - drawHeight) / 2;

      /*
       * For "fill" mode, crop the image using a
       * temporary canvas so the PDF doesn't stretch it.
       */

      if (fitMode === "fill") {
        const canvas =
          document.createElement("canvas");

        const targetRatio =
          availableWidth /
          availableHeight;

        let sourceWidth =
          img.naturalWidth;

        let sourceHeight =
          img.naturalHeight;

        let sourceX = 0;
        let sourceY = 0;

        const sourceRatio =
          sourceWidth / sourceHeight;

        if (sourceRatio > targetRatio) {
          sourceWidth =
            sourceHeight * targetRatio;

          sourceX =
            (img.naturalWidth -
              sourceWidth) /
            2;
        } else {
          sourceHeight =
            sourceWidth / targetRatio;

          sourceY =
            (img.naturalHeight -
              sourceHeight) /
            2;
        }

        canvas.width = 1800;
        canvas.height = Math.round(
          1800 / targetRatio
        );

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          throw new Error(
            "Canvas is not supported."
          );
        }

        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          canvas.width,
          canvas.height
        );

        const croppedImage =
          canvas.toDataURL(
            "image/jpeg",
            0.95
          );

        pdf.addImage(
          croppedImage,
          "JPEG",
          margin,
          margin,
          availableWidth,
          availableHeight,
          undefined,
          "FAST"
        );
      } else {
        const canvas =
          document.createElement("canvas");

        canvas.width =
          img.naturalWidth;

        canvas.height =
          img.naturalHeight;

        const ctx =
          canvas.getContext("2d");

        if (!ctx) {
          throw new Error(
            "Canvas is not supported."
          );
        }

        ctx.drawImage(
          img,
          0,
          0
        );

        const imageData =
          canvas.toDataURL(
            "image/jpeg",
            0.95
          );

        pdf.addImage(
          imageData,
          "JPEG",
          x,
          y,
          drawWidth,
          drawHeight,
          undefined,
          "FAST"
        );
      }

      const cleanName =
        fileName
          .replace(/\.[^/.]+$/, "")
          .replace(/[^a-zA-Z0-9-_]/g, "-");

      pdf.save(
        `${cleanName || "visapic-photo"}-converted.pdf`
      );

      setSuccess(
        "PDF created successfully. Your download should start automatically."
      );
    } catch (err) {
      console.error(err);

      setError(
        "PDF generation failed. Please try another image."
      );
    } finally {
      setWorking(false);
    }
  };

  const reset = () => {
    if (image) {
      URL.revokeObjectURL(image);
    }

    setImage("");
    setFileName("");
    setError("");
    setSuccess("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const selectedPaper =
    PAPER_SIZES[paper];

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
              Photo to PDF Converter
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Convert your photo into a high-quality
              PDF document. Choose A4, US Letter or
              4×6 inch paper and download your PDF.
            </p>
          </div>
        </div>
      </section>

      {/* Tool */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Preview */}

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
                  📄
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Upload Your Photo
                </h2>

                <p className="mt-3 max-w-md text-slate-500">
                  Drag & drop your image here or click
                  to select a photo.
                </p>

                <button
                  type="button"
                  className="mt-7 rounded-xl bg-blue-600 px-7 py-3 font-bold text-white transition hover:bg-blue-700"
                >
                  Choose Photo
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
                {/* Image Preview */}

                <div className="rounded-2xl bg-slate-100 p-5">
                  <div className="flex min-h-[430px] items-center justify-center">
                    <img
                      src={image}
                      alt="Uploaded photo"
                      className="max-h-[430px] max-w-full rounded-xl object-contain shadow"
                    />
                  </div>
                </div>

                {/* File name */}

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-medium text-slate-500">
                    Selected File
                  </p>

                  <p className="mt-1 truncate font-semibold text-slate-900">
                    {fileName}
                  </p>
                </div>

                {/* Buttons */}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={generatePDF}
                    disabled={working}
                    className="flex-1 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {working
                      ? "Creating PDF..."
                      : "📄 Convert to PDF"}
                  </button>

                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Change Photo
                  </button>
                </div>

                {success && (
                  <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
                    ✓ {success}
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
              PDF Settings
            </h2>

            {/* Paper Size */}

            <div className="mt-6">
              <label className="text-sm font-bold text-slate-700">
                Paper Size
              </label>

              <div className="mt-3 space-y-2">
                {(
                  Object.keys(
                    PAPER_SIZES
                  ) as PaperSize[]
                ).map((key) => {
                  const item =
                    PAPER_SIZES[key];

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setPaper(key)
                      }
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        paper === key
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="font-semibold text-slate-900">
                        {item.label}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {item.width} ×{" "}
                        {item.height} mm
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orientation */}

            <div className="mt-6">
              <label className="text-sm font-bold text-slate-700">
                Orientation
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setOrientation("portrait")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    orientation ===
                    "portrait"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  Portrait
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setOrientation("landscape")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    orientation ===
                    "landscape"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  Landscape
                </button>
              </div>
            </div>

            {/* Margin */}

            <div className="mt-6">
              <label
                htmlFor="margin"
                className="text-sm font-bold text-slate-700"
              >
                Margin: {margin} mm
              </label>

              <input
                id="margin"
                type="range"
                min="0"
                max="30"
                step="1"
                value={margin}
                onChange={(event) =>
                  setMargin(
                    Number(
                      event.target.value
                    )
                  )
                }
                className="mt-3 w-full"
              />

              <div className="flex justify-between text-xs text-slate-400">
                <span>0 mm</span>
                <span>30 mm</span>
              </div>
            </div>

            {/* Fit */}

            <div className="mt-6">
              <label className="text-sm font-bold text-slate-700">
                Image Fit
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFitMode("fit")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    fitMode === "fit"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  Fit
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFitMode("fill")
                  }
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    fitMode === "fill"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  Fill
                </button>
              </div>
            </div>

            {/* Privacy */}

            <div className="mt-6 rounded-2xl bg-blue-50 p-5">
              <h3 className="font-bold text-blue-900">
                🔒 Privacy
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-700">
                Your image is processed directly in the
                browser. The photo does not need to be
                uploaded to a server.
              </p>
            </div>

            {/* Info */}

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">
                Current Paper
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {selectedPaper.label}:{" "}
                {selectedPaper.width} ×{" "}
                {selectedPaper.height} mm
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
                JPG to PDF
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Convert a JPG or JPEG image into a
                downloadable PDF document.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                PNG to PDF
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Convert PNG images into a clean PDF
                document directly from your browser.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                A4 Photo PDF
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create an A4-sized PDF with your photo
                centered and ready for printing.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl bg-slate-50 p-6 text-sm leading-7 text-slate-500">
            <strong className="text-slate-700">
              Important:
            </strong>{" "}
            This tool creates a PDF from your image. It
            does not verify whether the photo itself meets
            a particular passport, visa or government
            application's requirements.
          </div>
        </div>
      </section>
    </main>
  );
}