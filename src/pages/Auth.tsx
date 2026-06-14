import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Auth() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
      return;
    }
    // Redirect to shared Xandland auth
    const redirectTo = encodeURIComponent('https://xlshorts.com/auth/callback');
    window.location.href = `https://auth.xandland.com?site=xlshorts&redirect_to=${redirectTo}`;
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
        <p className="text-neutral-400 text-sm">Redirecting to sign in...</p>
      </div>
    </div>
  );
}
