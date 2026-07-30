import React, { useState } from 'react';
import { BestSlotWindow } from '../types';
import { Award, Clock, Users, Star, Copy, Check, CalendarCheck } from 'lucide-react';

interface ResultSummaryProps {
  bestWindows: BestSlotWindow[];
  totalParticipants: number;
  sessionTitle: string;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({
  bestWindows,
  totalParticipants,
  sessionTitle,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopySummary = (window: BestSlotWindow, index: number) => {
    const text = `📅 SyncMeet Meeting Recommendation: "${sessionTitle}"\n⏰ Time: ${window.displayDate} @ ${window.displayTime}\n👥 Attendance: ${window.availableCount}/${window.totalParticipants} available (${window.participantNames.join(', ')})`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  if (totalParticipants === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-400" />
          <span>Best Meeting Windows</span>
        </h3>
        <div className="text-center py-8 px-4 bg-slate-950/50 rounded-xl border border-slate-800/60">
          <CalendarCheck className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-slate-400 font-medium">Waiting for participant responses</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Top meeting recommendations will automatically calculate as participants select their time slots.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Component Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Award className="w-4 h-4 text-teal-400" />
          <span>Best Meeting Recommendations</span>
        </h3>
        <span className="text-[10px] text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full font-bold">
          Weighted Score Algorithm
        </span>
      </div>

      {bestWindows.length === 0 ? (
        <p className="text-xs text-slate-400 italic py-2">
          No overlapping availability windows found for this duration yet.
        </p>
      ) : (
        <div className="space-y-3">
          {bestWindows.map((win, idx) => {
            const isFullAttendance = win.availableCount === totalParticipants;
            const pct = Math.round((win.availableCount / totalParticipants) * 100);

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all relative overflow-hidden ${
                  idx === 0
                    ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950/40 border-teal-500/50 shadow-lg shadow-teal-500/10'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Rank Badge */}
                {idx === 0 && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-teal-500 to-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-bl-lg shadow-md">
                    Top #1 Match
                  </div>
                )}

                <div className="space-y-2">
                  <div className="pr-16">
                    <p className="text-xs font-semibold text-slate-400">{win.displayDate}</p>
                    <p className="text-base font-extrabold text-slate-100 flex items-center gap-2 mt-0.5">
                      <Clock className="w-4 h-4 text-teal-400" />
                      <span>{win.displayTime}</span>
                    </p>
                  </div>

                  {/* Attendance Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-teal-400" />
                        <span>Available:</span>
                        <strong className="text-slate-200">
                          {win.availableCount}/{totalParticipants}
                        </strong>
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          isFullAttendance ? 'text-emerald-400' : 'text-teal-300'
                        }`}
                      >
                        {pct}% Attendance
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 rounded-full ${
                          isFullAttendance
                            ? 'bg-gradient-to-r from-teal-400 to-emerald-400 shadow-sm'
                            : 'bg-teal-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Available Participants Badges & Copy Action */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex flex-wrap gap-1 max-w-[75%]">
                      {win.participantNames.map((name, pIdx) => (
                        <span
                          key={pIdx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
                        >
                          {name}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleCopySummary(win, idx)}
                      className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-all ${
                        copiedIndex === idx
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
