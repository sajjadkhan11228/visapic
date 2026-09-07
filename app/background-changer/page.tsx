"use client";

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type BackgroundOption = {
  name: string;
  value: string;
};

const backgrounds: BackgroundOption[] = [
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
    name: "Blue",
    value: "#dbeafe",
  },
  {
    name: "Light Blue",
    value: "#e0f2fe",
  },
  {
    name: "Black",
    value: "#000000",
  },
];

export default function BackgroundChangerPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const [selectedBackground, setSelectedBackground] =
    useState("#ffffff");

  const [fileName, setFileName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(
    null
  );

  useEffect(() => {
    return () => {
      // Nothing to revoke because we use data URLs.
    };
  }, []);

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
      setError("Unable to read the selected image.");
    };

    reader.readAsDataURL(file);
  };

  const createBackground = async () => {
    if (!image) {
      setError("Please upload a photo first.");
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
            new Error("Image could not be loaded.")
          );

        img.src = image;
      });

      const canvas =
        canvasRef.current ||
        document.createElement("canvas");

      canvasRef.current = canvas;

      /*
       * Keep the original image dimensions.
       */
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Canvas is not supported by this browser."
        );
      }

      /*
       * Current version:
       * background color is placed behind the image.
       *
       * For transparent PNG/WebP images this will appear
       * as the selected background.
       */
      ctx.fillStyle = selectedBackground;

      ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
      );

      /*
       * Draw the original image over the background.
       *
       * If the source image contains transparency,
       * the selected background will show through.
       */
      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const output =
        canvas.toDataURL(
          "image/jpeg",
          0.92
        );

      setResult(output);
    } catch (err) {
      console.error(
        "Background processing error:",
        err
      );

      setError(
        "Could not process this photo. Please try another image."
      );
    } finally {
      setProcessing(false);
    }
  };

  const downloadImage = () => {
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
      `${cleanName || "photo"}-background.jpg`;

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
              Passport Photo Background Changer
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Change the background of your passport,
              visa or ID photo to a clean standard color
              directly in your browser.
            </p>
          </div>
        </div>
      </section>

      {/* TOOL */}

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
          {/* CONTROLS */}

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Choose Background
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select the background color you want to use.
            </p>

            {/* BACKGROUND OPTIONS */}

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {backgrounds.map((option) => {
                const selected =
                  selectedBackground ===
                  option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setSelectedBackground(
                        option.value
                      )
                    }
                    className={`rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <div
                      className="h-14 rounded-xl border border-slate-300"
                      style={{
                        backgroundColor:
                          option.value,
                      }}
                    />

                    <div className="mt-3 text-sm font-bold text-slate-900">
                      {option.name}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {option.value}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* UPLOAD */}

            <div className="mt-8">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <div className="text-5xl">
                  📷
                </div>

                <div className="mt-4 text-lg font-bold text-slate-900">
                  Upload Your Photo
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
            </div>

            {/* FILE */}

            {fileName && (
              <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                ✓ {fileName}
              </div>
            )}

            {/* SELECTED COLOR */}

            <div className="mt-6 rounded-2xl bg-slate-50 p-5">
              <div className="text-sm font-semibold text-slate-600">
                Selected Background
              </div>

              <div className="mt-3 flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-full border border-slate-300"
                  style={{
                    backgroundColor:
                      selectedBackground,
                  }}
                />

                <div>
                  <div className="font-bold text-slate-900">
                    {
                      backgrounds.find(
                        (item) =>
                          item.value ===
                          selectedBackground
                      )?.name
                    }
                  </div>

                  <div className="text-xs text-slate-500">
                    {selectedBackground}
                  </div>
                </div>
              </div>
            </div>

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {/* PROCESS */}

            <button
              type="button"
              onClick={createBackground}
              disabled={
                processing || !image
              }
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing
                ? "Processing Photo..."
                : "Change Background"}
            </button>

            <div className="mt-4 rounded-xl bg-yellow-50 px-4 py-3 text-xs leading-5 text-yellow-800">
              <strong>Important:</strong> A simple
              background color cannot automatically remove
              a person from an existing background. For
              true subject/background replacement, use the
              AI Background Removal feature in VisaPic.
            </div>
          </div>

          {/* PREVIEW */}

          <div className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-xl font-bold text-slate-900">
              Preview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Preview your selected background and result.
            </p>

            <div
              className="mt-6 flex min-h-[430px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 p-6"
              style={{
                backgroundColor:
                  selectedBackground,
              }}
            >
              {result ? (
                <img
                  src={result}
                  alt="Passport photo with selected background"
                  className="max-h-[390px] max-w-full object-contain shadow-lg"
                />
              ) : image ? (
                <img
                  src={image}
                  alt="Uploaded photo preview"
                  className="max-h-[390px] max-w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="text-5xl">
                    🖼️
                  </div>

                  <p className="mt-3 text-sm text-slate-500">
                    Upload a photo to preview it here.
                  </p>
                </div>
              )}
            </div>

            {result && (
              <button
                type="button"
                onClick={downloadImage}
                className="mt-5 w-full rounded-xl bg-green-600 px-5 py-4 font-bold text-white transition hover:bg-green-700"
              >
                Download JPG
              </button>
            )}

            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>
        </div>
      </section>

      {/* INFORMATION */}

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                White Background
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                White is commonly requested for many
                passport, visa and ID photo applications.
                Always check your specific application.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Browser Processing
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                The photo is processed directly in your
                browser instead of requiring a server upload.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Easy Download
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                After processing, download the result as a
                JPG image with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}

      <section className="bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="text-3xl font-bold text-slate-900">
            Background Changer FAQ
          </h2>

          <div className="mt-8 space-y-4">
            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Can I make my passport photo background
                white?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Yes, you can select White or Off White and
                generate a JPG. However, simply placing a
                color behind an existing opaque photograph
                does not remove the original background.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Does this remove the original background?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                This basic tool is designed for transparent
                images or background workflows where the
                subject has already been isolated. For
                automatic subject extraction, use the AI
                Background Removal tool.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Is the photo uploaded to a server?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                This conversion runs in your browser, so the
                image does not need to be uploaded to a
                server for this operation.
              </p>
            </details>

            <details className="rounded-2xl border border-slate-200 bg-white p-5">
              <summary className="cursor-pointer font-bold text-slate-900">
                Is the resulting photo officially compliant?
              </summary>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Background color is only one part of a
                passport or visa photo requirement. Check
                the official requirements for your specific
                application before submitting the image.
              </p>
            </details>
          </div>
        </div>
      </section>
    </main>
  );
}