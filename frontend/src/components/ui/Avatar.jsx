import { User } from "lucide-react";

/**
 * Avatar - Muestra una imagen de perfil o iniciales (Exclusivo Tailwind CSS)
 */
export default function Avatar({ src, alt, fallback, size = "md", className = "" }) {
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl",
  };

  return (
    <div className={`relative inline-flex items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-800 rounded-full shrink-0 ${sizes[size]} ${className}`}>
      {src ? (
        <img src={src} alt={alt || "Avatar"} className="w-full h-full object-cover" />
      ) : fallback ? (
        <span className="font-bold text-gray-600 dark:text-gray-300 uppercase">{fallback.substring(0, 2)}</span>
      ) : (
        <User className="w-1/2 h-1/2 text-gray-400" />
      )}
    </div>
  );
}
