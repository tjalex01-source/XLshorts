import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <footer className="mt-20 border-t border-white/5 py-12 px-8">
        <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black tracking-tight text-white">
              XL<span className="text-[#e8a020]">Shorts</span>
            </span>
          </div>
          <p className="text-neutral-500 text-xs">
            &copy; {new Date().getFullYear()} Xandland Enterprises, LLC &middot; All rights reserved &middot; Short Films Streaming
          </p>
          <p className="text-neutral-600 text-xs">Available on Fire TV &amp; Roku</p>
        </div>
      </footer>
    </div>
  );
}
