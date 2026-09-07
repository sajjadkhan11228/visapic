"use client";

import { useEffect, useState } from "react";

type ConvertedFile = {
  name: string;
  url: string;
  size: number;
};

export default function JpgToPngPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [converted, setConverted] = useState<ConvertedFile[]>([]);
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
    const selectedFiles = Array.from(
      event.target.files || []
    );

    const validFiles = selectedFiles.filter((file) =>
      [
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/bmp",
      ].includes(file.type)
    );

    if (!validFiles.length) {
      setError(
        "Please select JPG, JPEG, WebP or BMP images."
      );
      return;
    }

    setError("");
    setFiles(validFiles);
    setConverted([]);
  };

  const convertImages = async () => {
    if (!files.length) return;

    setConverting(true);
    setError("");

    const results: ConvertedFile[] = [];

    try {
      for (const file of files) {
        const url = URL.createObjectURL(file);

        const image = new Image();

        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve();
          image.onerror = () =>
            reject(
              new Error(
                `Could not load ${file.name}`
              )
            );

          image.src = url;
        });

        const canvas =
          document.createElement("canvas");

        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        const ctx = canvas.getContext("2d");

        if (!ctx) {
          URL.revokeObjectURL(url);
          throw new Error(
            "Your browser does not support canvas."
          );
        }

        ctx.drawImage(
          image,
          0,
          0,
          image.naturalWidth,
          image.naturalHeight
        );

        const pngBlob = await new Promise<Blob | null>(
          (resolve) =>
            canvas.toBlob(
              resolve,
              "image/png"
            )
        );

        URL.revokeObjectURL(url);

        if (!pngBlob) {
          throw new Error(
            `Could not convert ${file.name}`
          );
        }

        const pngUrl =
          URL.createObjectURL(pngBlob);

        const outputName =
          file.name.replace(
            /\.(jpg|jpeg|webp|bmp)$/i,
            ""
          ) + ".png";

        results.push({
          name: outputName,
          url: pngUrl,
          size: pngBlob.size,
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

  const downloadAll = async () => {
    if (!converted.length) return;

    if (converted.length === 1) {
      const link =
        document.createElement("a");

      link.href = converted[0].url;
      link.download = converted[0].name;

      document.body.appendChild(link);
      link.click();
      link.remove();

      return;
    }

    for (const file of converted) {
      const link =
        document.createElement("a");

      link.href = file.url;
      link.download = file.name;

      document.body.appendChild(link);
      link.click();
      link.remove();

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
      return `${(bytes / 1024).toFixed(1)} KB`;
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
              JPG to PNG Converter
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Convert JPG, JPEG, WebP and BMP images
              to PNG format online for free.
              Fast, simple and processed directly
              in your browser.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT */}

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
                  Select one or multiple JPG,
                  JPEG, WebP or BMP images.
                </p>

                <span className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
                  Choose Images
                </span>

                <input
                  type="file"
                  accept=".jpg,.jpeg,.webp,.bmp,image/jpeg,image/webp,image/bmp"
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
                      accept=".jpg,.jpeg,.webp,.bmp,image/jpeg,image/webp,image/bmp"
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
                      : "Convert to PNG"}
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

          {/* RIGHT */}

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                JPG to PNG
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">
                    Input
                  </span>

                  <strong className="text-slate-900">
                    JPG / JPEG
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">
                    Output
                  </span>

                  <strong className="text-slate-900">
                    PNG
                  </strong>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="text-sm text-slate-500">
                    Processing
                  </span>

                  <strong className="text-green-600">
                    Browser
                  </strong>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
              <h2 className="font-bold text-green-900">
                🔒 Private by Design
              </h2>

              <p className="mt-2 text-sm leading-6 text-green-700">
                Your image is converted directly
                in your browser. There is no need
                to upload your original photo to
                our server.
              </p>
            </div>

            {converted.length > 0 && (
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6">
                <h2 className="text-lg font-bold text-blue-900">
                  Conversion Complete
                </h2>

                <p className="mt-1 text-sm text-blue-700">
                  {converted.length} PNG file
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
                  Download PNG
                  {converted.length > 1
                    ? " Files"
                    : ""}
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
                  Converted PNG Files
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your converted images are ready.
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
                      Download PNG
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SEO CONTENT */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900">
            Convert JPG to PNG Online
          </h2>

          <div className="mt-6 space-y-5 text-slate-600">
            <p>
              Convert JPG and JPEG images to PNG
              format quickly with VisaPic's free
              online JPG to PNG converter.
            </p>

            <p>
              PNG is useful when you need lossless
              image output or want to preserve
              transparent areas in an image workflow.
            </p>

            <p>
              You can convert multiple supported
              images in one session. The conversion
              happens directly inside your browser.
            </p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900">
            How to Convert JPG to PNG
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
                Select your JPG, JPEG or other
                supported image.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-2xl font-black text-blue-600">
                02
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                Convert
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Click the conversion button and
                let your browser create the PNG.
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
                Download the converted PNG file
                instantly.
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
                Is the JPG to PNG converter free?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes. You can use the converter without
                installing additional software.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Are my images uploaded to a server?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The conversion is performed directly
                in your browser, so the tool does not
                need to upload your original image to
                a server.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Can I convert multiple images?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes. You can select multiple supported
                images and convert them in one session.
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