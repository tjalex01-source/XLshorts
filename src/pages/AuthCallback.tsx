import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertCircle } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleCallback() {
      if (window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (error) {
            setError(error.message);
          } else {
            window.location.href = '/';
          }
          return;
        }
      }

      const code = new URLSearchParams(window.location.search).get('code');
      if (!code) {
        setError('No authorization code found. Please try signing in again.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        setError(error.message);
      } else {
        navigate('/', { replace: true });
      }
    }

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="flex items-center justify-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/30 rounded-2xl mb-6">
            <AlertCircle size={18} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-sm text-left">{error}</p>
          </div>
          <button
            onClick={() => window.location.href = 'https://auth.xandland.com?site=xlshorts&redirect_to=' + encodeURIComponent('https://xlshorts.com/auth/callback')}
            className="px-6 py-2.5 bg-[#e8a020] hover:bg-[#d4911a] text-black font-bold text-sm rounded-xl transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
        <p className="text-neutral-400 text-sm">Signing you in...</p>
      </div>
    </div>
  );
}
