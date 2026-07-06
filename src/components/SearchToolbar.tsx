import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

interface SearchToolbarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onFilter?: () => void;
  filterLabel?: string;
  sortOptions?: { label: string; value: string }[];
  onSort?: (value: string) => void;
}

export function SearchToolbar({
  placeholder = "Search...",
  onSearch,
  onFilter,
  filterLabel = "Filters",
  sortOptions,
  onSort,
}: SearchToolbarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 min-w-[200px] max-w-md">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
        {query && (
          <button type="button" onClick={() => handleChange("")} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </label>

      {onFilter && (
        <button
          type="button"
          onClick={onFilter}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filterLabel}
        </button>
      )}

      {sortOptions && onSort && (
        <select
          onChange={(e) => onSort(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm outline-none transition focus:border-[#36ADAA]"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  );
}