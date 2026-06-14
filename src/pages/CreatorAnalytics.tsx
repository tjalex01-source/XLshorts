import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Film } from '../types/database';
import {
  TrendingUp, BarChart2, DollarSign, Eye, ChevronDown, ChevronUp,
  Loader2, Info, Film as FilmIcon, Calendar, Zap
} from 'lucide-react';

const PLACEHOLDER_CPM = 4.50;

interface FilmStat {
  film: Film;
  total: number;
  completed: number;
  preRoll: number;
  midRoll: number;
}

interface WeeklyPoint {
  label: string;
  count: number;
}

interface Props {
  userId: string;
}

export default function CreatorAnalytics({ userId }: Props) {
  const [filmStats, setFilmStats] = useState<FilmStat[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyPoint[]>([]);
  const [totalImpressions, setTotalImpressions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedFilm, setExpandedFilm] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'4w' | '12w'>('4w');

  useEffect(() => { load(); }, [userId, timeRange]);

  async function load() {
    setLoading(true);

    const { data: films } = await supabase
      .from('films')
      .select('*')
      .eq('uploaded_by', userId)
      .order('created_at', { ascending: false });

    const allFilms: Film[] = films ?? [];
    if (allFilms.length === 0) {
      setFilmStats([]);
      setWeeklyData([]);
      setTotalImpressions(0);
      setLoading(false);
      return;
    }

    const filmIds = allFilms.map(f => f.id);

    const weeksBack = timeRange === '4w' ? 4 : 12;
    const since = new Date();
    since.setDate(since.getDate() - weeksBack * 7);

    const [{ data: impressionRows }, { data: weekRows }] = await Promise.all([
      supabase
        .from('ad_impressions')
        .select('film_id, placement, completed')
        .in('film_id', filmIds),
      supabase
        .from('ad_impressions')
        .select('viewed_at')
        .in('film_id', filmIds)
        .gte('viewed_at', since.toISOString()),
    ]);

    const rows = impressionRows ?? [];

    const statMap = new Map<string, { total: number; completed: number; preRoll: number; midRoll: number }>();
    for (const r of rows) {
      const s = statMap.get(r.film_id) ?? { total: 0, completed: 0, preRoll: 0, midRoll: 0 };
      s.total++;
      if (r.completed) s.completed++;
      if (r.placement === 'pre-roll') s.preRoll++;
      if (r.placement === 'mid-roll') s.midRoll++;
      statMap.set(r.film_id, s);
    }

    const stats: FilmStat[] = allFilms
      .filter(f => f.content_type === 'film')
      .map(film => ({
        film,
        ...(statMap.get(film.id) ?? { total: 0, completed: 0, preRoll: 0, midRoll: 0 }),
      }))
      .sort((a, b) => b.total - a.total);

    setFilmStats(stats);
    setTotalImpressions(rows.length);

    // Build weekly buckets
    const buckets: WeeklyPoint[] = [];
    for (let i = weeksBack - 1; i >= 0; i--) {
      const end = new Date();
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      const label = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = (weekRows ?? []).filter(r => {
        const d = new Date(r.viewed_at);
        return d >= start && d < end;
      }).length;
      buckets.push({ label, count });
    }
    setWeeklyData(buckets);
    setLoading(false);
  }

  const estimatedEarnings = (totalImpressions / 1000) * PLACEHOLDER_CPM * 0.70;
  const maxWeekly = Math.max(...weeklyData.map(w => w.count), 1);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-[#e8a020]" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <SummaryCard
          icon={<Eye size={16} className="text-[#e8a020]" />}
          label="Total Impressions"
          value={totalImpressions.toLocaleString()}
          sub="all time"
        />
        <SummaryCard
          icon={<DollarSign size={16} className="text-green-400" />}
          label="Est. Earnings"
          value={`$${estimatedEarnings.toFixed(2)}`}
          sub={`at $${PLACEHOLDER_CPM} CPM · 70% share`}
          highlight
        />
        <SummaryCard
          icon={<Zap size={16} className="text-blue-400" />}
          label="Completion Rate"
          value={totalImpressions > 0
            ? `${Math.round((filmStats.reduce((s, f) => s + f.completed, 0) / totalImpressions) * 100)}%`
            : '—'}
          sub="of ads watched fully"
        />
      </div>

      {/* CPM notice */}
      <div className="flex items-start gap-3 px-4 py-3 bg-[#e8a020]/8 border border-[#e8a020]/20 rounded-xl">
        <Info size={15} className="text-[#e8a020] shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-300 leading-relaxed">
          Earnings shown are estimates based on a placeholder rate of <strong className="text-white">${PLACEHOLDER_CPM} CPM</strong> (per 1,000 completed impressions). Your final rate will reflect actual ad network rates once Google Ad Manager is live. Impression data is being recorded for reference — payouts will begin once the platform is actively receiving ad revenue.
        </p>
      </div>

      {/* Weekly chart */}
      <div className="bg-[#141414] border border-white/8 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 size={16} className="text-[#e8a020]" />
            <span className="text-sm font-semibold text-white">Weekly Impressions</span>
          </div>
          <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg">
            {(['4w', '12w'] as const).map(r => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${timeRange === r ? 'bg-[#e8a020] text-black' : 'text-neutral-400 hover:text-white'}`}
              >
                {r === '4w' ? '4 Weeks' : '12 Weeks'}
              </button>
            ))}
          </div>
        </div>

        {weeklyData.every(w => w.count === 0) ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <TrendingUp size={32} className="text-neutral-700 mb-3" />
            <p className="text-neutral-500 text-sm">No impressions yet in this period.</p>
            <p className="text-neutral-600 text-xs mt-1">Publish films to start accumulating data.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {weeklyData.map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-neutral-500 w-16 shrink-0 text-right">{w.label}</span>
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#e8a020] rounded-full transition-all duration-500"
                    style={{ width: `${(w.count / maxWeekly) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-neutral-400 w-10 shrink-0">{w.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Per-film breakdown */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <FilmIcon size={15} className="text-neutral-400" />
          <h3 className="text-sm font-semibold text-white">Per-Film Performance</h3>
        </div>

        {filmStats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 bg-[#141414] border border-white/8 rounded-2xl text-center">
            <FilmIcon size={36} className="text-neutral-700 mb-3" />
            <p className="text-neutral-500 text-sm">No films uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filmStats.map(({ film, total, completed, preRoll, midRoll }) => {
              const isExpanded = expandedFilm === film.id;
              const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
              const filmEarnings = (total / 1000) * PLACEHOLDER_CPM * 0.70;

              return (
                <div key={film.id} className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
                  <button
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/3 transition-colors"
                    onClick={() => setExpandedFilm(isExpanded ? null : film.id)}
                  >
                    {film.thumbnail_url ? (
                      <img src={film.thumbnail_url} alt={film.title} className="w-14 h-10 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className="w-14 h-10 bg-white/5 rounded-lg flex items-center justify-center shrink-0">
                        <FilmIcon size={14} className="text-neutral-600" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{film.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{film.status === 'published' ? 'Published' : film.status}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-neutral-500">Impressions</p>
                        <p className="text-sm font-bold text-[#e8a020]">{total.toLocaleString()}</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-neutral-500">Est. Earnings</p>
                        <p className="text-sm font-bold text-green-400">${filmEarnings.toFixed(2)}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp size={15} className="text-neutral-500" />
                      ) : (
                        <ChevronDown size={15} className="text-neutral-500" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/5 px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <DetailStat label="Total Impressions" value={total.toLocaleString()} color="text-[#e8a020]" />
                      <DetailStat label="Pre-Roll" value={preRoll.toLocaleString()} color="text-blue-400" />
                      <DetailStat label="Mid-Roll" value={midRoll.toLocaleString()} color="text-teal-400" />
                      <DetailStat label="Completion Rate" value={`${completionRate}%`} color="text-white" />
                      <DetailStat label="Est. Creator Share" value={`$${filmEarnings.toFixed(2)}`} color="text-green-400" />
                      <DetailStat label="CPM Rate" value={`$${PLACEHOLDER_CPM}`} color="text-neutral-300" sub="placeholder" />
                      <DetailStat label="Duration" value={`${Math.floor(film.duration_seconds / 60)}m`} color="text-neutral-300" />
                      <DetailStat label="Rating" value={film.rating || '—'} color="text-neutral-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payout timeline note */}
      <div className="flex items-start gap-3 px-4 py-3 bg-blue-500/8 border border-blue-500/20 rounded-xl">
        <Calendar size={15} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-neutral-300 leading-relaxed">
          <strong className="text-white">Payouts are coming.</strong> We are finalizing our Google Ad Manager integration and payout infrastructure. Once the platform begins receiving ad revenue, payouts will be issued on a regular schedule going forward.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, highlight }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? 'bg-green-500/5 border-green-500/20' : 'bg-[#141414] border-white/8'}`}>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <p className="text-xs text-neutral-500">{label}</p>
      </div>
      <p className={`text-2xl font-black ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function DetailStat({ label, value, color, sub }: {
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-[#0a0a0a] rounded-xl p-3">
      <p className="text-xs text-neutral-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-700 mt-0.5">{sub}</p>}
    </div>
  );
}
