const tools = [
  {
    icon: "📷",
    title: "Passport Photo",
    description: "Full editor with country size, face detection, smart positioning and export.",
    href: "/passport-photo",
  },
  {
    icon: "🪪",
    title: "Passport Photo Maker",
    description: "Simple country-based photo maker with crop and background controls.",
    href: "/passport-photo-maker",
  },
  {
    icon: "📐",
    title: "Passport Photo Size",
    description: "Generate a photo at a selected physical size and DPI.",
    href: "/passport-photo-size",
  },
  {
    icon: "🖨️",
    title: "Passport Photo Sheet",
    description: "Arrange multiple photos on A4 or 4×6 paper.",
    href: "/passport-photo-sheet",
  },
  {
    icon: "✂️",
    title: "Image Cropper",
    description: "Crop, rotate and resize the framing of an image.",
    href: "/image-cropper",
  },
  {
    icon: "↔️",
    title: "Image Resizer",
    description: "Resize images with presets or custom dimensions.",
    href: "/image-resizer",
  },
  {
    icon: "🗜️",
    title: "Image Compressor",
    description: "Reduce JPG size to a target file-size range.",
    href: "/image-compressor",
  },
  {
    icon: "📉",
    title: "Image Size Reducer",
    description: "Reduce image dimensions and file size in your browser.",
    href: "/image-size-reducer",
  },
  {
    icon: "🔄",
    title: "JPG to PNG",
    description: "Convert JPG, JPEG, WebP or BMP images to PNG.",
    href: "/jpg-to-png",
  },
  {
    icon: "🖼️",
    title: "Image to JPG",
    description: "Convert images to JPG with a selectable background.",
    href: "/image-to-jpg",
  },
  {
    icon: "🎨",
    title: "Background Changer",
    description: "Prepare a photo with a selected background color.",
    href: "/background-changer",
  },
  {
    icon: "📄",
    title: "Photo to PDF",
    description: "Turn an image into a printable PDF.",
    href: "/photo-to-pdf",
  },
  {
    icon: "📏",
    title: "DPI Converter",
    description: "Calculate physical size and export dimensions from DPI.",
    href: "/dpi-converter",
  },
  {
    icon: "🖨️",
    title: "Photo Print Sheet",
    description: "Create a printable sheet with repeated passport photos.",
    href: "/photo-print-sheet",
  },
];

const countries = [
  ["🇺🇸", "United States"],
  ["🇬🇧", "United Kingdom"],
  ["🇨🇦", "Canada"],
  ["🇵🇰", "Pakistan"],
  ["🇮🇳", "India"],
  ["🇩🇪", "Germany"],
  ["🇫🇷", "France"],
  ["🇸🇦", "Saudi Arabia"],
  ["🇦🇪", "United Arab Emirates"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="text-2xl font-bold tracking-tight">
            Visa<span className="text-blue-600">Pic</span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <a href="#tools" className="hover:text-blue-600">Tools</a>
            <a href="#how-it-works" className="hover:text-blue-600">How It Works</a>
            <a href="/about" className="hover:text-blue-600">About</a>
          </nav>

          <a
            href="/passport-photo"
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
          >
            Start Free
          </a>
        </div>
      </header>

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center md:py-28">
          <div className="mx-auto mb-6 inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Passport & Visa Photo Tools
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Create Passport & Visa Photos
            <span className="block text-blue-600">Online in Minutes</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Upload a photo, select your country, position the face, remove the
            background when needed, choose the output size and download the
            finished JPG.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/passport-photo"
              className="rounded-xl bg-blue-600 px-7 py-4 font-semibold text-white shadow-lg hover:bg-blue-700"
            >
              Create Passport Photo
            </a>
            <a
              href="#tools"
              className="rounded-xl border border-slate-300 bg-white px-7 py-4 font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-600"
            >
              Explore All Tools
            </a>
          </div>

          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
            <TrustItem title="Browser based" text="Your photo is processed locally by these tools." />
            <TrustItem title="Country presets" text="Choose a configured document-photo format." />
            <TrustItem title="JPG export" text="Download the generated result directly." />
          </div>
        </div>
      </section>

      <section id="tools" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-semibold text-blue-600">ALL TOOLS</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Everything in one place
          </h2>
          <p className="mt-4 text-slate-600">
            The main passport-photo editor connects the AI and editing
            features together. The other pages are focused standalone tools.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="font-semibold text-blue-600">HOW IT WORKS</p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Create your photo in 4 steps
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-4">
            <StepCard number="01" title="Upload" description="Choose a clear JPG, JPEG or PNG photo." />
            <StepCard number="02" title="Detect" description="VisaPic can analyze the face automatically." />
            <StepCard number="03" title="Edit" description="Crop, zoom, rotate and optionally remove the background." />
            <StepCard number="04" title="Export" description="Create and download the country-sized JPG." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center">
          <p className="font-semibold text-blue-600">COUNTRIES</p>
          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Configured country presets
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Dimensions and compliance guidance are stored separately from the
            editor so the project can be expanded without duplicating logic.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          {countries.map(([flag, country]) => (
            <a
              key={country}
              href="/passport-photo"
              className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium shadow-sm hover:border-blue-300 hover:text-blue-600"
            >
              {flag} {country}
            </a>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold">Privacy-focused browser tools</h2>
          <p className="mt-4 leading-7 text-slate-300">
            Most image operations in this project are performed in the
            browser. Always review the exact official requirements before
            submitting a photo.
          </p>
          <a
            href="/passport-photo"
            className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-100"
          >
            Open Passport Photo Tool
          </a>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-bold">
              Visa<span className="text-blue-600">Pic</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Passport & visa photo tools.
            </p>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-slate-500">
            <a href="/about" className="hover:text-blue-600">About</a>
            <a href="/privacy" className="hover:text-blue-600">Privacy</a>
            <a href="/terms" className="hover:text-blue-600">Terms</a>
            <a href="/contact" className="hover:text-blue-600">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

function ToolCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-bold group-hover:text-blue-600">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-5 text-sm font-semibold text-blue-600">Open tool →</div>
    </a>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="text-4xl font-bold text-blue-600">{number}</div>
      <h3 className="mt-5 text-xl font-bold">{title}</h3>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
    </div>
  );
}

function TrustItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="font-bold text-slate-900">{title}</div>
      <div className="mt-1 text-sm leading-5 text-slate-500">{text}</div>
    </div>
  );
}
