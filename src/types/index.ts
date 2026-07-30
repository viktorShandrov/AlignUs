export interface DateRangeConfig {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "08:00")
  endTime: string;   // HH:mm (e.g. "20:00")
}

export interface Session {
  id: string;
  title: string;
  dateRange: DateRangeConfig;
  createdAt: string;
}

export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  createdAt: string;
}

export interface Availability {
  id: string;
  participantId: string;
  startSlot: string; // ISO string timestamp
  endSlot: string;   // ISO string timestamp
  isPreferred: boolean;
}

export interface SlotParticipantInfo {
  participantId: string;
  name: string;
  isPreferred: boolean;
}

export interface HeatmapSlotData {
  startSlot: string; // ISO timestamp
  endSlot: string;   // ISO timestamp
  timeLabel: string; // e.g. "09:30"
  dateKey: string;   // e.g. "2026-08-01"
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
