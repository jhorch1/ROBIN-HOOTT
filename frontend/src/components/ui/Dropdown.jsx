import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Dropdown - Menú desplegable (Exclusivo Tailwind CSS)
 */
export default function Dropdown({ trigger, items, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer inline-flex items-center gap-1">
        {trigger}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 z-50 animate-in fade-in zoom-in duration-100">
          <div className="py-1">
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  item.onClick && item.onClick();
                  setIsOpen(false);
                }}
                className="group flex w-full items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary transition-colors"
              >
                {item.icon && <span className="mr-3 opacity-70 group-hover:opacity-100">{item.icon}</span>}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
