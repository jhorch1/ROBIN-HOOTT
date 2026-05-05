export default function Spinner({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 w-full absolute top-0 left-0 z-50">
      <div className="w-16 h-16 border-4 border-primary border-t-transparent border-t-4 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">{text}</p>
    </div>
  );
}
