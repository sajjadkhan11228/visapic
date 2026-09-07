"use client";

type BackgroundPreviewProps = {
  image: string;
  backgroundColor: string;
  backgroundName: string;
  isTransparent?: boolean;
};

export default function BackgroundPreview({
  image,
  backgroundColor,
  backgroundName,
  isTransparent = false,
}: BackgroundPreviewProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">
          Live Photo Preview
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Current background:{" "}
          <span className="font-semibold text-slate-700">{backgroundName}</span>
        </p>
      </div>

      <div
        className="mx-auto flex min-h-[420px] max-w-[360px] items-center justify-center overflow-hidden rounded-2xl border border-slate-200 p-6"
        style={{ backgroundColor }}
      >
        <img
          src={image}
          alt="Passport photo preview"
          className="max-h-[380px] max-w-full object-contain"
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-3">
        <div
          className="h-8 w-8 rounded-full border-2 border-white shadow ring-1 ring-slate-300"
          style={{ backgroundColor }}
        />
        <span className="text-sm font-semibold text-slate-700">
          {backgroundName} Background
        </span>
      </div>

      <div
        className={`mt-4 rounded-xl px-4 py-3 text-xs leading-5 ${
          isTransparent
            ? "bg-green-50 text-green-700"
            : "bg-blue-50 text-blue-700"
        }`}
      >
        {isTransparent ? (
          <>
            <strong>Background replacement active.</strong> The transparent
            subject is displayed over the selected color.
          </>
        ) : (
          <>
            <strong>Original background is still present.</strong> Run AI
            Background Removal if you want the selected color to replace the
            original background.
          </>
        )}
      </div>
    </section>
  );
}
