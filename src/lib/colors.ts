export interface ParticipantColor {
  name: string;
  bg: string;
  bgSubtle: string;
  border: string;
  text: string;
  dot: string;
  ring: string;
  badgeBg: string;
}

export const PARTICIPANT_PALETTE: ParticipantColor[] = [
  {
    name: 'Teal',
    bg: 'bg-teal-500',
    bgSubtle: 'bg-teal-500/20',
    border: 'border-teal-400',
    text: 'text-teal-300',
    dot: 'bg-teal-400',
    ring: 'ring-teal-400',
    badgeBg: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
  },
  {
    name: 'Purple',
    bg: 'bg-purple-500',
    bgSubtle: 'bg-purple-500/20',
    border: 'border-purple-400',
    text: 'text-purple-300',
    dot: 'bg-purple-400',
    ring: 'ring-purple-400',
    badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  },
  {
    name: 'Rose',
    bg: 'bg-rose-500',
    bgSubtle: 'bg-rose-500/20',
    border: 'border-rose-400',
    text: 'text-rose-300',
    dot: 'bg-rose-400',
    ring: 'ring-rose-400',
    badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  },
  {
    name: 'Amber',
    bg: 'bg-amber-500',
    bgSubtle: 'bg-amber-500/20',
    border: 'border-amber-400',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
    ring: 'ring-amber-400',
    badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  },
  {
    name: 'Emerald',
    bg: 'bg-emerald-500',
    bgSubtle: 'bg-emerald-500/20',
    border: 'border-emerald-400',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-400',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  },
  {
    name: 'Indigo',
    bg: 'bg-indigo-500',
    bgSubtle: 'bg-indigo-500/20',
    border: 'border-indigo-400',
    text: 'text-indigo-300',
    dot: 'bg-indigo-400',
    ring: 'ring-indigo-400',
    badgeBg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  },
  {
    name: 'Cyan',
    bg: 'bg-cyan-500',
    bgSubtle: 'bg-cyan-500/20',
    border: 'border-cyan-400',
    text: 'text-cyan-300',
    dot: 'bg-cyan-400',
    ring: 'ring-cyan-400',
    badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  },
  {
    name: 'Orange',
    bg: 'bg-orange-500',
    bgSubtle: 'bg-orange-500/20',
    border: 'border-orange-400',
    text: 'text-orange-300',
    dot: 'bg-orange-400',
    ring: 'ring-orange-400',
    badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  },
];

export function getParticipantColor(index: number): ParticipantColor {
  return PARTICIPANT_PALETTE[index % PARTICIPANT_PALETTE.length];
}
