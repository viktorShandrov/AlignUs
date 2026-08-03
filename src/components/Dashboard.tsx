import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchAnalyticsEvents,
  seedDemoAnalyticsData,
  clearAnalyticsData,
  AnalyticsEvent,
  AnalyticsEventType,
} from '../lib/analytics';
import {
  Activity,
  Calendar,
  Users,
  CheckCircle2,
  Eye,
  RefreshCw,
  Clock,
  ArrowUpRight,
  BarChart3,
  Flame,
  Sparkles,
  ShieldCheck,
  Zap,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { bg } from 'date-fns/locale';

interface DashboardProps {
  onNavigateHome: () => void;
}

type TimeFilter = '24h' | '7d' | '30d' | 'all';

export function Dashboard({ onNavigateHome }: DashboardProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('7d');
  const [feedFilter, setFeedFilter] = useState<string>('all');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchAnalyticsEvents();
      setEvents(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed loading analytics data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Real-Time Polling for Live Feed (every 2 seconds)
    const interval = setInterval(() => {
      loadData();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSeedDemo = () => {
    const seeded = seedDemoAnalyticsData();
    setEvents(seeded);
    setLastRefreshed(new Date());
  };

  const handleClear = () => {
    if (confirm('Сигурни ли сте, че искате да изчистите логовете на статистиката?')) {
      clearAnalyticsData();
      setEvents([]);
      setLastRefreshed(new Date());
    }
  };

  // Filter events based on selected time window
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const HOUR = 3600 * 1000;
    const DAY = 24 * HOUR;

    return events.filter(e => {
      const time = new Date(e.timestamp).getTime();
      if (timeFilter === '24h') return now - time <= DAY;
      if (timeFilter === '7d') return now - time <= 7 * DAY;
      if (timeFilter === '30d') return now - time <= 30 * DAY;
      return true;
    });
  }, [events, timeFilter]);

  // Key Performance Indicators
  const kpis = useMemo(() => {
    const pageViews = filteredEvents.filter(e => e.eventType === 'page_view').length;
    const sessionsCreated = filteredEvents.filter(e => e.eventType === 'session_created').length;
    const availabilitySaved = filteredEvents.filter(e => e.eventType === 'availability_saved').length;
    const slotFinalized = filteredEvents.filter(e => e.eventType === 'slot_finalized').length;

    const finalizationRate = sessionsCreated > 0 ? Math.min(100, Math.round((slotFinalized / sessionsCreated) * 100)) : 0;

    return {
      pageViews,
      sessionsCreated,
      availabilitySaved,
      slotFinalized,
      finalizationRate,
    };
  }, [filteredEvents]);

  // Live Activity Feed Filtered
  const liveFeedEvents = useMemo(() => {
    if (feedFilter === 'all') return filteredEvents;
    return filteredEvents.filter(e => e.eventType === feedFilter);
  }, [filteredEvents, feedFilter]);

  // Distribution & Activity Over Time Calculation
  const timeChartData = useMemo(() => {
    const buckets: Record<string, { label: string; views: number; actions: number }> = {};
    const is24h = timeFilter === '24h';

    // Build timeline buckets
    const count = is24h ? 12 : 7;
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      let key = '';
      let label = '';
      if (is24h) {
        const d = new Date(now.getTime() - i * 2 * 3600 * 1000);
        key = format(d, 'yyyy-MM-dd HH:00');
        label = format(d, 'HH:00');
      } else {
        const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
        key = format(d, 'yyyy-MM-dd');
        label = format(d, 'EEE, dd MMM', { locale: bg });
      }
      buckets[key] = { label, views: 0, actions: 0 };
    }

    filteredEvents.forEach(e => {
      const d = new Date(e.timestamp);
      let key = '';
      if (is24h) {
        // Group by 2-hour slots
        const hour = Math.floor(d.getHours() / 2) * 2;
        d.setHours(hour, 0, 0, 0);
        key = format(d, 'yyyy-MM-dd HH:00');
      } else {
        key = format(d, 'yyyy-MM-dd');
      }

      if (buckets[key]) {
        if (e.eventType === 'page_view') {
          buckets[key].views++;
        } else {
          buckets[key].actions++;
        }
      }
    });

    const list = Object.values(buckets);
    const maxVal = Math.max(1, ...list.map(b => b.views + b.actions));

    return { list, maxVal };
  }, [filteredEvents, timeFilter]);

  const getEventBadge = (type: AnalyticsEventType) => {
    switch (type) {
      case 'page_view':
        return { label: 'Посещение', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Eye };
      case 'session_created':
        return { label: 'Нова Сесия', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Calendar };
      case 'availability_saved':
        return { label: 'Отговор от Участник', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Users };
      case 'slot_finalized':
        return { label: 'Финализиран Час', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: CheckCircle2 };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Banner & Header Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Sync Active
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Публичен URL (Без вход)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-indigo-400" />
              Табло за Трафик и Потребление
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Реалновремеви анализи на активността, посещенията и графиците в приложението SyncMeet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Time Filter Buttons */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 p-1 rounded-2xl flex items-center text-xs font-semibold text-slate-300">
              <button
                onClick={() => setTimeFilter('24h')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeFilter === '24h' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'
                }`}
              >
                24 часа
              </button>
              <button
                onClick={() => setTimeFilter('7d')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeFilter === '7d' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'
                }`}
              >
                7 дни
              </button>
              <button
                onClick={() => setTimeFilter('30d')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeFilter === '30d' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'
                }`}
              >
                30 дни
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  timeFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'hover:text-white'
                }`}
              >
                Всички
              </button>
            </div>

            <button
              onClick={loadData}
              disabled={isRefreshing}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl transition-colors text-xs font-bold flex items-center gap-1.5"
              title="Ръчно опресняване"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Traffic */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Общ Трафик</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{kpis.pageViews}</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Посещения
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Зареждания на страници за периода</p>
        </div>

        {/* Card 2: Sessions Created */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Създадени Сесии</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{kpis.sessionsCreated}</span>
            <span className="text-xs text-emerald-600 font-bold flex items-center">
              <Sparkles className="w-3.5 h-3.5" /> Събития
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Планирания, започнати от организатори</p>
        </div>

        {/* Card 3: Participant Responses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Активни Участници</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{kpis.availabilitySaved}</span>
            <span className="text-xs text-purple-600 font-bold flex items-center">
              <Zap className="w-3.5 h-3.5" /> Отговори
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Записани наличности от потребители</p>
        </div>

        {/* Card 4: Finalization Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Успешност (Финализиране)</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{kpis.finalizationRate}%</span>
            <span className="text-xs text-amber-600 font-bold">
              ({kpis.slotFinalized} срещи)
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Процент уговорени финални часове</p>
        </div>
      </div>

      {/* Main Content Grid: Live Feed & Traffic Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LIVE FEED PANEL (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                Live Feed (Поток на живо)
              </h2>
            </div>

            {/* Filter live feed tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium text-slate-600 self-start">
              <button
                onClick={() => setFeedFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  feedFilter === 'all' ? 'bg-white font-bold text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Всички
              </button>
              <button
                onClick={() => setFeedFilter('page_view')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  feedFilter === 'page_view' ? 'bg-white font-bold text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Посещения
              </button>
              <button
                onClick={() => setFeedFilter('availability_saved')}
                className={`px-2.5 py-1 rounded-lg transition-colors ${
                  feedFilter === 'availability_saved' ? 'bg-white font-bold text-slate-900 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                Участници
              </button>
            </div>
          </div>

          {/* Feed List */}
          <div className="flex-1 overflow-y-auto max-h-[480px] space-y-3 pr-1">
            {liveFeedEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs font-semibold">Няма записани събития за избрания период.</p>
              </div>
            ) : (
              liveFeedEvents.map(event => {
                const badge = getEventBadge(event.eventType);
                const Icon = badge.icon;

                return (
                  <div
                    key={event.id}
                    className="p-3.5 bg-slate-50/70 hover:bg-slate-100/80 rounded-2xl border border-slate-200/60 transition-all flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl border ${badge.color} mt-0.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">{event.path}</span>
                        </div>
                        <p className="font-semibold text-slate-800">
                          {event.eventType === 'session_created' && (
                            <>Създадена бе нова сесия &quot;{event.metadata?.title || 'Без име'}&quot;</>
                          )}
                          {event.eventType === 'availability_saved' && (
                            <>
                              Участник <strong className="text-indigo-600">{event.metadata?.participantName || 'Гост'}</strong> добави {event.metadata?.slotsCount || 'няколко'} свободни часа
                            </>
                          )}
                          {event.eventType === 'slot_finalized' && (
                            <>Финализиран бе окончателен час за среща!</>
                          )}
                          {event.eventType === 'page_view' && (
                            <>Посещение от {event.metadata?.referrer === 'google' ? 'Google Search' : 'Директна връзка'}</>
                          )}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true, locale: bg })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* TRAFFIC & ACTIVITY CHART PANEL (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Динамика на Трафика
              </h2>
              <span className="text-xs text-slate-400">
                {timeFilter === '24h' ? 'По часови слотове' : 'По дни'}
              </span>
            </div>

            {/* Custom SVG / CSS Bar Chart */}
            <div className="space-y-2 pt-2">
              <div className="h-44 flex items-end justify-between gap-1.5 px-2 border-b border-slate-200 pb-2">
                {timeChartData.list.map((item, idx) => {
                  const total = item.views + item.actions;
                  const heightPercent = Math.max(8, Math.round((total / timeChartData.maxVal) * 100));

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip */}
                      <div className="absolute -top-10 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] py-1 px-2 rounded-md shadow-lg whitespace-nowrap z-20 pointer-events-none">
                        <span>{item.label}</span>
                        <span className="font-bold">{item.views} прегледа / {item.actions} действия</span>
                      </div>

                      {/* Bar Stack */}
                      <div className="w-full bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end transition-all hover:brightness-95" style={{ height: `${heightPercent}%` }}>
                        <div
                          className="bg-indigo-500 w-full transition-all"
                          style={{ height: `${total > 0 ? (item.views / total) * 100 : 0}%` }}
                        />
                        <div
                          className="bg-emerald-500 w-full transition-all"
                          style={{ height: `${total > 0 ? (item.actions / total) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Labels below bars */}
              <div className="flex justify-between gap-1 px-2 text-[10px] text-slate-400 font-medium overflow-hidden">
                {timeChartData.list.map((item, idx) => (
                  <span key={idx} className="flex-1 text-center truncate">
                    {item.label.split(',')[0]}
                  </span>
                ))}
              </div>
            </div>

            {/* Chart Legend */}
            <div className="flex items-center justify-center gap-6 pt-2 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-indigo-500" /> Трафик (Прегледи)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" /> Активност (Действия)
              </span>
            </div>
          </div>

          {/* Quick Tools & Demo Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
            <button
              onClick={handleSeedDemo}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl border border-indigo-200 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Генерирай Демо Данни
            </button>

            <button
              onClick={handleClear}
              className="px-3 py-2 text-slate-400 hover:text-rose-600 font-semibold rounded-xl hover:bg-rose-50 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Изчисти
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
