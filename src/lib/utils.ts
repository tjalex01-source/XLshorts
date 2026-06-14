import type { Film } from '../types/database';

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m}m`;
}

export function formatProgress(progress: number, total: number): number {
  if (!total) return 0;
  return Math.round((progress / total) * 100);
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-emerald-400';
  if (score >= 7) return 'text-amber-400';
  return 'text-red-400';
}

export function filterFilms(films: Film[], query: string): Film[] {
  const q = query.toLowerCase().trim();
  if (!q) return films;
  return films.filter(
    f =>
      f.title.toLowerCase().includes(q) ||
      f.director.toLowerCase().includes(q) ||
      f.description.toLowerCase().includes(q) ||
      f.tags.some(t => t.toLowerCase().includes(q))
  );
}
