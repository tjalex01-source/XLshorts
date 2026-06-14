import { useState, useEffect, useRef } from 'react';
import type { Ad } from '../types/database';
import { supabase } from '../lib/supabase';

interface AdOverlayProps {
  ads: Ad[];
  filmId: string;
  userId: string | null;
  placement: 'pre-roll' | 'mid-roll';
  onComplete: () => void;
}

export default function AdOverlay({ ads, filmId, userId, placement, onComplete }: AdOverlayProps) {
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ads[0]?.duration_seconds ?? 0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const impressionRecorded = useRef<Set<string>>(new Set());

  const currentAd = ads[index];

  useEffect(() => {
    if (!currentAd) { onComplete(); return; }
    setSecondsLeft(currentAd.duration_seconds);
    setImageLoaded(false);
  }, [index, currentAd]);

  useEffect(() => {
    if (!currentAd) return;
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          recordImpression(currentAd, true);
          if (index + 1 < ads.length) {
            setIndex(i => i + 1);
          } else {
            onComplete();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [index, currentAd, ads.length]);

  async function recordImpression(ad: Ad, completed: boolean) {
    if (impressionRecorded.current.has(ad.id)) return;
    impressionRecorded.current.add(ad.id);
    await supabase.from('ad_impressions').insert({
      ad_id: ad.id,
      film_id: filmId,
      user_id: userId,
      placement,
      completed,
    });
  }

  if (!currentAd) return null;

  const progress = ((currentAd.duration_seconds - secondsLeft) / currentAd.duration_seconds) * 100;
  const totalAds = ads.length;
  const adLabel = totalAds > 1 ? `Ad ${index + 1} of ${totalAds}` : 'Ad';

  return (
    <div className="absolute inset-0 z-40 bg-black flex flex-col overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          key={currentAd.id}
          src={currentAd.image_url}
          alt=""
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-opacity duration-700 ${imageLoaded ? 'opacity-40' : 'opacity-0'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/40" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 pt-6">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-white/10">
          <span className="w-2 h-2 rounded-full bg-[#e8a020] animate-pulse" />
          <span className="text-white/70 text-xs font-semibold tracking-wider uppercase">Advertisement</span>
        </div>
        <div className="px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full border border-white/10">
          <span className="text-white/60 text-xs font-medium">{adLabel}</span>
        </div>
      </div>

      {/* Center content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div
          className="w-1 h-12 rounded-full mb-8 opacity-60"
          style={{ backgroundColor: currentAd.accent_color, width: '3px' }}
        />
        <p
          className="text-sm font-bold uppercase tracking-[0.3em] mb-4 opacity-80"
          style={{ color: currentAd.accent_color }}
        >
          {currentAd.advertiser}
        </p>
        <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight max-w-2xl mb-4">
          {currentAd.tagline}
        </h2>
        <div
          className="mt-4 px-6 py-2 rounded-full text-sm font-semibold text-black"
          style={{ backgroundColor: currentAd.accent_color }}
        >
          Learn More
        </div>
      </div>

      {/* Bottom controls */}
      <div className="relative z-10 px-6 pb-8">
        {/* Progress bar */}
        <div className="mb-4 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%`, backgroundColor: currentAd.accent_color }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center border border-white/20 bg-black/50">
              <span className="text-white font-bold text-xs">{secondsLeft}</span>
            </div>
            <span className="text-neutral-400 text-sm">
              {secondsLeft === 1 ? 'Ad ends in 1 second' : `Ad ends in ${secondsLeft} seconds`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-600 text-xs">Ads support free streaming on</span>
            <span className="text-sm font-black tracking-tighter text-white">
              XL<span style={{ color: '#e8a020' }}>Shorts</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
