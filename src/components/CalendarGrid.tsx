import React, { useState, useEffect, useRef } from 'react';
import { DateRangeConfig, HeatmapSlotData, Participant, BestSlotWindow, FinalizedSlot } from '../types';
import { generateSlotsForRange } from '../lib/dateUtils';
import { getParticipantColor } from '../lib/colors';
import { getGoogleCalendarUrl } from '../lib/calendarExport';
import { Star, Sparkles, Check, Eye, Edit3, Trash2, Zap, Award, Clock, Lock, ExternalLink, Layers, X, CheckCircle2, Copy, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface SelectedSlotState {
  isPreferred?: boolean;
}

interface CalendarGridProps {
  dateRange: DateRangeConfig;
  heatmapMap: Record<string, HeatmapSlotData>;
  participants: Participant[];
  currentParticipantName: string;
  mySelectedSlots: Record<string, SelectedSlotState>;
  onSaveMySlots: (slots: Array<{ startSlot: string; endSlot: string; isPreferred?: boolean }>) => Promise<void>;
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
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all');

  const isDragging = useRef<boolean>(false);
  const dragMode = useRef<'add' | 'remove'>('add');
  const hasModifiedState = useRef<boolean>(false);
  const activeTouchSlot = useRef<string | null>(null);
  const lastSavedSlotsRef = useRef<Record<string, SelectedSlotState>>(mySelectedSlots);

  const participantColorMap = React.useMemo(() => {
    const map: Record<string, ReturnType<typeof getParticipantColor>> = {};
    participants.forEach((p, idx) => {
      map[p.id] = getParticipantColor(idx);
    });
    return map;
  }, [participants]);

  // Sync server selections only when not actively dragging, saving, or holding un-saved edits
  useEffect(() => {
    if (isDragging.current || hasModifiedState.current || saveStatus === 'saving') {
      return;
    }
    const propCount = Object.keys(mySelectedSlots).length;
    const lastSavedCount = Object.keys(lastSavedSlotsRef.current).length;

    // Guard against stale empty prop updates right after a non-empty save
    if (propCount === 0 && lastSavedCount > 0) {
      return;
    }

    setSlotState(mySelectedSlots);
    lastSavedSlotsRef.current = mySelectedSlots;
  }, [mySelectedSlots, saveStatus]);

  const { dates, slotsByDate } = generateSlotsForRange(dateRange);

  const visibleDates = React.useMemo(() => {
    if (selectedDateFilter === 'all') return dates;
    return dates.filter(d => d.dateKey === selectedDateFilter);
  }, [dates, selectedDateFilter]);

  const performSave = React.useCallback(
    async (currentState: Record<string, SelectedSlotState>) => {
      if (!currentParticipantName.trim()) return;
      setSaveStatus('saving');
      setSaveError(null);
      lastSavedSlotsRef.current = currentState;

      const formattedSlots = Object.entries(currentState).map(([isoStart]) => {
        const endMs = new Date(isoStart).getTime() + 30 * 60 * 1000;
        return {
          startSlot: isoStart,
          endSlot: new Date(endMs).toISOString(),
          isPreferred: false,
        };
      });

      try {
        await onSaveMySlots(formattedSlots);
        hasModifiedState.current = false;
        setSaveStatus('saved');
        setTimeout(() => {
          setSaveStatus(prev => (prev === 'saved' ? 'idle' : prev));
        }, 1500);
      } catch (err: any) {
        console.error('Failed saving availability:', err);
        setSaveStatus('error');
        setSaveError(err?.message || 'Възникна проблем при запазването на часовете (изтече времето за връзка).');
      }
    },
    [currentParticipantName, onSaveMySlots]
  );

  const handleMouseDown = (isoStart: string) => {
    if (viewMode !== 'edit' || finalizedSlot) return;
    isDragging.current = true;
    hasModifiedState.current = true;

    const existing = slotState[isoStart];
    dragMode.current = existing ? 'remove' : 'add';

    setSlotState(prev => {
      const nextState = { ...prev };
      if (dragMode.current === 'remove') {
        delete nextState[isoStart];
      } else {
        nextState[isoStart] = { isPreferred: false };
      }
      return nextState;
    });
  };

  const handleMouseEnter = (isoStart: string) => {
    setHoveredSlotKey(isoStart);
    if (!isDragging.current || viewMode !== 'edit' || finalizedSlot) return;

    hasModifiedState.current = true;

    setSlotState(prev => {
      const next = { ...prev };
      if (dragMode.current === 'add') {
        next[isoStart] = { isPreferred: false };
      } else {
        delete next[isoStart];
      }
      return next;
    });
  };

  const isTouchInteraction = useRef<boolean>(false);
  const slotStateRef = useRef(slotState);

  useEffect(() => {
    slotStateRef.current = slotState;
  }, [slotState]);

  const finishInteractionAndSave = React.useCallback(() => {
    if (isDragging.current && hasModifiedState.current) {
      isDragging.current = false;
      hasModifiedState.current = false;
      performSave(slotStateRef.current);
    } else {
      isDragging.current = false;
      hasModifiedState.current = false;
    }

    setTimeout(() => {
      isTouchInteraction.current = false;
    }, 300);
  }, [performSave]);

  // Touch Gesture Handling for Mobile Devices
  const handleTouchStart = (isoStart: string, e: React.TouchEvent) => {
    if (viewMode !== 'edit' || finalizedSlot) return;
    isTouchInteraction.current = true;
    activeTouchSlot.current = isoStart;
    handleMouseDown(isoStart);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || viewMode !== 'edit' || finalizedSlot) return;
    const touch = e.touches[0];
    if (!touch) return;

    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetElement) return;

    const slotEl = targetElement.closest('[data-slot-key]') as HTMLElement | null;
    if (slotEl) {
      const slotKey = slotEl.getAttribute('data-slot-key');
      if (slotKey && slotKey !== activeTouchSlot.current) {
        activeTouchSlot.current = slotKey;
        handleMouseEnter(slotKey);
      }
    }
  };

  const handleTouchEnd = () => {
    activeTouchSlot.current = null;
    finishInteractionAndSave();
  };

  useEffect(() => {
    const handleGlobalEnd = () => {
      finishInteractionAndSave();
    };

    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);
    window.addEventListener('touchcancel', handleGlobalEnd);
    return () => {
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
      window.removeEventListener('touchcancel', handleGlobalEnd);
    };
  }, [finishInteractionAndSave]);

  const handleClear = () => {
    if (finalizedSlot) return;
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

  const navigateDateFilter = (direction: 'prev' | 'next') => {
    if (selectedDateFilter === 'all') {
      if (dates.length > 0) {
        setSelectedDateFilter(direction === 'next' ? dates[0].dateKey : dates[dates.length - 1].dateKey);
      }
      return;
    }

    const currentIndex = dates.findIndex(d => d.dateKey === selectedDateFilter);
    if (currentIndex === -1) return;

    if (direction === 'prev') {
      if (currentIndex > 0) {
        setSelectedDateFilter(dates[currentIndex - 1].dateKey);
      } else {
        setSelectedDateFilter('all');
      }
    } else {
      if (currentIndex < dates.length - 1) {
        setSelectedDateFilter(dates[currentIndex + 1].dateKey);
      } else {
        setSelectedDateFilter('all');
      }
    }
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
    <div className="bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-4 shadow-sm space-y-3 max-w-full overflow-hidden">
      {/* Embedded Header Card inside the Calendar Grid Header */}
      <div className="space-y-3 pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <span>Availability Grid</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                30m
              </span>
            </h2>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 self-start sm:self-auto w-full sm:w-auto">
            <button
              onClick={() => setViewMode('edit')}
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 px-2.5 py-1.5 sm:py-1 rounded-md text-[11px] font-bold transition-all ${
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
              className={`flex-1 sm:flex-none flex items-center justify-center space-x-1 px-2.5 py-1.5 sm:py-1 rounded-md text-[11px] font-bold transition-all ${
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

        {/* Embedded Recommendation Header Card */}
        {finalizedSlot ? (
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-2 border-emerald-400 rounded-xl p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs animate-fadeIn">
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
            <div className="flex items-center space-x-1.5 flex-shrink-0 self-end sm:self-auto">
              <a
                href={getGoogleCalendarUrl(sessionTitle, finalizedSlot.startSlot, finalizedSlot.endSlot, `SyncMeet finalized meeting`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-1 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-2xs"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Google Cal</span>
              </a>
              {onFinalizeSlot && (
                <button onClick={handleUnlock} className="text-[10px] text-slate-500 underline font-semibold px-1">
                  Edit
                </button>
              )}
            </div>
          </div>
        ) : topPick && totalParticipants > 0 ? (
          <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 shadow-2xs animate-fadeIn">
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
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-1.5 flex-shrink-0">
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

              <div className="flex items-center space-x-1">
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-1 px-2 rounded-lg shadow-2xs transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Google Cal</span>
                </a>

                {onFinalizeSlot && (
                  <button
                    onClick={() => handleFinalize(topPick)}
                    className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-1 px-2 rounded-lg shadow-2xs transition-all"
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
                  <span>Picks ({bestWindows.length})</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Mobile Responsive Date Selector Bar */}
      {dates.length > 1 && (
        <div className="flex items-center justify-between gap-1.5 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => navigateDateFilter('prev')}
            className="p-1 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors flex-shrink-0"
            title="Previous Day"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center space-x-1 overflow-x-auto py-0.5 no-scrollbar scroll-smooth flex-1">
            <button
              onClick={() => setSelectedDateFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                selectedDateFilter === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Days ({dates.length})
            </button>
            {dates.map(d => (
              <button
                key={d.dateKey}
                onClick={() => setSelectedDateFilter(d.dateKey)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  selectedDateFilter === d.dateKey
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {d.dayLabel}
              </button>
            ))}
          </div>

          <button
            onClick={() => navigateDateFilter('next')}
            className="p-1 rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors flex-shrink-0"
            title="Next Day"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Toolbar & Live Auto-save indicator */}
      {viewMode === 'edit' && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs">
          <div className="flex items-center space-x-1.5">
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
              <div className="w-2 h-2 rounded-xs bg-indigo-600" />
              <span>Свободен час / Available</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {finalizedSlot ? (
              <div className="flex items-center space-x-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                <Lock className="w-3 h-3 text-amber-600 flex-shrink-0" />
                <span>Финализирана среща (изборът на часове е заключен) / Session finalized</span>
              </div>
            ) : currentParticipantName.trim() ? (
              <div className={`flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded border transition-all duration-200 ${
                saveStatus === 'saved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : saveStatus === 'error'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}>
                {saveStatus === 'saved' ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    <span>Запазено ✓</span>
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-3 h-3 text-rose-600" />
                    <span>Грешка при запазване</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 text-indigo-600" />
                    <span className="text-slate-500 hidden sm:inline">Плъзнете за избор / Drag to select</span>
                    <span className="text-slate-500 sm:hidden">Избор / Select</span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-medium">
                Въведете име за запазване
              </span>
            )}

            {!finalizedSlot && (
              <button
                onClick={handleClear}
                className="flex items-center space-x-1 text-[11px] text-slate-500 hover:text-rose-600 px-1.5 py-0.5 rounded hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Изчисти</span>
              </button>
            )}
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
            Опитай отново / Retry
          </button>
        </div>
      )}

      {/* Grid Canvas Container with Sticky Time Column and Sticky Date Headers */}
      <div 
        className="overflow-x-auto max-h-[65vh] select-none rounded-lg border border-slate-200 bg-slate-50 relative touch-pan-x touch-pan-y"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="grid gap-1 min-w-full"
          style={{
            gridTemplateColumns:
              visibleDates.length === 1
                ? '56px minmax(0, 1fr)'
                : `56px repeat(${visibleDates.length}, minmax(80px, 1fr))`,
          }}
        >
          {/* Top Left Pinned Corner Cell */}
          <div className="sticky left-0 top-0 z-30 bg-slate-100 border-b border-r border-slate-200 text-[10px] font-bold text-slate-400 flex items-center justify-center p-1 shadow-2xs">
            Time
          </div>

          {/* Date Column Headers (Sticky Top) */}
          {visibleDates.map(d => (
            <div
              key={d.dateKey}
              className="sticky top-0 z-20 text-center py-1 px-1 border-b border-slate-200 bg-white rounded-t-md shadow-2xs"
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
                {/* Time Label Header (Sticky Left) */}
                <div className="sticky left-0 z-20 bg-slate-100/95 backdrop-blur-xs border-r border-slate-200 text-[10px] font-mono font-bold text-slate-500 flex items-center justify-end pr-1.5 py-0.5 shadow-2xs">
                  {sampleSlot.timeLabel}
                </div>

                {/* Day Slots */}
                {visibleDates.map(d => {
                  const slot = slotsByDate[d.dateKey]?.[timeIndex];
                  if (!slot) return <div key={d.dateKey} />;

                  const iso = slot.isoStart;
                  const myState = slotState[iso];
                  const heat = heatmapMap[iso];
                  const slotParticipants = heat?.participants || [];

                  if (viewMode === 'edit') {
                    const isSel = Boolean(myState);
                    const isLocked = Boolean(finalizedSlot);

                    return (
                      <div
                        key={iso}
                        data-slot-key={iso}
                        onMouseDown={() => {
                          if (isTouchInteraction.current || isLocked) return;
                          handleMouseDown(iso);
                        }}
                        onMouseEnter={() => handleMouseEnter(iso)}
                        onTouchStart={e => handleTouchStart(iso, e)}
                        className={`h-8 rounded-md border transition-all duration-150 ease-out flex items-center justify-between px-1.5 relative select-none ${
                          isLocked
                            ? 'cursor-not-allowed opacity-80 ' + (isSel ? 'bg-indigo-100/70 border-indigo-300 text-indigo-900' : 'bg-slate-100/50 border-slate-200')
                            : isSel
                            ? 'cursor-pointer bg-indigo-100 border-indigo-500 text-indigo-900 shadow-2xs font-bold'
                            : 'cursor-pointer bg-white border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSel ? (
                          <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-xs" />
                        ) : (
                          <div />
                        )}

                        {/* Overlapping Avatar Stack */}
                        {slotParticipants.length > 0 && (
                          <div className="flex items-center -space-x-1.5 overflow-hidden">
                            {slotParticipants.map(p => {
                              const pColor = participantColorMap[p.participantId] || getParticipantColor(0);
                              return (
                                <span
                                  key={p.participantId}
                                  title={p.name}
                                  className={`w-4 h-4 rounded-full ${pColor.bg} flex items-center justify-center text-[8px] font-black text-white shadow-xs ring-1 ring-white flex-shrink-0 relative`}
                                >
                                  {p.name.charAt(0).toUpperCase()}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Heatmap View Mode — Overlapping Avatar Stack
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
                        data-slot-key={iso}
                        onMouseEnter={() => setHoveredSlotKey(iso)}
                        className={`h-8 rounded-md border transition-all flex items-center justify-between px-1.5 text-xs relative ${containerStyle}`}
                      >
                        <span className={`text-[10px] font-black ${isFullMatch ? 'text-emerald-900' : count > 0 ? 'text-indigo-900' : 'text-slate-400'}`}>
                          {count > 0 ? `${count}/${totalParticipants}` : '-'}
                        </span>

                        {/* Overlapping Avatar Stack */}
                        {slotParticipants.length > 0 && (
                          <div className="flex items-center -space-x-1.5 max-w-[75%] overflow-hidden">
                            {slotParticipants.map(p => {
                              const pColor = participantColorMap[p.participantId] || getParticipantColor(0);
                              return (
                                <span
                                  key={p.participantId}
                                  title={p.name}
                                  className={`w-4 h-4 rounded-full ${pColor.bg} flex items-center justify-center text-[8px] font-black text-white shadow-xs ring-1 ring-white flex-shrink-0 relative`}
                                >
                                  {p.name.charAt(0).toUpperCase()}
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
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranked Top Picks Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-shrink-0">
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
            <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs flex-shrink-0">
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
                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto pr-1 flex-1">
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
