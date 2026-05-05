export default function Spinner({ text = "Cargando..." }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[var(--color-bg)] w-full absolute top-0 left-0 z-50 transition-colors">
      <div className="w-16 h-16 border-4 border-[var(--color-primary)] border-t-transparent border-t-4 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-medium text-[var(--color-text)]">{text}</p>
    </div>
  );
}
