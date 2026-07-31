import React, { useState, useEffect, useRef } from 'react';
import { DateRangeConfig, HeatmapSlotData, Participant, BestSlotWindow, FinalizedSlot } from '../types';
import { generateSlotsForRange } from '../lib/dateUtils';
import { getParticipantColor } from '../lib/colors';
import { getGoogleCalendarUrl, downloadIcalFile } from '../lib/calendarExport';
import { Star, Sparkles, Check, Eye, Edit3, Trash2, Zap, Award, Clock, Users, Lock, ExternalLink, Download, Layers, X, CheckCircle2, Copy, Loader2, AlertCircle } from 'lucide-react';

interface SelectedSlotState {
  isPreferred: boolean;
}

interface CalendarGridProps {
  dateRange: DateRangeConfig;
  heatmapMap: Record<string, HeatmapSlotData>;
  participants: Participant[];
  currentParticipantName: string;
  mySelectedSlots: Record<string, SelectedSlotState>;
  onSaveMySlots: (slots: Array<{ startSlot: string; endSlot: string; isPreferred: boolean }>) => Promise<void>;
  hoveredParticipantId?: string | null;
  sessionTitle: string;
  bestWindows: BestSlotWindow[];
  selectedDuration: number;
  onDurationChange: (durationMinutes: number) => void;
  finalizedSlot?: FinalizedSlot | null;
  onFinalizeSlot?: (slot: FinalizedSlot | null) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  dateRange,
  heatmapMap,
  participants,
  currentParticipantName,
  mySelectedSlots,
  onSaveMySlots,
  hoveredParticipantId,
  sessionTitle,
  bestWindows,
  selectedDuration,
  onDurationChange,
  finalizedSlot,
  onFinalizeSlot,
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'heatmap'>('edit');
  const [slotState, setSlotState] = useState<Record<string, SelectedSlotState>>(mySelectedSlots);
  const [isPreferredMode, setIsPreferredMode] = useState<boolean>(false);
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isDragging = useRef<boolean>(false);
  const dragMode = useRef<'add' | 'remove'>('add');
  const hasModifiedState = useRef<boolean>(false);

  const participantColorMap = React.useMemo(() => {
    const map: Record<string, ReturnType<typeof getParticipantColor>> = {};
    participants.forEach((p, idx) => {
      map[p.id] = getParticipantColor(idx);
    });
    return map;
  }, [participants]);

  // Sync server selections only when not actively dragging or waiting on a pending save
  useEffect(() => {
    if (saveStatus === 'idle' && !isDragging.current && !hasModifiedState.current) {
      setSlotState(mySelectedSlots);
    }
  }, [mySelectedSlots, saveStatus]);

  const { dates, slotsByDate } = generateSlotsForRange(dateRange);

