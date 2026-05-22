'use client';

import Link from 'next/link';
import { Clapperboard, Github, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <Clapperboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">
            Video<span className="text-violet-400">Forge</span>
          </span>
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/editor"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>ابدأ المونتاج</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
