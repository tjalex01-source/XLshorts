import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Bookmark, Home, Film, User, LogOut, ChevronDown,
  Menu, X, ShieldCheck, Clapperboard, RefreshCw, Settings
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../contexts/ProfileContext';
import { supabase } from '../lib/supabase';
import { ProfileAvatar, PRESET_AVATARS } from './ProfileSelector';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [rolesLoaded, setRolesLoaded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();
  const { activeProfile, setActiveProfile, profiles } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userMenuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setRolesLoaded(false);
      sessionStorage.removeItem('xl_roles_v2');
      return;
    }

    // Always fetch from DB — never read a stale cache for access decisions
    supabase.from('user_roles').select('role').eq('user_id', user.id).then(({ data }) => {
      const roles = (data ?? []).map((r: { role: string }) => r.role);
      setIsAdmin(roles.includes('admin'));
      setRolesLoaded(true);
      sessionStorage.setItem('xl_roles_v2', JSON.stringify({ roles, uid: user.id }));
    });
  }, [user]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  function handleSwitchProfile() {
    sessionStorage.removeItem('xl_active_profile');
    setActiveProfile(null as unknown as Parameters<typeof setActiveProfile>[0]);
    navigate('/');
    setUserMenuOpen(false);
  }

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/browse', label: 'Browse', icon: Film },
    { to: '/my-list', label: 'My List', icon: Bookmark },
  ];

  const displayName = activeProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Viewer';
  const avatarLetter = activeProfile?.avatar_letter || displayName[0]?.toUpperCase() || 'V';
  const avatarColor = activeProfile?.avatar_color || '#e8a020';
  const avatarPresetIcon = activeProfile?.avatar_icon ? PRESET_AVATARS.find(a => a.id === activeProfile.avatar_icon) : null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#0a0a0a]/95 backdrop-blur-md shadow-2xl shadow-black/50'
          : 'bg-gradient-to-b from-black/80 via-black/40 to-transparent'
      }`}
    >
      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 h-16 sm:h-20 flex items-center gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1 shrink-0">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            XL<span className="text-[#e8a020]">Shorts</span>
          </span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  location.pathname === to
                    ? 'text-white bg-white/10'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <Link
              to="/search"
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-neutral-300 hover:text-white xl-focusable"
            >
              <Search size={18} />
            </Link>
          )}

          {/* Admin quick-access */}
          {user && isAdmin && (
            <Link
              to="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#e8a020]/10 hover:bg-[#e8a020]/20 border border-[#e8a020]/20 text-sm font-medium text-[#e8a020] transition-all"
            >
              <ShieldCheck size={14} />
              Admin
            </Link>
          )}

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-white/10 transition-colors xl-focusable"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden"
                  style={{ backgroundColor: avatarColor }}
                >
                  {avatarPresetIcon
                    ? <span className="text-base leading-none">{avatarPresetIcon.icon}</span>
                    : <span className="text-black">{avatarLetter}</span>
                  }
                </div>
                {activeProfile && (
                  <span className="text-sm font-medium text-neutral-200 hidden sm:block max-w-24 truncate">
                    {activeProfile.name}
                  </span>
                )}
                <ChevronDown size={14} className={`text-neutral-300 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                  {/* Account info */}
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-xs text-neutral-500 mb-0.5">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {user.user_metadata?.full_name || 'Viewer'}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>

                  {/* Active profile */}
                  {activeProfile && (
                    <div className="px-4 py-2 border-b border-white/5 flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-black overflow-hidden shrink-0"
                        style={{ backgroundColor: activeProfile.avatar_color }}
                      >
                        {avatarPresetIcon
                          ? <span className="text-sm leading-none">{avatarPresetIcon.icon}</span>
                          : <span className="text-black">{activeProfile.avatar_letter}</span>
                        }
                      </div>
                      <span className="text-xs text-neutral-300 flex-1 truncate">{activeProfile.name}</span>
                    </div>
                  )}

                  <Link
                    to="/my-list"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Bookmark size={15} /> My List
                  </Link>

                  {profiles.length > 0 && (
                    <button
                      onClick={handleSwitchProfile}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <RefreshCw size={15} /> Switch Profile
                    </button>
                  )}

                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Settings size={15} /> Account & Profiles
                  </Link>

                  <div className="border-t border-white/8">
                    {/* Creator Account — goes to /creator for all signed-in users */}
                    {/* Creator page handles the apply flow vs studio based on role */}
                    <Link
                      to="/creator"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Clapperboard size={15} className="text-[#e8a020]" /> Creator Account
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-[#e8a020] hover:text-[#d4911a] hover:bg-white/5 transition-colors"
                      >
                        <ShieldCheck size={15} /> Admin Dashboard
                      </Link>
                    )}
                  </div>

                  <button
                    onClick={signOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/10"
                  >
                    <LogOut size={15} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth"
                className="px-4 py-2 text-sm font-semibold text-neutral-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 bg-[#e8a020] hover:bg-[#d4911a] text-black text-sm font-bold rounded-full transition-all duration-200 xl-focusable"
              >
                <User size={14} /> Get Started
              </Link>
            </div>
          )}

          {/* Mobile menu toggle (logged in only) */}
          {user && (
            <button
              onClick={() => setMobileOpen(v => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-neutral-300 hover:text-white"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && user && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-white/10 shadow-2xl shadow-black/50 px-4 py-4 flex flex-col gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'text-white bg-white/10'
                  : 'text-neutral-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={16} /> {label}
            </Link>
          ))}
          <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors">
            <Settings size={16} /> Account & Profiles
          </Link>
          {/* Creator Account always visible on mobile */}
          <Link
            to="/creator"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Clapperboard size={16} className="text-[#e8a020]" /> Creator Account
          </Link>
          {isAdmin && (
            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[#e8a020] hover:bg-white/5 transition-colors">
              <ShieldCheck size={16} /> Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
