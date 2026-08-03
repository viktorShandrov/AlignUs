import React from 'react';
import { Participant, Availability } from '../types';
import { Users, UserCheck, Star, UserPlus, MessageSquare, Edit3 } from 'lucide-react';
import { getParticipantColor } from '../lib/colors';

interface ParticipantListProps {
  participants: Participant[];
  availabilities: Availability[];
  currentName: string;
  currentNote: string;
  currentUserId?: string;
  onNameChange: (name: string) => void;
  onNoteChange: (note: string) => void;
  onOpenNameModal?: () => void;
  hoveredParticipantId?: string | null;
  onHoverParticipant?: (id: string | null) => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  participants,
  availabilities,
  currentName,
  currentNote,
  currentUserId,
  onNameChange,
  onNoteChange,
  onOpenNameModal,
  hoveredParticipantId,
  onHoverParticipant,
}) => {
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
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-3">
      {/* Participant Identity & Quick Note Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2.5 border-b border-slate-100">
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-800 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
              <span>Вашето Име / Your Name</span>
            </span>
          </label>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg p-1.5 shadow-2xs">
            {currentName.trim() ? (
              <>
                <div className="w-6 h-6 rounded-md bg-indigo-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">
                  {currentName.trim().charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-black text-slate-900 truncate flex-1">
                  {currentName}
                </span>
                <button
                  type="button"
                  onClick={onOpenNameModal}
                  className="flex items-center space-x-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Промяна</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenNameModal}
                className="w-full flex items-center justify-center space-x-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-1 px-3 rounded-md transition-colors shadow-2xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Въведете Име за присъединяване</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            <span>Бележка / Note (Optional)</span>
          </label>
          <input
            type="text"
            value={currentNote}
            onChange={e => onNoteChange(e.target.value)}
            placeholder="напр. Само онлайн, Излизам по-рано..."
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white text-slate-800 placeholder-slate-400 rounded-lg px-2.5 py-1.5 text-xs outline-none shadow-2xs font-medium"
          />
        </div>
      </div>

      {/* Roster Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-bold text-slate-800 flex items-center gap-1 uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Участници в срещата ({participants.length})</span>
        </h3>
        <span className="text-[10px] text-slate-400 font-semibold">Hover to highlight</span>
      </div>

      {/* Participants List */}
      {participants.length === 0 ? (
        <div className="text-center py-3 px-2 bg-slate-50 rounded-lg border border-slate-200">
          <UserCheck className="w-5 h-5 text-slate-400 mx-auto mb-0.5 opacity-60" />
          <p className="text-[11px] text-slate-500 font-medium">
            Въведете името си и отбележете свободните часове в графика!
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1">
          {participants.map((p, idx) => {
            const isMe =
              (p.userId && currentUserId && p.userId === currentUserId) ||
              p.name.trim().toLowerCase() === currentName.trim().toLowerCase();
            const stat = statsByParticipant[p.id] || { total: 0, preferred: 0 };
            const isHovered = hoveredParticipantId === p.id;
            const color = getParticipantColor(idx);

            return (
              <div
                key={p.id}
                onMouseEnter={() => onHoverParticipant?.(p.id)}
                onMouseLeave={() => onHoverParticipant?.(null)}
                className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
                  isHovered
                    ? `bg-indigo-50 border-2 border-indigo-400 scale-[1.02]`
                    : isMe
                    ? 'bg-indigo-50/70 border-indigo-200 text-slate-900 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-md ${color.bg} flex items-center justify-center font-black text-white text-[9px] shadow-xs flex-shrink-0`}>
                  {p.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-slate-900">{p.name}</span>
                  {isMe && (
                    <span className="text-[8px] font-black uppercase px-1 rounded bg-indigo-600 text-white">
                      Вие
                    </span>
                  )}
                  {p.note && (
                    <span className="text-[10px] text-indigo-700 font-medium truncate max-w-[120px]">
                      ("{p.note}")
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">({stat.total}s)</span>
                  {stat.preferred > 0 && (
                    <span className="flex items-center text-[9px] font-bold text-amber-600">
                      <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                      {stat.preferred}
                    </span>
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
