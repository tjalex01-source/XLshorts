import type { Ad } from '../types/database';

export interface AdSchedule {
  preRollSeconds: number;
  midRollSeconds: number;
  midRollTrigger: number | null;
}

export function getAdSchedule(filmDurationSeconds: number): AdSchedule {
  if (filmDurationSeconds < 300) {
    return { preRollSeconds: 30, midRollSeconds: 0, midRollTrigger: null };
  } else if (filmDurationSeconds <= 900) {
    return { preRollSeconds: 60, midRollSeconds: 0, midRollTrigger: null };
  } else {
    // 30–60 second mid-roll; seed with film duration so it's consistent per film
    const midRollSeconds = 30 + ((filmDurationSeconds % 31));
    const midRollTrigger = Math.floor(filmDurationSeconds * 0.45);
    return { preRollSeconds: 60, midRollSeconds, midRollTrigger };
  }
}

export function selectAdsForDuration(ads: Ad[], targetSeconds: number): Ad[] {
  if (!ads.length) return [];
  const selected: Ad[] = [];
  let filled = 0;
  let pass = 0;
  while (filled < targetSeconds && pass < ads.length * 4) {
    const ad = ads[pass % ads.length];
    selected.push(ad);
    filled += ad.duration_seconds;
    pass++;
  }
  return selected;
}

export function describeAdBreak(schedule: AdSchedule): string {
  if (schedule.preRollSeconds <= 30) return '30-second ad';
  return '1-minute ad break';
}
