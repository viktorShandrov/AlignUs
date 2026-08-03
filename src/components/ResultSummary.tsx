import React, { useState } from 'react';
import { BestSlotWindow, FinalizedSlot } from '../types';
import { getGoogleCalendarUrl, downloadIcalFile } from '../lib/calendarExport';
import { Award, Clock, Users, Copy, Check, Calendar, CheckCircle2, Lock, ExternalLink, Download, Layers, X } from 'lucide-react';

interface ResultSummaryProps {
  bestWindows: BestSlotWindow[];
  totalParticipants: number;
  sessionTitle: string;
  selectedDuration: number;
  onDurationChange: (durationMinutes: number) => void;
  finalizedSlot?: FinalizedSlot | null;
  onFinalizeSlot?: (slot: FinalizedSlot | null) => void;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({
  bestWindows,
  totalParticipants,
  sessionTitle,
  selectedDuration,
  onDurationChange,
  finalizedSlot,
  onFinalizeSlot,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopySummary = (window: BestSlotWindow, index: number) => {
    const text = `📅 AlignUs Meeting Recommendation: "${sessionTitle}"\n⏰ Time: ${window.displayDate} @ ${window.displayTime}\n👥 Attendance: ${window.availableCount}/${window.totalParticipants} available (${window.participantNames.join(', ')})`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleFinalize = (window: BestSlotWindow) => {
    if (!onFinalizeSlot) return;
    const finalSlot: FinalizedSlot = {
      startSlot: window.startSlot,
      endSlot: window.endSlot,
      displayDate: window.displayDate,
      displayTime: window.displayTime,
    };
    onFinalizeSlot(finalSlot);
    setIsModalOpen(false);
  };

  const handleUnlock = () => {
    if (onFinalizeSlot) onFinalizeSlot(null);
  };

  if (totalParticipants === 0 && !finalizedSlot) {
    return null;
  }

  // Finalized State Floating Dock
  if (finalizedSlot) {
    const googleUrl = getGoogleCalendarUrl(
      sessionTitle,
      finalizedSlot.startSlot,
      finalizedSlot.endSlot,
      `AlignUs finalized meeting session.`
    );

    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-3 animate-fadeIn">
        <div className="bg-white/95 backdrop-blur-md border-2 border-emerald-500 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                Meeting Finalized! 🎉
              </span>
              <p className="text-xs font-black text-slate-900 truncate">
                {finalizedSlot.displayDate} @ {finalizedSlot.displayTime}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 flex-shrink-0">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-xs transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Cal</span>
            </a>

            <button
              onClick={() =>
                downloadIcalFile(sessionTitle, finalizedSlot.startSlot, finalizedSlot.endSlot)
              }
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
              title="Download .ics"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {onFinalizeSlot && (
              <button
                onClick={handleUnlock}
                className="text-[10px] text-slate-400 hover:text-slate-700 underline font-semibold px-1"
              >
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const topPick = bestWindows[0];
  if (!topPick) return null;

  const isFullAttendance = topPick.availableCount === totalParticipants;
  const pct = Math.round((topPick.availableCount / totalParticipants) * 100);
  const googleUrl = getGoogleCalendarUrl(
    sessionTitle,
    topPick.startSlot,
    topPick.endSlot,
    `Attendees (${topPick.availableCount}/${topPick.totalParticipants}): ${topPick.participantNames.join(', ')}`
  );

  return (
    <>
      {/* Floating Bottom Dock */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-3 animate-fadeIn">
        <div className="bg-slate-900/95 text-white backdrop-blur-md border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl flex items-center justify-between gap-2">
          {/* Top Pick Summary */}
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-md">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-500/30">
                  #1 Top Pick
                </span>
                <span className={`text-[10px] font-bold ${isFullAttendance ? 'text-emerald-400' : 'text-teal-300'}`}>
                  {topPick.availableCount}/{totalParticipants} ({pct}%)
                </span>
              </div>
              <p className="text-xs font-black text-slate-100 truncate">
                {topPick.displayDate} @ {topPick.displayTime}
              </p>
            </div>
          </div>

          {/* Controls & Explicit Expand Button */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {/* Duration Selector Tabs */}
            <div className="hidden sm:flex items-center space-x-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              {[30, 60, 90, 120].map(mins => (
                <button
                  key={mins}
                  onClick={() => onDurationChange(mins)}
                  className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded ${
                    selectedDuration === mins
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                </button>
              ))}
            </div>

            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-1.5 px-3 rounded-xl shadow-md transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google Cal</span>
            </a>

            {onFinalizeSlot && (
              <button
                onClick={() => handleFinalize(topPick)}
                className="flex items-center space-x-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-1.5 px-3 rounded-xl shadow-md transition-all"
              >
                <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Finalize</span>
              </button>
            )}

            {/* Explicit View All Top Picks Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-colors shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>More Picks ({bestWindows.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Modal for Detailed Top Picks */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 max-w-lg w-full shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Ranked Top Meeting Picks</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Duration Selector Tabs in Modal */}
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-600">Meeting Duration:</span>
              <div className="flex items-center space-x-1">
                {[30, 60, 90, 120].map(mins => (
                  <button
                    key={mins}
                    onClick={() => onDurationChange(mins)}
                    className={`px-2 py-1 text-xs font-extrabold rounded-lg ${
                      selectedDuration === mins
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    {mins < 60 ? `${mins} mins` : `${mins / 60} hrs`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {bestWindows.map((win, idx) => {
                const altPct = Math.round((win.availableCount / totalParticipants) * 100);
                const altGoogleUrl = getGoogleCalendarUrl(
                  sessionTitle,
                  win.startSlot,
                  win.endSlot,
                  `Attendees (${win.availableCount}/${win.totalParticipants}): ${win.participantNames.join(', ')}`
                );

                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                      idx === 0
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-2xs'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black uppercase px-2 py-0.5 rounded bg-indigo-600 text-white">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-500">{win.displayDate}</span>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-700">
                        {win.availableCount}/{totalParticipants} ({altPct}%)
                      </span>
                    </div>

                    <p className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <span>{win.displayTime} ({win.durationMinutes}m)</span>
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center space-x-1.5">
                        <a
                          href={altGoogleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Google Cal</span>
                        </a>

                        <button
                          onClick={() => handleCopySummary(win, idx)}
                          className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                          title="Copy summary"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {onFinalizeSlot && (
                        <button
                          onClick={() => handleFinalize(win)}
                          className="flex items-center space-x-1 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-1.5 rounded-xl shadow-2xs transition-all active:scale-95"
                        >
                          <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Finalize</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
