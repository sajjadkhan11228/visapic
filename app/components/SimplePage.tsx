export default function SimplePage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <a href="/" className="text-2xl font-bold">
            Visa<span className="text-blue-600">Pic</span>
          </a>
          <a href="/" className="text-sm font-semibold text-slate-600 hover:text-blue-600">
            ← Home
          </a>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>

          <div className="mt-10 space-y-7 text-sm leading-7 text-slate-600">
            {children}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} VisaPic
        </div>
      </footer>
    </main>
  );
}
