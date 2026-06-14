import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Search } from 'lucide-react';

/*
  4-phase cinematic intro (total ~4.4s):
  Phase 0 – black (0–0.3s)
  Phase 1 – "XLShorts" fades in + scales up (0.3–1.1s)
  Phase 2 – hold, amber glow pulses in, tagline fades in (1.1–2.4s)
  Phase 3 – overlay fades out slowly, landing page fades in simultaneously (2.4–4.4s)
  Phase 4 – done, overlay unmounted
*/

const SESSION_KEY = 'xl_intro_v9';

type Phase = 0 | 1 | 2 | 3 | 4;

function usePhaseTimer(skip: boolean) {
  const [phase, setPhase] = useState<Phase>(skip ? 4 : 0);

  useEffect(() => {
    if (skip) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (p: Phase, ms: number) => timers.push(setTimeout(() => setPhase(p), ms));
    at(1, 300);
    at(2, 1100);
    at(3, 2400);
    at(4, 4600); // keep overlay in DOM until fade-out is fully complete
    return () => timers.forEach(clearTimeout);
  }, [skip]);

  return phase;
}

export default function Splash() {
  const skip = !!sessionStorage.getItem(SESSION_KEY);
  const phase = usePhaseTimer(skip);

  useEffect(() => {
    if (phase >= 3) sessionStorage.setItem(SESSION_KEY, 'true');
  }, [phase]);

  const showOverlay = phase < 4;

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Landing page — rendered behind, fades in as overlay fades out */}
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 relative"
        style={{
          opacity: phase >= 3 ? 1 : 0,
          transition: phase >= 3 ? 'opacity 1.8s ease-in-out 0.3s' : 'none',
          pointerEvents: phase >= 4 ? 'auto' : 'none',
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#e8a020]/6 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#e8a020]/4 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#c0392b]/4 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
          <div className="mb-5">
            <span className="text-5xl sm:text-6xl font-black tracking-tight text-white select-none">
              XL<span className="text-[#e8a020]">Shorts</span>
            </span>
          </div>
          <p className="text-neutral-400 text-base sm:text-lg mb-12 tracking-wide">
            Independent films that fit your life.
          </p>
          <div className="flex flex-col w-full gap-3">
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2.5 w-full py-4 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-base rounded-2xl transition-all duration-200 shadow-xl shadow-[#e8a020]/20 hover:shadow-[#e8a020]/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play size={18} fill="black" />
              Get Started Free
            </Link>
            <Link
              to="/auth"
              className="flex items-center justify-center gap-2.5 w-full py-4 bg-white/8 hover:bg-white/14 border border-white/15 hover:border-white/25 text-white font-semibold text-base rounded-2xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Sign In
            </Link>
            <Link
              to="/browse"
              className="flex items-center justify-center gap-2 w-full py-3.5 text-neutral-400 hover:text-white font-medium text-sm transition-colors duration-200"
            >
              <Search size={15} />
              Browse without an account
            </Link>
          </div>
        </div>
      </div>

      {/* Cinematic overlay — stays in DOM until fade-out completes */}
      {showOverlay && (
        <div
          className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center"
          style={{
            opacity: phase >= 3 ? 0 : 1,
            transition: phase >= 3 ? 'opacity 1.6s ease-in-out' : 'none',
            pointerEvents: 'none',
          }}
        >
          {/* Ambient glow — fades in at phase 2 */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity: phase >= 2 ? 1 : 0,
              transition: 'opacity 1s ease',
            }}
          >
            <div className="w-[600px] h-[280px] bg-[#e8a020]/10 rounded-full blur-3xl" />
          </div>

          {/* Logo — fades + scales in at phase 1 */}
          <div
            style={{
              opacity: phase >= 1 ? 1 : 0,
              transform: phase >= 1 ? 'scale(1)' : 'scale(0.82)',
              transition: 'opacity 0.7s ease, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
              fontSize: 'clamp(3.5rem, 14vw, 8rem)',
              fontWeight: 900,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            <span style={{ color: 'white' }}>XL</span>
            <span style={{ color: '#e8a020' }}>Shorts</span>
          </div>
        </div>
      )}
    </div>
  );
}
