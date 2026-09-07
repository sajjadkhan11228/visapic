"use client";

import { useEffect, useRef, useState } from "react";

type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RatioPreset = {
  name: string;
  value: number | null;
};

const presets: RatioPreset[] = [
  { name: "Free", value: null },
  { name: "1:1 Square", value: 1 },
  { name: "3:4", value: 3 / 4 },
  { name: "4:5", value: 4 / 5 },
  { name: "2:3", value: 2 / 3 },
  { name: "35:45", value: 35 / 45 },
];

export default function ImageCropperPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");

  const [selectedRatio, setSelectedRatio] =
    useState<number | null>(null);

  const [crop, setCrop] = useState<CropArea | null>(null);

  const [rotation, setRotation] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);

  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");

  const displayWidth = 700;
  const displayHeight = 500;

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [preview, downloadUrl]);

  const loadImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError("");

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      setImage(img);
      setPreview(url);
      setFileName(
        file.name.replace(/\.[^/.]+$/, "")
      );

      setRotation(0);
      setFlipX(false);
      setFlipY(false);
      setDownloadUrl("");

      const width = img.naturalWidth;
      const height = img.naturalHeight;

      const initialCrop = createInitialCrop(
        width,
        height,
        selectedRatio
      );

      setCrop(initialCrop);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Unable to load this image.");
    };

    img.src = url;
  };

  const createInitialCrop = (
    width: number,
    height: number,
    ratio: number | null
  ): CropArea => {
    if (!ratio) {
      return {
        x: 0,
        y: 0,
        width,
        height,
      };
    }

    let cropWidth = width;
    let cropHeight = width / ratio;

    if (cropHeight > height) {
      cropHeight = height;
      cropWidth = height * ratio;
    }

    return {
      x: (width - cropWidth) / 2,
      y: (height - cropHeight) / 2,
      width: cropWidth,
      height: cropHeight,
    };
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (file) {
      loadImage(file);
    }
  };

  const changeRatio = (ratio: number | null) => {
    setSelectedRatio(ratio);

    if (!image) return;

    setCrop(
      createInitialCrop(
        image.naturalWidth,
        image.naturalHeight,
        ratio
      )
    );
  };

  const getCanvasCoordinates = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;

    if (!canvas || !image) {
      return { x: 0, y: 0 };
    }

    const rect = canvas.getBoundingClientRect();

    const scaleX =
      image.naturalWidth / rect.width;

    const scaleY =
      image.naturalHeight / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const startCrop = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!image || !crop) return;

    const point = getCanvasCoordinates(event);

    setDragging(true);

    setDragStart(point);
  };

  const moveCrop = (
    event: React.MouseEvent<HTMLCanvasElement>
  ) => {
    if (!dragging || !image || !crop) return;

    const point = getCanvasCoordinates(event);

    const startX = Math.max(
      0,
      Math.min(
        dragStart.x,
        image.naturalWidth
      )
    );

    const startY = Math.max(
      0,
      Math.min(
        dragStart.y,
        image.naturalHeight
      )
    );

    let width = Math.abs(
      point.x - dragStart.x
    );

    let height = Math.abs(
      point.y - dragStart.y
    );

    if (selectedRatio) {
      if (width / selectedRatio <= image.naturalHeight) {
        height = width / selectedRatio;
      } else {
        height = Math.min(
          height,
          image.naturalHeight
        );

        width = height * selectedRatio;
      }
    }

    const x =
      point.x < dragStart.x
        ? dragStart.x - width
        : dragStart.x;

    const y =
      point.y < dragStart.y
        ? dragStart.y - height
        : dragStart.y;

    const finalWidth = Math.min(
      width,
      image.naturalWidth - x
    );

    const finalHeight = Math.min(
      height,
      image.naturalHeight - y
    );

    if (
      finalWidth > 10 &&
      finalHeight > 10
    ) {
      setCrop({
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: finalWidth,
        height: finalHeight,
      });
    }
  };

  const endCrop = () => {
    setDragging(false);
  };

  const resetCrop = () => {
    if (!image) return;

    setCrop(
      createInitialCrop(
        image.naturalWidth,
        image.naturalHeight,
        selectedRatio
      )
    );

    setRotation(0);
    setFlipX(false);
    setFlipY(false);
    setDownloadUrl("");
  };

  const rotateLeft = () => {
    setRotation((value) => value - 90);
    setDownloadUrl("");
  };

  const rotateRight = () => {
    setRotation((value) => value + 90);
    setDownloadUrl("");
  };

  const cropImage = () => {
    if (!image || !crop) return;

    try {
      setError("");

      const outputWidth = Math.round(
        crop.width
      );

      const outputHeight = Math.round(
        crop.height
      );

      const canvas =
        document.createElement("canvas");

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error(
          "Canvas is not supported."
        );
      }

      ctx.save();

      ctx.translate(
        outputWidth / 2,
        outputHeight / 2
      );

      const normalizedRotation =
        ((rotation % 360) + 360) % 360;

      if (
        normalizedRotation === 90 ||
        normalizedRotation === 270
      ) {
        // Keep the cropped output stable.
      }

      ctx.scale(
        flipX ? -1 : 1,
        flipY ? -1 : 1
      );

      ctx.rotate(
        (rotation * Math.PI) / 180
      );

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        -outputWidth / 2,
        -outputHeight / 2,
        outputWidth,
        outputHeight
      );

      ctx.restore();

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setError(
              "Could not create cropped image."
            );
            return;
          }

          if (downloadUrl) {
            URL.revokeObjectURL(downloadUrl);
          }

          const url =
            URL.createObjectURL(blob);

          setDownloadUrl(url);
        },
        "image/jpeg",
        0.95
      );
    } catch (err) {
      console.error(err);

      setError(
        "Something went wrong while cropping."
      );
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    const scale = Math.min(
      displayWidth / image.naturalWidth,
      displayHeight / image.naturalHeight
    );

    const width =
      image.naturalWidth * scale;

    const height =
      image.naturalHeight * scale;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.save();

    ctx.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    if (crop) {
      ctx.fillStyle =
        "rgba(0, 0, 0, 0.55)";

      ctx.fillRect(
        0,
        0,
        width,
        height
      );

      ctx.clearRect(
        crop.x * scale,
        crop.y * scale,
        crop.width * scale,
        crop.height * scale
      );

      ctx.strokeStyle =
        "#ffffff";

      ctx.lineWidth = 3;

      ctx.strokeRect(
        crop.x * scale,
        crop.y * scale,
        crop.width * scale,
        crop.height * scale
      );

      ctx.strokeStyle =
        "rgba(255,255,255,0.5)";

      ctx.lineWidth = 1;

      const left =
        crop.x * scale;

      const top =
        crop.y * scale;

      const cropW =
        crop.width * scale;

      const cropH =
        crop.height * scale;

      for (let i = 1; i < 3; i++) {
        const x =
          left + (cropW / 3) * i;

        const y =
          top + (cropH / 3) * i;

        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, top + cropH);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(left + cropW, y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [
    image,
    crop,
    rotation,
    flipX,
    flipY,
  ]);

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Free Online Image Tool
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
              Crop Image Online
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-600">
              Crop your image online for free.
              Choose a custom crop area or use
              popular aspect ratios for photos,
              passports, visas and social media.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            {!image ? (
              <label className="flex min-h-[420px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition hover:border-blue-400 hover:bg-blue-50">
                <div className="text-5xl">
                  ✂️
                </div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900">
                  Upload an image
                </h2>

                <p className="mt-2 max-w-md text-slate-500">
                  JPG, PNG and other common
                  image formats are supported.
                </p>

                <span className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
                  Choose Image
                </span>

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      Crop Your Image
                    </h2>

                    <p className="text-sm text-slate-500">
                      Drag across the image to
                      create a crop area.
                    </p>
                  </div>

                  <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Change Image

                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>

                <div className="overflow-auto rounded-2xl bg-slate-900 p-4">
                  <div className="flex min-h-[520px] items-center justify-center">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={startCrop}
                      onMouseMove={moveCrop}
                      onMouseUp={endCrop}
                      onMouseLeave={endCrop}
                      className="max-h-[500px] max-w-full cursor-crosshair touch-none"
                    />
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={rotateLeft}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    ↶ Rotate Left
                  </button>

                  <button
                    type="button"
                    onClick={rotateRight}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    ↷ Rotate Right
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlipX(!flipX)}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    ↔ Flip Horizontal
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlipY(!flipY)}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    ↕ Flip Vertical
                  </button>

                  <button
                    type="button"
                    onClick={resetCrop}
                    className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Reset
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

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">
                Aspect Ratio
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Choose a popular crop size.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {presets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() =>
                      changeRatio(preset.value)
                    }
                    className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      selectedRatio === preset.value
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs leading-5 text-slate-500">
                The 35:45 preset is useful for
                common passport and visa photo
                formats. Always check the official
                requirements of your application.
              </div>
            </div>

            {image && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">
                  Crop Settings
                </h2>

                {crop && (
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Width</span>
                      <strong>
                        {Math.round(crop.width)} px
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Height</span>
                      <strong>
                        {Math.round(crop.height)} px
                      </strong>
                    </div>

                    <div className="flex justify-between">
                      <span>Ratio</span>
                      <strong>
                        {(
                          crop.width /
                          crop.height
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={cropImage}
                  className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-3 font-bold text-white transition hover:bg-blue-700"
                >
                  ✂️ Crop Image
                </button>
              </div>
            )}

            {downloadUrl && (
              <div className="rounded-3xl border border-green-200 bg-green-50 p-6">
                <h2 className="text-lg font-bold text-green-900">
                  Your Image Is Ready
                </h2>

                <p className="mt-1 text-sm text-green-700">
                  The cropped image has been
                  created in your browser.
                </p>

                <a
                  href={downloadUrl}
                  download={`${fileName || "cropped-image"}-cropped.jpg`}
                  className="mt-5 block rounded-xl bg-green-600 px-5 py-3 text-center font-bold text-white hover:bg-green-700"
                >
                  Download Cropped Image
                </a>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900">
            Crop Images Online for Free
          </h2>

          <div className="mt-6 space-y-5 text-slate-600">
            <p>
              VisaPic's online image cropper lets you
              quickly crop photos without installing
              desktop software or mobile applications.
            </p>

            <p>
              Choose a square crop, common portrait
              ratios, or the 35:45 ratio commonly used
              for passport and visa photographs.
            </p>

            <p>
              Image processing happens directly in your
              browser. Your original image does not need
              to be uploaded to a server for cropping.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-3xl font-black text-slate-900">
            How to Crop an Image
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
                Select the image you want to crop.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-2xl font-black text-blue-600">
                02
              </div>

              <h3 className="mt-3 font-bold text-slate-900">
                Select Crop
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose an aspect ratio and drag over
                the part of the image you need.
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
                Click Crop Image and download your
                finished photo.
              </p>
            </div>
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