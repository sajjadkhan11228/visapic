"use client";

import { useEffect, useState } from "react";

type ConvertedFile = {
  name: string;
  url: string;
  size: number;
};

export default function ImageToJpgPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [converted, setConverted] = useState<ConvertedFile[]>([]);
  const [quality, setQuality] = useState(92);
  const [background, setBackground] = useState("#ffffff");
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      converted.forEach((file) => {
        URL.revokeObjectURL(file.url);
      });
    };
  }, [converted]);

  const handleFiles = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = Array.from(
      event.target.files || []
    );

    const valid = selected.filter((file) =>
      file.type.startsWith("image/")
    );

    if (!valid.length) {
      setError("Please select valid image files.");
      return;
    }

    setError("");
    setFiles(valid);
    setConverted([]);
  };

  const convertImages = async () => {
    if (!files.length) return;

    setConverting(true);
    setError("");

    const results: ConvertedFile[] = [];

    try {
      for (const file of files) {
        const sourceUrl =
          URL.createObjectURL(file);

        const image = new Image();

        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();

          image.onerror = () =>
            reject(
              new Error(
                `Unable to load ${file.name}`
              )
            );

          image.src = sourceUrl;
        });

        const canvas =
          document.createElement("canvas");

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(sourceUrl);

          throw new Error(
            "Canvas is not supported by your browser."
          );
        }

        /*
         * JPG does not support transparency.
         * Fill transparent areas with the selected
         * background before drawing the image.
         */
        ctx.fillStyle = background;

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

        const blob =
          await new Promise<Blob | null>(
            (resolve) =>
              canvas.toBlob(
                resolve,
                "image/jpeg",
                quality / 100
              )
          );

        URL.revokeObjectURL(sourceUrl);

        if (!blob) {
          throw new Error(
            `Could not convert ${file.name}`
          );
        }

        const baseName =
          file.name.replace(
            /\.[^/.]+$/,
            ""
          );

        const outputName =
          `${baseName}.jpg`;

        results.push({
          name: outputName,
          url: URL.createObjectURL(blob),
          size: blob.size,
        });
      }

      setConverted(results);
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while converting the images."
      );
    } finally {
      setConverting(false);
    }
  };

  const downloadFile = (
    file: ConvertedFile
  ) => {
    const link =
      document.createElement("a");

    link.href = file.url;
    link.download = file.name;

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadAll = async () => {
    for (const file of converted) {
      downloadFile(file);

      await new Promise((resolve) =>
        setTimeout(resolve, 150)
      );
    }
  };

  const clearAll = () => {
    converted.forEach((file) => {
      URL.revokeObjectURL(file.url);
    });

    setFiles([]);
    setConverted([]);
    setError("");
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

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HERO */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Free Online Image Converter
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Image to JPG Converter
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Convert PNG, WebP, BMP and other
              image formats to JPG online for free.
              Choose your JPG quality and background
              color, then download your converted image.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* UPLOAD / FILES */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {files.length === 0 ? (
              <label className="flex min-h-[430px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <div className="text-6xl">
                  🖼️
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  Upload your images
                </h2>

                <p className="mt-2 max-w-md text-slate-500">
                  Select one or multiple image files
                  to convert them to JPG.
                </p>

                <span className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
                  Choose Images
                </span>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFiles}
                />
              </label>
            ) : (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Selected Images
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {files.length} image
                      {files.length > 1
                        ? "s"
                        : ""}{" "}
                      selected
                    </p>
                  </div>

                  <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Add More

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleFiles}
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {files.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                          📷
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {file.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatBytes(file.size)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={convertImages}
                    disabled={converting}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {converting
                      ? "Converting..."
                      : "Convert to JPG"}
                  </button>

                  <button
                    type="button"
                    onClick={clearAll}
                    disabled={converting}
                    className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </div>
              </>
            )}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* SETTINGS */}

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                JPG Settings
              </h2>

              {/* QUALITY */}

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
                  min="10"
                  max="100"
                  value={quality}
                  onChange={(e) =>
                    setQuality(
                      Number(e.target.value)
                    )
                  }
                  className="mt-4 w-full"
                />

                <div className="mt-2 flex justify-between text-xs text-slate-400">
                  <span>Smaller file</span>
                  <span>Higher quality</span>
                </div>
              </div>

              {/* BACKGROUND */}

              <div className="mt-7">
                <label className="text-sm font-semibold text-slate-700">
                  Background for Transparency
                </label>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  JPG cannot store transparency.
                  Transparent areas will use this color.
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  {[
                    {
                      name: "White",
                      value: "#ffffff",
                    },
                    {
                      name: "Black",
                      value: "#000000",
                    },
                    {
                      name: "Gray",
                      value: "#e5e7eb",
                    },
                    {
                      name: "Blue",
                      value: "#dbeafe",
                    },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() =>
                        setBackground(
                          item.value
                        )
                      }
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                        background === item.value
                          ? "border-blue-600 ring-2 ring-blue-100"
                          : "border-slate-200"
                      }`}
                    >
                      <span
                        className="h-5 w-5 rounded-full border border-slate-300"
                        style={{
                          backgroundColor:
                            item.value,
                        }}
                      />

                      {item.name}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    Custom
                  </span>

                  <input
                    type="color"
                    value={background}
                    onChange={(e) =>
                      setBackground(
                        e.target.value
                      )
                    }
                    className="h-9 w-12 cursor-pointer rounded border border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
              <h2 className="font-bold text-green-900">
                🔒 Browser Processing
              </h2>

              <p className="mt-2 text-sm leading-6 text-green-700">
                Images are converted directly in your
                browser. Your original photos do not
                need to be uploaded to a server.
              </p>
            </div>

            {converted.length > 0 && (
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
                <h2 className="text-lg font-bold text-blue-900">
                  Conversion Complete
                </h2>

                <p className="mt-1 text-sm text-blue-700">
                  {converted.length} JPG file
                  {converted.length > 1
                    ? "s are"
                    : " is"}{" "}
                  ready.
                </p>

                <button
                  type="button"
                  onClick={downloadAll}
                  className="mt-5 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                  Download{" "}
                  {converted.length > 1
                    ? "All JPGs"
                    : "JPG"}
                </button>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* RESULTS */}

      {converted.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-10">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Converted JPG Images
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your JPG files are ready to download.
                </p>
              </div>

              <button
                type="button"
                onClick={downloadAll}
                className="rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700"
              >
                Download All
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {converted.map((file) => (
                <div
                  key={file.url}
                  className="overflow-hidden rounded-2xl border border-slate-200"
                >
                  <div className="flex h-56 items-center justify-center bg-slate-100 p-4">
                    <img
                      src={file.url}
                      alt={file.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  <div className="p-4">
                    <p className="truncate font-semibold text-slate-900">
                      {file.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {formatBytes(file.size)}
                    </p>

                    <a
                      href={file.url}
                      download={file.name}
                      className="mt-4 block rounded-xl bg-slate-900 px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-slate-800"
                    >
                      Download JPG
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEO */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900">
            Convert Images to JPG Online
          </h2>

          <div className="mt-6 space-y-5 text-slate-600">
            <p>
              Convert PNG, WebP, BMP and other image
              formats to JPG with VisaPic's free
              online image converter.
            </p>

            <p>
              JPG is widely supported and can provide
              smaller file sizes than many lossless
              image formats. Use the quality control to
              balance image quality and file size.
            </p>

            <p>
              If your source image contains transparent
              areas, choose a background color before
              conversion.
            </p>

            <p>
              All conversion is performed locally in
              your browser, making the tool convenient
              for photos and documents that you do not
              want to upload.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900">
            How to Convert an Image to JPG
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
                Select one or more image files.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-2xl font-black text-blue-600">
                02
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                Customize
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Select JPG quality and a background
                color if your image contains transparency.
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
                Convert the image and download your
                JPG file.
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
                Can I convert PNG to JPG?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes. PNG images can be converted to
                JPG directly in the browser.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Can I control JPG quality?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes. Use the quality slider to choose
                between smaller file size and higher
                image quality.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                What happens to transparent backgrounds?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                JPG does not support transparency, so
                transparent areas are filled with the
                background color you select.
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