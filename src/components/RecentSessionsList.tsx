import React, { useEffect, useState } from 'react';
import { Session } from '../types';
import { getUserSessions } from '../lib/storage';
import { Calendar, Clock, Copy, Check, ArrowRight, UserCheck, Crown, Sparkles, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface RecentSessionsListProps {
  userId: string;
  onSelectSession: (sessionId: string) => void;
  refreshTrigger?: number;
}

export const RecentSessionsList: React.FC<RecentSessionsListProps> = ({
  userId,
  onSelectSession,
  refreshTrigger = 0,
}) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      try {
        const list = await getUserSessions(userId);
        if (isMounted) {
          setSessions(list);
        }
      } catch (err) {
        console.error('Failed loading user sessions:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [userId, refreshTrigger]);

  const handleCopyLink = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDateRange = (session: Session) => {
    try {
      const start = parseISO(session.dateRange.startDate);
      const end = parseISO(session.dateRange.endDate);
      if (session.dateRange.startDate === session.dateRange.endDate) {
        return format(start, 'MMM d, yyyy');
      }
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } catch {
      return `${session.dateRange.startDate} to ${session.dateRange.endDate}`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-6 flex flex-col items-center justify-center space-y-2">
        <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading your recent sessions...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return null; // Graceful empty state when user hasn't created or joined any sessions yet
  }

  return (
    <div className="max-w-xl mx-auto py-4 px-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-600">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Your Recent Sessions</h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Last {sessions.length} session{sessions.length > 1 ? 's' : ''} created by or associated with you
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
          {sessions.length} / 10
        </span>
      </div>

      {/* Session Cards Grid */}
      <div className="space-y-2">
        {sessions.map(s => {
          const isCreator = Boolean(s.creatorUserId && s.creatorUserId === userId);
          const isFinalized = Boolean(s.finalizedSlot);

          return (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className="group bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                      {s.title}
                    </h3>

                    {/* Role Badge */}
                    {isCreator ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
                        <Crown className="w-3 h-3 text-indigo-600" />
                        <span>Creator</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>Participant</span>
                      </span>
                    )}

                    {/* Status Badge */}
                    {isFinalized ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-2xs">
                        <Sparkles className="w-3 h-3" />
                        <span>Finalized</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDateRange(s)}
                    </span>
                    <span>•</span>
                    <span>{s.dateRange.startTime} - {s.dateRange.endTime}</span>
                  </div>

                  {s.finalizedSlot && (
                    <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50/70 border border-emerald-200 rounded-lg px-2.5 py-1 inline-block">
                      🎉 Finalized for {s.finalizedSlot.displayDate} @ {s.finalizedSlot.displayTime}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    type="button"
                    onClick={e => handleCopyLink(e, s.id)}
                    title="Copy Session Link"
                    className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    {copiedId === s.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <div className="p-2 rounded-xl bg-indigo-600 group-hover:bg-indigo-700 text-white shadow-2xs group-hover:translate-x-0.5 transition-all">
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
