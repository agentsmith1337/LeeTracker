interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-8 py-16 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-3 text-sm text-zinc-500">{description}</p>
        <span className="mt-6 inline-block rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-500">
          Coming soon
        </span>
      </div>
    </div>
  );
}