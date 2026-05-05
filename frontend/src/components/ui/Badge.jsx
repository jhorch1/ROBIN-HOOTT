/**
 * Badge - Componente para etiquetas y estados (Tailwind CSS)
 */
export default function Badge({ children, variant = "default", className = "" }) {
  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    primary: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    success: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
}
