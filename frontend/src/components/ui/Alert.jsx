import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

/**
 * Alert - Componente reutilizable para alertas (Exclusivo Tailwind CSS)
 */
export default function Alert({ title, children, variant = "info", className = "" }) {
  const variants = {
    info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  };

  const icons = {
    info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    success: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
    error: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
  };

  return (
    <div className={`p-4 rounded-xl border flex gap-3 ${variants[variant]} ${className}`}>
      <div className="shrink-0 mt-0.5">{icons[variant]}</div>
      <div>
        {title && <h3 className="font-bold text-sm mb-1">{title}</h3>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
