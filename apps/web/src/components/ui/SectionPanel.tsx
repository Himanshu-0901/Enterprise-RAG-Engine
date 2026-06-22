import type { ReactNode } from "react";

type SectionPanelProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
};

export function SectionPanel({
  title,
  description,
  action,
  children
}: SectionPanelProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-zinc-200 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
