"use client";

import { useState } from "react";

const presetSizes = [20, 50, 100, 200, 500];

export default function ImageSizeReducerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [targetKB, setTargetKB] = useState(100);
  const [customKB, setCustomKB] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const [quality, setQuality] = useState(90);
  const [maxWidth, setMaxWidth] = useState(2400);

  const [previewUrl, setPreviewUrl] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const [originalSize, setOriginalSize] = useState(0);
  const [compressedSize, setCompressedSize] =
    useState(0);

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedTargetKB = useCustom
    ? Number(customKB) || 100
    : targetKB;

  const handleFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );
      return;
    }

    setError("");
    setMessage("");

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (downloadUrl) {
      URL.revokeObjectURL(downloadUrl);
    }

    setFile(selectedFile);
    setOriginalSize(selectedFile.size);
    setCompressedSize(0);

    setPreviewUrl(
      URL.createObjectURL(selectedFile)
    );

    setDownloadUrl("");
  };

  const formatBytes = (bytes: number) => {
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

  const createBlob = (
    image: HTMLImageElement,
    width: number,
    height: number,
    imageQuality: number
  ): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas =
        document.createElement("canvas");

      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.fillStyle = "#ffffff";

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        resolve,
        "image/jpeg",
        imageQuality
      );
    });
  };

  const compressImage = async () => {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }

    if (
      selectedTargetKB < 5 ||
      selectedTargetKB > 5000
    ) {
      setError(
        "Target size must be between 5KB and 5000KB."
      );
      return;
    }

    setProcessing(true);
    setError("");
    setMessage("");

    try {
      const sourceUrl =
        URL.createObjectURL(file);

      const image = new Image();

      await new Promise<void>(
        (resolve, reject) => {
          image.onload = () => resolve();

          image.onerror = () =>
            reject(
              new Error(
                "Unable to load image."
              )
            );

          image.src = sourceUrl;
        }
      );

      const targetBytes =
        selectedTargetKB * 1024;

      let width = image.naturalWidth;
      let height = image.naturalHeight;

      const scale = Math.min(
        1,
        maxWidth / width
      );

      width *= scale;
      height *= scale;

      let bestBlob: Blob | null = null;

      /*
       * First try the requested dimensions.
       * Then reduce quality until the target
       * size is reached.
       */
      for (
        let dimensionPass = 0;
        dimensionPass < 8;
        dimensionPass++
      ) {
        let low = 0.05;
        let high = 0.98;
        let passBest: Blob | null = null;

        for (
          let i = 0;
          i < 9;
          i++
        ) {
          const mid =
            (low + high) / 2;

          const blob =
            await createBlob(
              image,
              width,
              height,
              mid
            );

          if (!blob) continue;

          if (blob.size <= targetBytes) {
            passBest = blob;
            low = mid;
          } else {
            high = mid;
          }
        }

        if (passBest) {
          bestBlob = passBest;
          break;
        }

        /*
         * If quality alone cannot reach the target,
         * reduce dimensions by 15%.
         */
        width *= 0.85;
        height *= 0.85;
      }

      URL.revokeObjectURL(sourceUrl);

      if (!bestBlob) {
        throw new Error(
          "Could not reduce the image to the requested size."
        );
      }

      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }

      const outputUrl =
        URL.createObjectURL(bestBlob);

      setDownloadUrl(outputUrl);
      setCompressedSize(bestBlob.size);

      const actualKB =
        bestBlob.size / 1024;

      if (bestBlob.size <= targetBytes) {
        setMessage(
          `Done! Image reduced to ${actualKB.toFixed(
            1
          )} KB.`
        );
      } else {
        setMessage(
          `Image compressed to ${actualKB.toFixed(
            1
          )} KB.`
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while compressing the image."
      );
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!downloadUrl) return;

    const link =
      document.createElement("a");

    link.href = downloadUrl;

    const originalName =
      file?.name.replace(
        /\.[^/.]+$/,
        ""
      ) || "image";

    link.download =
      `${originalName}-${selectedTargetKB}kb.jpg`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const savings =
    originalSize > 0 &&
    compressedSize > 0
      ? Math.max(
          0,
          ((originalSize -
            compressedSize) /
            originalSize) *
            100
        )
      : 0;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Free Online Image Tool
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Reduce Image Size to KB
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Compress an image to a smaller file
              size such as 20KB, 50KB, 100KB,
              200KB or 500KB. Your image is
              processed directly in your browser.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {!file ? (
              <label className="flex min-h-[440px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <div className="text-6xl">
                  📉
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  Upload an image
                </h2>

                <p className="mt-2 max-w-md text-slate-500">
                  Choose the image you want to
                  reduce in file size.
                </p>

                <span className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
                  Choose Image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFile}
                />
              </label>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Your Image
                    </h2>

                    <p className="mt-1 max-w-md truncate text-sm text-slate-500">
                      {file.name}
                    </p>
                  </div>

                  <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Change Image

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFile}
                    />
                  </label>
                </div>

                <div className="flex min-h-[460px] items-center justify-center rounded-2xl bg-slate-900 p-5">
                  <img
                    src={previewUrl}
                    alt="Uploaded image"
                    className="max-h-[430px] max-w-full rounded-lg object-contain"
                  />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Original
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {formatBytes(originalSize)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
                      Target
                    </p>

                    <p className="mt-1 text-lg font-bold text-blue-900">
                      {selectedTargetKB} KB
                    </p>
                  </div>

                  <div className="rounded-2xl bg-green-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-green-500">
                      Reduced
                    </p>

                    <p className="mt-1 text-lg font-bold text-green-900">
                      {compressedSize
                        ? formatBytes(
                            compressedSize
                          )
                        : "—"}
                    </p>
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                {message}
              </div>
            )}
          </div>

          {/* SETTINGS */}

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Target File Size
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select the maximum size you need.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {presetSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setUseCustom(false);
                      setTargetKB(size);
                    }}
                    className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      !useCustom &&
                      targetKB === size
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    {size} KB
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setUseCustom(true)
                }
                className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm font-bold ${
                  useCustom
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                Custom Size
              </button>

              {useCustom && (
                <div className="mt-4">
                  <label className="text-sm font-semibold text-slate-700">
                    Target KB
                  </label>

                  <input
                    type="number"
                    min="5"
                    max="5000"
                    value={customKB}
                    onChange={(e) =>
                      setCustomKB(
                        e.target.value
                      )
                    }
                    placeholder="e.g. 75"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                  />

                  <p className="mt-1 text-xs text-slate-400">
                    Enter between 5 KB and 5000 KB.
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Compression Settings
              </h2>

              <div className="mt-5">
                <div className="flex justify-between">
                  <label className="text-sm font-semibold text-slate-700">
                    Starting Quality
                  </label>

                  <span className="font-bold text-blue-600">
                    {quality}%
                  </span>
                </div>

                <input
                  type="range"
                  min="40"
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

              <div className="mt-6">
                <label className="text-sm font-semibold text-slate-700">
                  Maximum Width
                </label>

                <select
                  value={maxWidth}
                  onChange={(e) =>
                    setMaxWidth(
                      Number(e.target.value)
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value={1200}>
                    1200 px
                  </option>

                  <option value={1600}>
                    1600 px
                  </option>

                  <option value={2000}>
                    2000 px
                  </option>

                  <option value={2400}>
                    2400 px
                  </option>

                  <option value={3000}>
                    3000 px
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={compressImage}
                disabled={!file || processing}
                className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing
                  ? "Compressing..."
                  : `Reduce to ${selectedTargetKB} KB`}
              </button>

              {downloadUrl && (
                <button
                  type="button"
                  onClick={downloadImage}
                  className="mt-3 w-full rounded-xl bg-green-600 px-5 py-3.5 font-bold text-white hover:bg-green-700"
                >
                  Download Compressed Image
                </button>
              )}
            </div>

            {compressedSize > 0 && (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
                <h2 className="text-lg font-bold text-green-900">
                  Compression Complete
                </h2>

                <div className="mt-4 space-y-2 text-sm text-green-800">
                  <div className="flex justify-between">
                    <span>Original</span>
                    <strong>
                      {formatBytes(
                        originalSize
                      )}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span>New Size</span>
                    <strong>
                      {formatBytes(
                        compressedSize
                      )}
                    </strong>
                  </div>

                  <div className="flex justify-between">
                    <span>Saved</span>
                    <strong>
                      {savings.toFixed(1)}%
                    </strong>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
              <h2 className="font-bold text-blue-900">
                🔒 Private Processing
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-700">
                Your image is processed locally in
                your browser. The original photo does
                not need to be uploaded to our server.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* SEO CONTENT */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900">
            Reduce Image Size to 20KB, 50KB, 100KB
            or 200KB
          </h2>

          <div className="mt-6 space-y-5 text-slate-600">
            <p>
              Many online forms and applications
              require images to stay below a specific
              file-size limit. VisaPic helps reduce an
              image to a selected target size directly
              in your browser.
            </p>

            <p>
              Choose a preset such as 20KB, 50KB,
              100KB, 200KB or 500KB. You can also
              enter a custom target between 5KB and
              5000KB.
            </p>

            <p>
              The tool automatically adjusts image
              quality and, when necessary, dimensions
              to produce a much smaller JPEG file.
            </p>

            <p>
              Always check the upload requirements of
              the website or application you are using.
              A smaller file may also have lower visual
              quality.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900">
            How to Reduce Image Size
          </h2>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-2xl font-black text-blue-600">
                01
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                Upload
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select the image you want to compress.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-2xl font-black text-blue-600">
                02
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                Choose Size
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select a target such as 50KB or
                100KB, or enter your own size.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-2xl font-black text-blue-600">
                03
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                Download
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Download your compressed image
                after processing finishes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900">
            Frequently Asked Questions
          </h2>

          <div className="mt-8 space-y-4">
            <details className="rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Can I reduce an image to 20KB?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes. Select the 20KB preset and the
                tool will attempt to create a JPEG
                file within that target.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Can I reduce an image to 100KB?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes. Select 100KB from the target
                size options.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Does reducing the file size reduce quality?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Usually, yes. Smaller JPEG files
                generally require stronger compression
                and may have lower visual quality.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Are my photos uploaded?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                No server upload is required for the
                compression process. The image is
                processed locally in your browser.
              </p>
            </details>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-slate-500">
          VisaPic — Free online photo tools.
        </div>
      </footer>
    </main>
  );
}