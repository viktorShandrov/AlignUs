import React from 'react';
import { Participant, Availability } from '../types';
import { Users, UserCheck, Star, UserPlus } from 'lucide-react';
import { getParticipantColor } from '../lib/colors';

interface ParticipantListProps {
  participants: Participant[];
  availabilities: Availability[];
  currentName: string;
  onNameChange: (name: string) => void;
  hoveredParticipantId?: string | null;
  onHoverParticipant?: (id: string | null) => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  availabilities,
  currentName,
  onNameChange,
  hoveredParticipantId,
  onHoverParticipant,
}) => {
  // Count availabilities and preferred slots per participant
  const statsByParticipant = React.useMemo(() => {
    const stats: Record<string, { total: number; preferred: number }> = {};
    availabilities.forEach(a => {
      if (!stats[a.participantId]) {
        stats[a.participantId] = { total: 0, preferred: 0 };
      }
      stats[a.participantId].total += 1;
      if (a.isPreferred) stats[a.participantId].preferred += 1;
    });
    return stats;
  }, [availabilities]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      {/* Participant Identity Form */}
      <div className="space-y-2 pb-4 border-b border-slate-800">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <UserPlus className="w-4 h-4 text-teal-400" />
          <span>Your Participant Name</span>
        </label>
        <input
          type="text"
          value={currentName}
          onChange={e => onNameChange(e.target.value)}
          placeholder="Enter your name (e.g. Sarah, Alex)..."
          className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 text-sm transition-all outline-none font-medium"
        />
        <p className="text-[11px] text-slate-500">
          Selections auto-save on drag and sync across all connected screens!
        </p>
      </div>

      {/* Roster Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-teal-400" />
          <span>Participants ({participants.length})</span>
        </h3>
        <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          Color Coded
        </span>
      </div>

      {/* Participants List */}
      {participants.length === 0 ? (
        <div className="text-center py-6 px-4 bg-slate-950/50 rounded-xl border border-slate-800/60">
          <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-slate-400 font-medium">No responses yet</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Type your name above and drag across the calendar grid to mark your availability!
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {participants.map((p, idx) => {
            const isMe = p.name.trim().toLowerCase() === currentName.trim().toLowerCase();
            const stat = statsByParticipant[p.id] || { total: 0, preferred: 0 };
            const isHovered = hoveredParticipantId === p.id;
            const color = getParticipantColor(idx);

            return (
              <div
                key={p.id}
                onMouseEnter={() => onHoverParticipant?.(p.id)}
                onMouseLeave={() => onHoverParticipant?.(null)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isHovered
                    ? `bg-slate-900 border-2 ${color.border} shadow-md scale-[1.02]`
                    : isMe
                    ? 'bg-slate-950 border-slate-700 text-slate-100'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-8 h-8 rounded-lg ${color.bgSubtle} border ${color.border} flex items-center justify-center font-bold ${color.text} text-xs shadow-sm relative`}>
                    {p.name.charAt(0).toUpperCase()}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${color.bg} ring-2 ring-slate-950`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-100">{p.name}</span>
                      {isMe && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-teal-500 text-slate-950">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      {stat.total} slots ({stat.total * 30} mins)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${color.bg} shadow-sm`} title={`Color badge for ${p.name}`} />
                  {stat.preferred > 0 && (
                    <div className="flex items-center space-x-0.5 text-[10px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-amber-300" />
                      <span>{stat.preferred}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
