export interface DateRangeConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "08:00")
  endTime: string;   // HH:mm (e.g. "20:00")
}

export interface FinalizedSlot {
  startSlot: string; // ISO
  endSlot: string;   // ISO
  displayDate: string;
  displayTime: string;
  finalizedBy?: string;
}

export interface Session {
  id: string;
  title: string;
  creatorUserId?: string | null;
  dateRange: DateRangeConfig;
  finalizedSlot?: FinalizedSlot | null;
  createdAt: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  userId?: string | null;
  name: string;
  note?: string | null;
  createdAt: string;
}

export interface Availability {
  id: string;
  participantId: string;
  startSlot: string; // ISO
  endSlot: string;   // ISO
  isPreferred: boolean;
}

export interface SlotParticipantInfo {
  participantId: string;
  name: string;
  note?: string | null;
  isPreferred: boolean;
}

export interface HeatmapSlotData {
  startSlot: string;
  endSlot: string;
  timeLabel: string;
  dateKey: string;
  participants: SlotParticipantInfo[];
  totalScore: number;
  availableCount: number;
  preferredCount: number;
}

export interface BestSlotWindow {
  startDate: string;
  startSlot: string;
  endSlot: string;
  displayTime: string;
  displayDate: string;
  durationMinutes: number;
  totalScore: number;
  availableCount: number;
  totalParticipants: number;
  participantNames: string[];
}
