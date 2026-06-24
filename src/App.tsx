import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider } from './contexts/AuthContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { useAuth } from './contexts/AuthContext';
import { useProfile } from './contexts/ProfileContext';
import ScrollToTop from './components/ScrollToTop';
import Layout from './components/Layout';
import ProfileSelector from './components/ProfileSelector';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Search from './pages/Search';
import FilmDetail from './pages/FilmDetail';
import Player from './pages/Player';
import MyList from './pages/MyList';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import Splash from './pages/Splash';
import Admin from './pages/Admin';
import Creator from './pages/Creator';
import AccountProfile from './pages/AccountProfile';
import SeriesDetail from './pages/SeriesDetail';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PersonPage from './pages/PersonPage';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const { user, loading: authLoading } = useAuth();
  const { activeProfile, profiles, loadingProfiles } = useProfile();

  if (authLoading || (user && loadingProfiles)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#e8a020]" size={36} />
      </div>
    );
  }

  // Logged-in user with profiles but none selected → fullscreen profile picker, no navbar
  const showProfileSelector = !!user && profiles.length > 0 && !activeProfile;

  return (
    <Routes>
      {/* Auth callback — must be unguarded, always reachable */}
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <Auth />} />

      {/* Standalone pages (no layout/navbar) */}
      <Route path="/watch/:id" element={<Player />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/creator" element={<Creator />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/people/:slug" element={<PersonPage />} />

      {!user && <Route path="/" element={<Splash />} />}

      {/* Profile selector — fullscreen, no navbar */}
      {showProfileSelector && (
        <Route path="/" element={<ProfileSelector onComplete={() => {}} />} />
      )}

      <Route element={<Layout />}>
        {user && !showProfileSelector && (
          <Route path="/" element={<Home />} />
        )}
        <Route path="/browse" element={<Browse />} />
        <Route path="/search" element={<Search />} />
        <Route path="/film/:id" element={<FilmDetail />} />
        <Route path="/series/:id" element={<SeriesDetail />} />
        <Route path="/my-list" element={<MyList />} />
        <Route path="/profile" element={user ? <AccountProfile /> : <Navigate to="/auth" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
          <Analytics />
        </BrowserRouter>
      </ProfileProvider>
    </AuthProvider>
  );
}
