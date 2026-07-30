import React, { useState, useEffect, useRef } from 'react';
import { DateRangeConfig, HeatmapSlotData, Participant } from '../types';
import { generateSlotsForRange } from '../lib/dateUtils';
import { getParticipantColor } from '../lib/colors';
import { Star, Sparkles, Check, Eye, Edit3, Trash2, Zap } from 'lucide-react';

interface SelectedSlotState {
  isPreferred: boolean;
}

interface CalendarGridProps {
  dateRange: DateRangeConfig;
  heatmapMap: Record<string, HeatmapSlotData>;
  participants: Participant[];
  currentParticipantName: string;
  mySelectedSlots: Record<string, SelectedSlotState>;
  onSaveMySlots: (slots: Array<{ startSlot: string; endSlot: string; isPreferred: boolean }>) => void;
  hoveredParticipantId?: string | null;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  dateRange,
  heatmapMap,
  participants,
  currentParticipantName,
  mySelectedSlots,
  onSaveMySlots,
  hoveredParticipantId,
}) => {
  const [viewMode, setViewMode] = useState<'edit' | 'heatmap'>('edit');
  const [slotState, setSlotState] = useState<Record<string, SelectedSlotState>>(mySelectedSlots);
  const [isPreferredMode, setIsPreferredMode] = useState<boolean>(false);
  const [hoveredSlotKey, setHoveredSlotKey] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Mouse gesture drag state
  const isDragging = useRef<boolean>(false);
  const dragMode = useRef<'add' | 'remove'>('add');
  const hasModifiedState = useRef<boolean>(false);

  // Map participant IDs to their color assignments
  const participantColorMap = React.useMemo(() => {
    const map: Record<string, ReturnType<typeof getParticipantColor>> = {};
    participants.forEach((p, idx) => {
      map[p.id] = getParticipantColor(idx);
    });
    return map;
  }, [participants]);

  // Sync state when mySelectedSlots updates from parent
  useEffect(() => {
    setSlotState(mySelectedSlots);
  }, [mySelectedSlots]);

  const { dates, slotsByDate } = generateSlotsForRange(dateRange);

  // Save current slots helper
  const performSave = React.useCallback(
    (currentState: Record<string, SelectedSlotState>) => {
      if (!currentParticipantName.trim()) return;
      setSaveStatus('saving');

      const formattedSlots = Object.entries(currentState).map(([isoStart, state]) => {
        const endMs = new Date(isoStart).getTime() + 30 * 60 * 1000;
        return {
          startSlot: isoStart,
          endSlot: new Date(endMs).toISOString(),
          isPreferred: state.isPreferred,
        };
      });

      onSaveMySlots(formattedSlots);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    [currentParticipantName, onSaveMySlots]
  );

  // Mouse drag handlers
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

  // Global mouseUp event listener for instant auto-saving
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging.current && hasModifiedState.current) {
        isDragging.current = false;
        hasModifiedState.current = false;

        // Auto-save selections immediately when drag finishes!
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

  const hoveredSlotInfo = hoveredSlotKey ? heatmapMap[hoveredSlotKey] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Header controls & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Availability Grid</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-normal">
              30-min intervals
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {viewMode === 'edit'
              ? 'Drag over time slots to select. Selections auto-save on drag release!'
              : 'Heatmap overview showing distinct participant color markers.'}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'edit'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>My Selections</span>
          </button>
          <button
            onClick={() => setViewMode('heatmap')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'heatmap'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Group Heatmap ({participants.length})</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Live Auto-save indicator */}
      {viewMode === 'edit' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 font-medium">Slot Mode:</span>
            <button
              type="button"
              onClick={() => setIsPreferredMode(false)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                !isPreferredMode
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-sm bg-teal-400" />
              <span>Available</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPreferredMode(true)}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                isPreferredMode
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Preferred (Guidance)</span>
            </button>
          </div>

          <div className="flex items-center space-x-3">
            {/* Auto-save Status Indicator */}
            {currentParticipantName.trim() ? (
              <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold px-2 py-1 rounded-md bg-slate-900 border border-slate-800">
                {saveStatus === 'saving' ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    <span className="text-amber-300">Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span className="text-emerald-400">Auto-saved ✓</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-slate-400">Drag to auto-save</span>
                  </>
                )}
              </div>
            ) : (
              <span className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                Type name to save
              </span>
            )}

            <button
              onClick={handleClear}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid Canvas */}
      <div className="overflow-x-auto select-none rounded-xl border border-slate-800 bg-slate-950 p-3">
        <div
          className="grid gap-1.5 min-w-[550px]"
          style={{
            gridTemplateColumns: `70px repeat(${dates.length}, minmax(120px, 1fr))`,
          }}
        >
          {/* Top Left Header Cell */}
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-center p-2 border-b border-slate-800">
            Time
          </div>

          {/* Date Column Headers */}
          {dates.map(d => (
            <div
              key={d.dateKey}
              className="text-center py-2 px-1 border-b border-slate-800 bg-slate-900/50 rounded-t-lg"
            >
              <p className="text-xs font-bold text-slate-200">{d.dayLabel}</p>
              <p className="text-[10px] text-slate-500">{d.dateKey}</p>
            </div>
          ))}

          {/* Grid Rows per Time Slot */}
          {Object.values(slotsByDate)[0]?.map((_, timeIndex) => {
            const sampleSlot = Object.values(slotsByDate)[0][timeIndex];

            return (
              <React.Fragment key={sampleSlot.timeLabel}>
                {/* Time Label Header */}
                <div className="text-[11px] font-mono font-medium text-slate-400 flex items-center justify-end pr-2 py-1">
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
                    // Edit Mode Slot Visual with Participant color dots
                    const isSel = Boolean(myState);
                    const isPref = myState?.isPreferred;

                    return (
                      <div
                        key={iso}
                        onMouseDown={() => handleMouseDown(iso)}
                        onMouseEnter={() => handleMouseEnter(iso)}
                        className={`h-9 rounded-lg border transition-all cursor-pointer flex items-center justify-between px-2 relative ${
                          isPref
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-inner'
                            : isSel
                            ? 'bg-teal-500/30 border-teal-400 text-teal-200 shadow-inner'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/90'
                        }`}
                      >
                        {/* Selected Indicator */}
                        {isPref ? (
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-300" />
                        ) : isSel ? (
                          <div className="w-2 h-2 rounded-full bg-teal-400 shadow-sm" />
                        ) : (
                          <div />
                        )}

                        {/* Other participants who selected this slot (Colored Dots) */}
                        {slotParticipants.length > 0 && (
                          <div className="flex items-center -space-x-1 overflow-hidden">
                            {slotParticipants.map(p => {
                              const pColor = participantColorMap[p.participantId] || getParticipantColor(0);
                              return (
                                <div
                                  key={p.participantId}
                                  title={`${p.name} is available`}
                                  className={`w-2.5 h-2.5 rounded-full ${pColor.bg} ring-1 ring-slate-950`}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Heatmap Mode — Distinct Per-Participant Colored Badges & Dots on Grid!
                    const count = heat?.availableCount || 0;
                    const prefCount = heat?.preferredCount || 0;
                    const total = participants.length;
                    const ratio = total > 0 ? count / total : 0;
                    const isFullMatch = total > 0 && count === total;

                    const isHoveredParticipantInSlot =
                      hoveredParticipantId &&
                      slotParticipants.some(p => p.participantId === hoveredParticipantId);

                    let containerStyle = 'bg-slate-900/40 border-slate-800/60';

                    if (ratio > 0) {
                      if (isFullMatch) {
                        containerStyle = 'bg-gradient-to-r from-emerald-500/30 to-teal-400/30 border-emerald-400 shadow-sm';
                      } else if (ratio >= 0.5) {
                        containerStyle = 'bg-teal-500/20 border-teal-500/40';
                      } else {
                        containerStyle = 'bg-slate-900 border-slate-800';
                      }
                    }

                    if (isHoveredParticipantInSlot) {
                      containerStyle += ' ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 scale-105 z-10';
                    }

                    return (
                      <div
                        key={iso}
                        onMouseEnter={() => setHoveredSlotKey(iso)}
                        className={`h-9 rounded-lg border transition-all flex items-center justify-between px-1.5 text-xs relative ${containerStyle}`}
                      >
                        {/* Overlap fraction label */}
                        <span className={`text-[10px] font-extrabold ${isFullMatch ? 'text-emerald-300' : count > 0 ? 'text-teal-300' : 'text-slate-600'}`}>
                          {count > 0 ? `${count}/${total}` : '-'}
                        </span>

                        {/* Distinct Participant Colored Badges / Dots inside slot */}
                        {slotParticipants.length > 0 && (
                          <div className="flex items-center space-x-1 max-w-[65%] overflow-hidden">
                            {slotParticipants.map(p => {
                              const pColor = participantColorMap[p.participantId] || getParticipantColor(0);
                              return (
                                <span
                                  key={p.participantId}
                                  title={`${p.name}${p.isPreferred ? ' (Preferred)' : ''}`}
                                  className={`w-3 h-3 rounded-full ${pColor.bg} flex items-center justify-center text-[8px] font-black text-slate-950 shadow-sm ring-1 ring-slate-950 flex-shrink-0 ${
                                    p.isPreferred ? 'ring-2 ring-amber-300' : ''
                                  }`}
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

      {/* Detailed Slot Inspector */}
      {hoveredSlotInfo && viewMode === 'heatmap' && (
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs animate-fadeIn">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-300">
              {hoveredSlotInfo.dateKey} at {hoveredSlotInfo.timeLabel}:
            </span>
            <span className="text-teal-300 font-bold">
              {hoveredSlotInfo.availableCount} of {participants.length} available
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hoveredSlotInfo.participants.map(p => {
              const pColor = participantColorMap[p.participantId] || getParticipantColor(0);
              return (
                <span
                  key={p.participantId}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${pColor.badgeBg}`}
                >
                  <div className={`w-2 h-2 rounded-full ${pColor.bg}`} />
                  <span>{p.name}</span>
                  {p.isPreferred && <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
