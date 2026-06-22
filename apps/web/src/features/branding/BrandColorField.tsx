type BrandColorFieldProps = {
  label: string;
  onChange: (value: string) => void;
  value: string;
};

const presetColors = [
  "#0d6e6e",
  "#1e3a8a",
  "#9f1239",
  "#d97757",
  "#7c3aed",
  "#0891b2"
];

export function BrandColorField({
  label,
  onChange,
  value
}: BrandColorFieldProps) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-700">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {presetColors.map((color) => (
          <button
            aria-label={`Use ${color}`}
            className={
              color === value
                ? "h-8 w-8 rounded-md border-2 border-zinc-950"
                : "h-8 w-8 rounded-md border border-zinc-200"
            }
            key={color}
            style={{ backgroundColor: color }}
            type="button"
            onClick={() => onChange(color)}
          />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="h-9 w-11 rounded-md border border-zinc-200 bg-white p-1"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        />
        <input
          className="h-9 min-w-0 flex-1 rounded-md border border-zinc-200 px-3 font-mono text-sm outline-none focus:border-zinc-500"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function BrandSwatch({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-zinc-200 p-3">
      <span
        aria-hidden
        className="h-8 w-8 rounded-md border border-black/10"
        style={{ backgroundColor: value }}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-950">{label}</p>
        <p className="truncate font-mono text-xs text-zinc-500">{value}</p>
      </div>
    </div>
  );
}
