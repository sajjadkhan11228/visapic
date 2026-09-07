"use client";

import { useEffect, useRef, useState } from "react";

type PaperType = "A4" | "4x6";

const PHOTO_SIZES = [
  { name: "US Passport", width: 51, height: 51 },
  { name: "UK / Pakistan / India / Visa", width: 35, height: 45 },
  { name: "Canada Passport", width: 50, height: 70 },
];

const COPY_OPTIONS = [4, 6, 8, 10, 12];

export default function PhotoPrintSheetPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");
  const [paper, setPaper] = useState<PaperType>("A4");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [copies, setCopies] = useState(8);
  const [previewUrl, setPreviewUrl] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const selectedPhoto = PHOTO_SIZES[photoIndex];

  useEffect(() => {
    return () => {
      if (image) {
        URL.revokeObjectURL(image);
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [image, previewUrl]);

  const handleFile = (selectedFile: File) => {
    setError("");
    setPreviewUrl("");

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image.");
      return;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError("Maximum file size is 25 MB.");
      return;
    }

    if (image) {
      URL.revokeObjectURL(image);
    }

    const url = URL.createObjectURL(selectedFile);

    setImage(url);
    setFileName(selectedFile.name);
  };

  const handleInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const createSheet = async () => {
    if (!image) return;

    try {
      setWorking(true);
      setError("");

      const img = new Image();

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error("Image could not be loaded."));
        img.src = image;
      });

      /*
       * Print canvas uses 300 DPI.
       *
       * A4:
       * 8.27 × 11.69 inch
       *
       * 4x6:
       * 4 × 6 inch
       */

      const dpi = 300;

      let canvasWidth: number;
      let canvasHeight: number;

      if (paper === "A4") {
        canvasWidth = Math.round(8.27 * dpi);
        canvasHeight = Math.round(11.69 * dpi);
      } else {
        canvasWidth = 4 * dpi;
        canvasHeight = 6 * dpi;
      }

      const canvas = document.createElement("canvas");

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas is not supported.");
      }

      // White paper
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        0,
        0,
        canvasWidth,
        canvasHeight
      );

      // Convert mm to pixels
      const mmToPx = dpi / 25.4;

      const photoWidth =
        Math.round(selectedPhoto.width * mmToPx);

      const photoHeight =
        Math.round(selectedPhoto.height * mmToPx);

      const margin = Math.round(8 * mmToPx);
      const gap = Math.round(3 * mmToPx);

      const availableWidth =
        canvasWidth - margin * 2;

      const availableHeight =
        canvasHeight - margin * 2;

      const columns = Math.max(
        1,
        Math.floor(
          (availableWidth + gap) /
            (photoWidth + gap)
        )
      );

      const rows = Math.max(
        1,
        Math.floor(
          (availableHeight + gap) /
            (photoHeight + gap)
        )
      );

      const capacity = columns * rows;

      const actualCopies = Math.min(
        copies,
        capacity
      );

      if (actualCopies < copies) {
        setError(
          `This paper size can fit only ${capacity} photos at the selected size.`
        );
      }

      const usedWidth =
        columns * photoWidth +
        (columns - 1) * gap;

      const usedHeight =
        Math.ceil(actualCopies / columns) *
          photoHeight +
        (Math.ceil(actualCopies / columns) - 1) *
          gap;

      const startX =
        (canvasWidth - usedWidth) / 2;

      const startY =
        (canvasHeight - usedHeight) / 2;

      /*
       * Draw each passport photo.
       *
       * The image is fitted inside the selected
       * photo rectangle without distortion.
       */

      for (let i = 0; i < actualCopies; i++) {
        const column = i % columns;
        const row = Math.floor(i / columns);

        const x =
          startX +
          column * (photoWidth + gap);

        const y =
          startY +
          row * (photoHeight + gap);

        const sourceRatio =
          img.naturalWidth /
          img.naturalHeight;

        const targetRatio =
          photoWidth / photoHeight;

        let drawWidth: number;
        let drawHeight: number;

        if (sourceRatio > targetRatio) {
          drawHeight = photoHeight;
          drawWidth =
            drawHeight * sourceRatio;
        } else {
          drawWidth = photoWidth;
          drawHeight =
            drawWidth / sourceRatio;
        }

        const cropX =
          (drawWidth - photoWidth) / 2;

        const cropY =
          (drawHeight - photoHeight) / 2;

        ctx.save();

        ctx.beginPath();

        ctx.rect(
          x,
          y,
          photoWidth,
          photoHeight
        );

        ctx.clip();

        ctx.drawImage(
          img,
          x - cropX,
          y - cropY,
          drawWidth,
          drawHeight
        );

        ctx.restore();

        // Small cutting border
        ctx.strokeStyle = "#d1d5db";
        ctx.lineWidth = 1;

        ctx.strokeRect(
          x,
          y,
          photoWidth,
          photoHeight
        );
      }

      const blob = await new Promise<Blob | null>(
        (resolve) => {
          canvas.toBlob(
            (createdBlob) =>
              resolve(createdBlob),
            "image/jpeg",
            0.95
          );
        }
      );

      if (!blob) {
        throw new Error(
          "Could not create print sheet."
        );
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      const url = URL.createObjectURL(blob);

      setPreviewUrl(url);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to create the print sheet."
      );
    } finally {
      setWorking(false);
    }
  };

  const downloadSheet = () => {
    if (!previewUrl) return;

    const link =
      document.createElement("a");

    link.href = previewUrl;

    link.download =
      `visapic-${paper}-photo-sheet.jpg`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const reset = () => {
    if (image) {
      URL.revokeObjectURL(image);
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImage("");
    setPreviewUrl("");
    setFileName("");
    setError("");

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
              Passport Photo Print Sheet Maker
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Create a printable sheet with multiple
              passport or visa photos on A4 or 4×6 inch
              paper.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Preview Area */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {!image ? (
              <div
                onClick={() =>
                  inputRef.current?.click()
                }
                className="flex min-h-[430px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              >
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-100 text-4xl">
                  🖨️
                </div>

                <h2 className="text-2xl font-bold text-slate-900">
                  Upload Your Photo
                </h2>

                <p className="mt-3 max-w-md text-slate-500">
                  Upload one passport or visa photo and
                  create a complete printable sheet.
                </p>

                <button
                  type="button"
                  className="mt-7 rounded-xl bg-blue-600 px-7 py-3 font-bold text-white hover:bg-blue-700"
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
                  onChange={handleInput}
                  className="hidden"
                />
              </div>
            ) : (
              <div>
                <div className="rounded-2xl bg-slate-100 p-5">
                  <div className="flex min-h-[430px] items-center justify-center">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Printable photo sheet"
                        className="max-h-[600px] max-w-full rounded-lg object-contain shadow-lg"
                      />
                    ) : (
                      <img
                        src={image}
                        alt="Uploaded passport photo"
                        className="max-h-[430px] max-w-full rounded-xl object-contain shadow"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">
                    Selected photo
                  </p>

                  <p className="mt-1 truncate font-semibold text-slate-900">
                    {fileName}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={createSheet}
                    disabled={working}
                    className="flex-1 rounded-xl bg-blue-600 px-6 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {working
                      ? "Creating Sheet..."
                      : "Create Print Sheet"}
                  </button>

                  <button
                    type="button"
                    onClick={reset}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-4 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Change Photo
                  </button>
                </div>

                {previewUrl && (
                  <button
                    type="button"
                    onClick={downloadSheet}
                    className="mt-4 w-full rounded-xl bg-green-600 px-6 py-4 font-bold text-white transition hover:bg-green-700"
                  >
                    ⬇ Download Print Sheet
                  </button>
                )}
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 text-sm font-medium text-yellow-800">
                {error}
              </div>
            )}
          </div>

          {/* Settings */}

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">
              Print Settings
            </h2>

            {/* Paper */}

            <div className="mt-6">
              <label className="text-sm font-bold text-slate-700">
                Paper Size
              </label>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setPaper("A4")
                  }
                  className={`rounded-xl border px-4 py-4 text-sm font-bold transition ${
                    paper === "A4"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  A4
                  <span className="mt-1 block text-xs font-normal opacity-80">
                    210 × 297 mm
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPaper("4x6")
                  }
                  className={`rounded-xl border px-4 py-4 text-sm font-bold transition ${
                    paper === "4x6"
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-700 hover:border-blue-300"
                  }`}
                >
                  4 × 6
                  <span className="mt-1 block text-xs font-normal opacity-80">
                    Photo Paper
                  </span>
                </button>
              </div>
            </div>

            {/* Photo Size */}

            <div className="mt-6">
              <label className="text-sm font-bold text-slate-700">
                Photo Size
              </label>

              <div className="mt-3 space-y-2">
                {PHOTO_SIZES.map(
                  (photo, index) => (
                    <button
                      key={photo.name}
                      type="button"
                      onClick={() =>
                        setPhotoIndex(index)
                      }
                      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                        photoIndex === index
                          ? "border-blue-600 bg-blue-50"
                          : "border-slate-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="font-semibold text-slate-900">
                        {photo.name}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {photo.width} ×{" "}
                        {photo.height} mm
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Copies */}

            <div className="mt-6">
              <label className="text-sm font-bold text-slate-700">
                Number of Copies
              </label>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {COPY_OPTIONS.map(
                  (number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() =>
                        setCopies(number)
                      }
                      className={`rounded-xl border py-3 text-sm font-bold transition ${
                        copies === number
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 text-slate-700 hover:border-blue-300"
                      }`}
                    >
                      {number}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Info */}

            <div className="mt-6 rounded-2xl bg-blue-50 p-5">
              <h3 className="font-bold text-blue-900">
                🖨️ Print Tip
              </h3>

              <p className="mt-2 text-sm leading-6 text-blue-700">
                For the intended physical size, print
                the generated sheet at 100% / actual
                size and avoid “Fit to Page” scaling.
              </p>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <h3 className="font-bold text-slate-900">
                300 DPI Output
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                The print sheet is generated at a
                300 DPI-based canvas for high-quality
                printing.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* Information */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                A4 Passport Photo Sheet
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Arrange multiple copies of your photo on
                an A4-sized print sheet.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                4×6 Photo Sheet
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create a compact photo sheet suitable
                for standard 4×6 inch photo paper.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Multiple Copies
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Generate several copies of the same photo
                automatically instead of arranging them
                manually.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl bg-slate-50 p-6 text-sm leading-7 text-slate-500">
            <strong className="text-slate-700">
              Important:
            </strong>{" "}
            Photo dimensions and application requirements
            vary by country and application. Always verify
            the current official requirements before
            submitting your photo.
          </div>
        </div>
      </section>
    </main>
  );
}