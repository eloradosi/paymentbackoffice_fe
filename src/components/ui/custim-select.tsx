import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);

  const options = [10, 20, 50];

  return (
    <div className="relative w-40">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="
          w-full px-4 py-2
          bg-white border border-slate-300
          rounded-xl shadow-sm
          flex items-center justify-between
          hover:border-slate-400
          transition
        "
      >
        <span className="text-sm">{value} per halaman</span>
        <ChevronDown className="w-4 h-4 text-slate-600" />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute mt-2 w-full bg-white rounded-xl shadow-lg border border-slate-200 
            p-1 z-20
          "
        >
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="
                px-4 py-2 text-sm 
                rounded-lg cursor-pointer
                hover:bg-violet-100
                hover:text-violet-700
                transition
                my-1
                bg-slate-50
              "
            >
              {opt} per halaman
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
