import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

type Mode = 'signin' | 'signup';

export default function Auth() {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    if (mode === 'signin') {
      const { error } = await signIn(email.trim(), password);
      if (error) setError(error);
    } else {
      const { error } = await signUp(email.trim(), password);
      if (error) {
        setError(error);
      } else {
        setSuccess('Account created! Check your email to confirm, then sign in.');
        setPassword('');
        setMode('signin');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[320px] bg-[#e8a020]/6 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <span className="text-4xl font-black tracking-tight text-white select-none">
              XL<span className="text-[#e8a020]">Shorts</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-7 shadow-2xl shadow-black/60">
          {/* Mode toggle */}
          <div className="flex bg-white/[0.05] rounded-xl p-1 mb-6">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                  mode === m
                    ? 'bg-[#e8a020] text-black shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Feedback banners */}
          {success && (
            <div className="flex items-start gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl mb-5">
              <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-emerald-400 text-sm">{success}</p>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-500/10 border border-red-500/25 rounded-xl mb-5">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/[0.06] border border-white/10 focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/15 rounded-xl px-4 py-3 text-white placeholder-neutral-600 text-sm outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
                  className="w-full bg-white/[0.06] border border-white/10 focus:border-[#e8a020]/60 focus:ring-2 focus:ring-[#e8a020]/15 rounded-xl px-4 py-3 pr-11 text-white placeholder-neutral-600 text-sm outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-3.5 bg-[#e8a020] hover:bg-[#d4911a] disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-[#e8a020]/20 hover:shadow-[#e8a020]/30 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-neutral-600 text-xs mt-5">
          By continuing you agree to our{' '}
          <Link to="/terms" className="text-neutral-400 hover:text-white transition-colors">Terms</Link>
          {' '}and{' '}
          <Link to="/privacy" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
