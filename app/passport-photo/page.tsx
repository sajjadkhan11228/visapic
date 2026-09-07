"use client";

import { useEffect, useState } from "react";
import PhotoEditor from "../components/PhotoEditor";

export default function PassportPhotoPage() {
  const [image, setImage] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] =
    useState("United States");

  useEffect(() => {
    return () => {
      if (image?.startsWith("blob:")) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
  }

  function removePhoto() {
    setImage(null);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* HEADER */}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a
            href="/"
            className="text-2xl font-bold text-blue-600"
          >
            VisaPic
          </a>

          <a
            href="/"
            className="text-sm font-semibold text-slate-600 hover:text-blue-600"
          >
            ← Home
          </a>
        </div>
      </header>

      {/* MAIN */}

      <section className="mx-auto max-w-6xl px-6 py-12">
        {/* TITLE */}

        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
            Passport & Visa Photo Tool
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            Create Your Passport Photo
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Select your country, upload your photo, crop it,
            and create a passport or visa photo.
          </p>
        </div>

        {/* TOOL CARD */}

        <div className="mx-auto mt-10 max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          {!image ? (
            <>
              {/* COUNTRY */}

              <div>
                <label
                  htmlFor="country"
                  className="mb-2 block text-sm font-semibold text-slate-800"
                >
                  Select Country
                </label>

                <select
                  id="country"
                  value={selectedCountry}
                  onChange={(event) =>
                    setSelectedCountry(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="United States">
                    🇺🇸 United States
                  </option>

                  <option value="United Kingdom">
                    🇬🇧 United Kingdom
                  </option>

                  <option value="Canada">
                    🇨🇦 Canada
                  </option>

                  <option value="Pakistan">
                    🇵🇰 Pakistan
                  </option>

                  <option value="India">
                    🇮🇳 India
                  </option>

                  <option value="Germany">
                    🇩🇪 Germany
                  </option>

                  <option value="France">
                    🇫🇷 France
                  </option>

                  <option value="Saudi Arabia">
                    🇸🇦 Saudi Arabia
                  </option>

                  <option value="United Arab Emirates">
                    🇦🇪 United Arab Emirates
                  </option>
                </select>
              </div>

              {/* SELECTED COUNTRY INFO */}

              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-sm text-slate-500">
                  Selected country
                </p>

                <p className="mt-1 text-xl font-bold text-slate-900">
                  {selectedCountry}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  The editor will automatically use the
                  selected country's photo ratio.
                </p>
              </div>

              {/* UPLOAD */}

              <div className="mt-8">
                <label
                  htmlFor="photo-upload"
                  className="flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-blue-500 hover:bg-blue-50"
                >
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
                    📷
                  </div>

                  <h2 className="text-xl font-bold text-slate-900">
                    Upload Your Photo
                  </h2>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Select a clear JPG, JPEG or WebP photo
                    from your computer.
                  </p>

                  <span className="mt-6 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white">
                    Choose Photo
                  </span>

                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* BASIC REQUIREMENTS */}

              <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-bold text-slate-900">
                  Before uploading
                </h3>

                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  <li>
                    ✓ Face should be clearly visible
                  </li>

                  <li>
                    ✓ Look directly at the camera
                  </li>

                  <li>
                    ✓ Use good, even lighting
                  </li>

                  <li>
                    ✓ Avoid strong shadows
                  </li>

                  <li>
                    ✓ Follow your selected country's
                    official requirements
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* PHOTO HEADER */}

              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">
                    Selected country
                  </p>

                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedCountry}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={removePhoto}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Remove Photo
                </button>
              </div>

              {/* EDITOR */}

              <PhotoEditor
                image={image}
                country={selectedCountry}
              />
            </>
          )}
        </div>

        {/* INFO */}

        <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-2xl">
              🌍
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Country Specific
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Select a country and use its configured
              photo dimensions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-2xl">
              ✂️
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Easy Editing
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Crop, zoom and rotate your photo before
              creating the final image.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="text-2xl">
              ⬇️
            </div>

            <h3 className="mt-4 font-bold text-slate-900">
              Download JPG
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create the final cropped JPG directly in
              your browser.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} VisaPic. All
          rights reserved.
        </div>
      </footer>
    </main>
  );
}