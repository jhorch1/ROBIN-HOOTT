import { Outlet } from "react-router-dom";
import Navbar from "../ui/Navbar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col transition-colors duration-300">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