  const performSave = React.useCallback(
    async (currentState: Record<string, SelectedSlotState>) => {
      if (!currentParticipantName.trim()) return;
      setSaveStatus('saving');
      setSaveError(null);

      const formattedSlots = Object.entries(currentState).map(([isoStart, state]) => {
        const endMs = new Date(isoStart).getTime() + 30 * 60 * 1000;
        return {
          startSlot: isoStart,
          endSlot: new Date(endMs).toISOString(),
          isPreferred: state.isPreferred,
        };
      });

      try {
        await onSaveMySlots(formattedSlots);
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
        }, 2000);
      } catch (err: any) {
        console.error('Failed saving availability:', err);
        setSaveStatus('error');
        setSaveError(err?.message || 'Failed to save selections to server. Please try again.');
      }
    },
    [currentParticipantName, onSaveMySlots]
  );

  const handleMouseDown = (isoStart: string) => {
    if (viewMode !== 'edit') return;
    isDragging.current = true;
    hasModifiedState.current = true;

    const existing = slotState[isoStart];
    let nextState: Record<string, SelectedSlotState> = {};

    if (isPreferredMode) {
      dragMode.current = existing?.isPreferred ? 'remove' : 'add';
      setSlotState(prev => {
        nextState = { ...prev };
        if (existing?.isPreferred) {
          nextState[isoStart] = { isPreferred: false };
        } else {
          nextState[isoStart] = { isPreferred: true };
        }
        return nextState;
      });
    } else {
      dragMode.current = existing ? 'remove' : 'add';
      setSlotState(prev => {
        nextState = { ...prev };
        if (dragMode.current === 'remove') {
          delete nextState[isoStart];
        } else {
          nextState[isoStart] = { isPreferred: false };
        }
        return nextState;
      });
    }
  };

  const handleMouseEnter = (isoStart: string) => {
    setHoveredSlotKey(isoStart);
    if (!isDragging.current || viewMode !== 'edit') return;

    hasModifiedState.current = true;

    setSlotState(prev => {
      const next = { ...prev };
      if (isPreferredMode) {
        if (dragMode.current === 'add') {
          next[isoStart] = { isPreferred: true };
        } else {
          if (next[isoStart]) next[isoStart] = { isPreferred: false };
        }
      } else {
        if (dragMode.current === 'add') {
          next[isoStart] = { isPreferred: false };
        } else {
          delete next[isoStart];
        }
      }
      return next;
    });
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging.current && hasModifiedState.current) {
        isDragging.current = false;
        hasModifiedState.current = false;

        setSlotState(latest => {
          performSave(latest);
          return latest;
        });
      } else {
        isDragging.current = false;
        hasModifiedState.current = false;
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [performSave]);

  const handleClear = () => {
    const emptyState = {};
    setSlotState(emptyState);
    performSave(emptyState);
  };

  const handleCopySummary = (window: BestSlotWindow, index: number) => {
    const text = `📅 SyncMeet Meeting Recommendation: "${sessionTitle}"\n⏰ Time: ${window.displayDate} @ ${window.displayTime}\n👥 Attendance: ${window.availableCount}/${participants.length} available (${window.participantNames.join(', ')})`;
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

  const topPick = bestWindows[0];
  const totalParticipants = participants.length;
  const isFullAttendance = topPick ? topPick.availableCount === totalParticipants : false;
  const pct = topPick && totalParticipants > 0 ? Math.round((topPick.availableCount / totalParticipants) * 100) : 0;
  const googleUrl = topPick
    ? getGoogleCalendarUrl(
        sessionTitle,
        topPick.startSlot,
        topPick.endSlot,
        `Attendees (${topPick.availableCount}/${totalParticipants}): ${topPick.participantNames.join(', ')}`
      )
    : '';

  const hoveredSlotInfo = hoveredSlotKey ? heatmapMap[hoveredSlotKey] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3">
      {/* Option B: Embedded Header Card inside the Calendar Grid Header */}
      <div className="space-y-3 pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <span>Availability Grid</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
              30m
            </span>
          </h2>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                viewMode === 'edit'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>My Selections</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Group Heatmap ({totalParticipants})</span>
            </button>
          </div>
        </div>

        {/* Option B Embedded Top Recommendation Header Card */}
        {finalizedSlot ? (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-400 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-2xs animate-fadeIn">
            <div className="flex items-center space-x-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                  Meeting Finalized! 🎉
                </span>
                <p className="text-xs font-black text-slate-900 truncate">
                  {finalizedSlot.displayDate} @ {finalizedSlot.displayTime}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              <a
                href={getGoogleCalendarUrl(sessionTitle, finalizedSlot.startSlot, finalizedSlot.endSlot, `SyncMeet finalized meeting`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Google Cal</span>
              </a>
              {onFinalizeSlot && (
                <button onClick={handleUnlock} className="text-[10px] text-slate-500 underline font-semibold">
                  Edit
                </button>
              )}
            </div>
          </div>
        ) : topPick && totalParticipants > 0 ? (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs animate-fadeIn">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-2xs">
                <Award className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-600 text-white px-1.5 py-0.2 rounded">
                    Top Pick
                  </span>
                  <span className={`text-[10px] font-extrabold ${isFullAttendance ? 'text-emerald-700' : 'text-indigo-800'}`}>
                    {topPick.availableCount}/{totalParticipants} available ({pct}%)
                  </span>
                </div>
                <p className="text-xs font-black text-slate-900 truncate">
                  {topPick.displayDate} @ {topPick.displayTime}
                </p>
              </div>
            </div>

            {/* Embedded Action Controls */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
              {/* Duration Switcher */}
              <div className="flex items-center space-x-0.5 bg-white p-0.5 rounded-md border border-slate-200">
                {[30, 60, 90, 120].map(mins => (
                  <button
                    key={mins}
                    onClick={() => onDurationChange(mins)}
                    className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded ${
                      selectedDuration === mins
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
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
                className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1 px-2.5 rounded-lg shadow-2xs transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Google Cal</span>
              </a>

              {onFinalizeSlot && (
                <button
                  onClick={() => handleFinalize(topPick)}
                  className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-1 px-2.5 rounded-lg shadow-2xs transition-all"
                >
                  <Lock className="w-3 h-3 stroke-[2.5]" />
                  <span>Finalize</span>
                </button>
              )}

              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors shadow-2xs"
              >
                <Layers className="w-3 h-3 text-indigo-600" />
                <span>More Picks ({bestWindows.length})</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Toolbar & Live Auto-save indicator */}
      {viewMode === 'edit' && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-slate-500 font-semibold">Mode:</span>
            <button
              type="button"
              onClick={() => setIsPreferredMode(false)}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                !isPreferredMode
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="w-2 h-2 rounded-xs bg-indigo-600" />
              <span>Available</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPreferredMode(true)}
              className={`flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                isPreferredMode
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>Preferred ⭐</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {currentParticipantName.trim() ? (
              <div className={`flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded border transition-all ${
                saveStatus === 'saving'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : saveStatus === 'saved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : saveStatus === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}>
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    <span>Auto-saved ✓</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Save failed</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-indigo-600" />
                    <span className="text-slate-500">Drag to select</span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                Type name to save
              </span>
            )}

            <button
              onClick={handleClear}
              className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-rose-600 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Save Error Banner with Retry */}
      {saveStatus === 'error' && saveError && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-center justify-between text-xs text-rose-800 animate-fade-in shadow-2xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{saveError}</span>
          </div>
          <button
            onClick={() => performSave(slotState)}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2.5 py-1 rounded-md text-[11px] transition-colors shadow-2xs"
          >
            Retry Save
          </button>
        </div>
      )}

      {/* Grid Canvas */}
      <div className="overflow-x-auto select-none rounded-lg border border-slate-200 bg-slate-50 p-2">
        <div
          className="grid gap-1 min-w-[500px]"
          style={{
            gridTemplateColumns: `60px repeat(${dates.length}, minmax(100px, 1fr))`,
          }}
        >
          {/* Top Left Header Cell */}
          <div className="text-[11px] font-bold text-slate-400 flex items-center justify-center p-1 border-b border-slate-200">
            Time
          </div>

          {/* Date Column Headers */}
          {dates.map(d => (
            <div
              key={d.dateKey}
              className="text-center py-1 px-1 border-b border-slate-200 bg-white rounded-t-md shadow-2xs"
            >
              <p className="text-[11px] font-black text-slate-900">{d.dayLabel}</p>
              <p className="text-[9px] text-slate-400 font-semibold">{d.dateKey}</p>
            </div>
          ))}

          {/* Grid Rows per Time Slot */}
          {Object.values(slotsByDate)[0]?.map((_, timeIndex) => {
            const sampleSlot = Object.values(slotsByDate)[0][timeIndex];

            return (
              <React.Fragment key={sampleSlot.timeLabel}>
                {/* Time Label Header */}
                <div className="text-[10px] font-mono font-bold text-slate-500 flex items-center justify-end pr-1.5 py-0.5">
                  {sampleSlot.timeLabel}
                </div>

                {/* Day Slots */}
                {dates.map(d => {
                  const slot = slotsByDate[d.dateKey]?.[timeIndex];
                  if (!slot) return <div key={d.dateKey} />;

                  const iso = slot.isoStart;
                  const myState = slotState[iso];
                  const heat = heatmapMap[iso];
                  const slotParticipants = heat?.participants || [];

                  if (viewMode === 'edit') {
                    const isSel = Boolean(myState);
                    const isPref = myState?.isPreferred;

                    return (
                      <div
                        key={iso}
                        onMouseDown={() => handleMouseDown(iso)}
                        onMouseEnter={() => handleMouseEnter(iso)}
                        className={`h-8 rounded-md border transition-all cursor-pointer flex items-center justify-between px-1.5 relative ${
                          isPref
                            ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-2xs font-bold'
                            : isSel
                            ? 'bg-indigo-100 border-indigo-500 text-indigo-900 shadow-2xs font-bold'
                            : 'bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isPref ? (
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        ) : isSel ? (
                          <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-xs" />
                        ) : (
                          <div />
                        )}

                        {/* Variant C: Overlapping Avatar Stack */}
                        {slotParticipants.length > 0 && (
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {slotParticipants.map(p => {
                              const pColor = participantColorMap[p.participantId] || getParticipantColor(0);
                              return (
                                <span
                                  key={p.participantId}
                                  title={`${p.name}${p.isPreferred ? ' ⭐ (Preferred)' : ''}`}
                                  className={`w-4 h-4 rounded-full ${pColor.bg} flex items-center justify-center text-[8px] font-black text-white shadow-xs ring-1 ring-white flex-shrink-0 relative ${
                                    p.isPreferred ? 'ring-2 ring-amber-400' : ''
                                  }`}
                                >
                                  {p.name.charAt(0).toUpperCase()}
                                  {p.isPreferred && (
                                    <span className="absolute -top-1 -right-0.5 text-[8px] text-amber-400 font-black">
                                      ★
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Heatmap View Mode — Variant C: Overlapping Avatar Stack (Apple Style)
                    const count = heat?.availableCount || 0;
                    const ratio = totalParticipants > 0 ? count / totalParticipants : 0;
                    const isFullMatch = totalParticipants > 0 && count === totalParticipants;

                    const isHoveredParticipantInSlot =
                      hoveredParticipantId &&
                      slotParticipants.some(p => p.participantId === hoveredParticipantId);

                    let containerStyle = 'bg-white border-slate-200';

                    if (ratio > 0) {
                      if (isFullMatch) {
                        containerStyle = 'bg-emerald-100 border-emerald-400 shadow-2xs';
                      } else if (ratio >= 0.5) {
                        containerStyle = 'bg-indigo-50 border-indigo-300';
                      } else {
                        containerStyle = 'bg-slate-50 border-slate-200';
                      }
                    }

                    if (isHoveredParticipantInSlot) {
                      containerStyle += ' ring-2 ring-indigo-600 ring-offset-1 ring-offset-white scale-105 z-10';
                    }

                    return (
                      <div
                        key={iso}
                        onMouseEnter={() => setHoveredSlotKey(iso)}
                        className={`h-8 rounded-md border transition-all flex items-center justify-between px-1.5 text-xs relative ${containerStyle}`}
                      >
                        <span className={`text-[10px] font-black ${isFullMatch ? 'text-emerald-900' : count > 0 ? 'text-indigo-900' : 'text-slate-400'}`}>
                          {count > 0 ? `${count}/${totalParticipants}` : '-'}
                        </span>

                        {/* Variant C: Overlapping Avatar Stack */}
                        {slotParticipants.length > 0 && (
                          <div className="flex items-center -space-x-1.5 max-w-[75%] overflow-hidden">
                            {slotParticipants.map(p => {
                              const pColor = participantColorMap[p.participantId] || getParticipantColor(0);
                              return (
                                <span
                                  key={p.participantId}
                                  title={`${p.name}${p.isPreferred ? ' ⭐ (Preferred)' : ''}`}
                                  className={`w-4 h-4 rounded-full ${pColor.bg} flex items-center justify-center text-[8px] font-black text-white shadow-xs ring-1 ring-white flex-shrink-0 relative ${
                                    p.isPreferred ? 'ring-2 ring-amber-400' : ''
                                  }`}
                                >
                                  {p.name.charAt(0).toUpperCase()}
                                  {p.isPreferred && (
                                    <span className="absolute -top-1 -right-0.5 text-[8px] text-amber-400 font-black">
                                      ★
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Hover Info Inspector */}
      {hoveredSlotInfo && viewMode === 'heatmap' && (
        <div className="bg-slate-900 text-white p-2.5 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs animate-fadeIn shadow-xs">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold text-slate-300">
              {hoveredSlotInfo.dateKey} at {hoveredSlotInfo.timeLabel}:
            </span>
            <span className="text-emerald-400 font-bold">
              {hoveredSlotInfo.availableCount} of {participants.length} available
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {hoveredSlotInfo.participants.map(p => {
              const pColor = participantColorMap[p.participantId] || getParticipantColor(0);
              return (
                <span
                  key={p.participantId}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 bg-slate-800 text-slate-200 border border-slate-700`}
                >
                  <div className={`w-2 h-2 rounded-full ${pColor.bg}`} />
                  <span>{p.name}</span>
                  {p.isPreferred && <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Option B: Ranked Top Picks Modal */}
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
                  `Attendees (${win.availableCount}/${totalParticipants}): ${win.participantNames.join(', ')}`
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
    </div>
  );
};
