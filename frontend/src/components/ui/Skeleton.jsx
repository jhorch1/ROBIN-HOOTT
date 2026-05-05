/**
 * Skeleton - Componente para estados de carga (Exclusivo Tailwind CSS)
 */
export default function Skeleton({ className = "", variant = "rectangular" }) {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";
  
  const variants = {
    circular: "rounded-full",
    rectangular: "rounded-md",
    text: "rounded h-4 w-3/4",
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}></div>
  );
}
