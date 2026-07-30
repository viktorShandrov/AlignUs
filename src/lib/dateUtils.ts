import { addMinutes, format, parse, parseISO, isAfter, isBefore, isEqual, eachDayOfInterval } from 'date-fns';
import { DateRangeConfig } from '../types';

export interface SlotDefinition {
  isoStart: string;
  isoEnd: string;
  dateKey: string;     // YYYY-MM-DD
  dayLabel: string;    // e.g. "Mon, Aug 3"
  timeLabel: string;   // e.g. "09:30"
  displayTime: string; // e.g. "9:30 AM"
}

export function generateSlotsForRange(config: DateRangeConfig): {
  dates: Array<{ dateKey: string; dayLabel: string }>;
  timeLabels: string[];
  slotsByDate: Record<string, SlotDefinition[]>;
  allSlots: SlotDefinition[];
} {
  const start = parseISO(config.startDate);
  const end = parseISO(config.endDate);

  const days = eachDayOfInterval({ start, end });

  const dates = days.map(d => ({
    dateKey: format(d, 'yyyy-MM-dd'),
    dayLabel: format(d, 'EEE, MMM d'),
  }));

  const slotsByDate: Record<string, SlotDefinition[]> = {};
  const timeLabelsSet = new Set<string>();
  const allSlots: SlotDefinition[] = [];

  days.forEach(day => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const dayLabel = format(day, 'EEE, MMM d');
    slotsByDate[dateKey] = [];

    // Parse start and end time on this specific day
    const [startH, startM] = config.startTime.split(':').map(Number);
    const [endH, endM] = config.endTime.split(':').map(Number);

    let currentTime = new Date(day);
    currentTime.setHours(startH, startM, 0, 0);

    const endTime = new Date(day);
    endTime.setHours(endH, endM, 0, 0);

    while (currentTime < endTime) {
      const nextTime = addMinutes(currentTime, 30);
      const timeLabel = format(currentTime, 'HH:mm');
      const displayTime = format(currentTime, 'h:mm a');

      timeLabelsSet.add(timeLabel);

      const slot: SlotDefinition = {
        isoStart: currentTime.toISOString(),
        isoEnd: nextTime.toISOString(),
        dateKey,
        dayLabel,
        timeLabel,
        displayTime,
      };

      slotsByDate[dateKey].push(slot);
      allSlots.push(slot);

      currentTime = nextTime;
    }
  });

  return {
    dates,
    timeLabels: Array.from(timeLabelsSet).sort(),
    slotsByDate,
    allSlots,
  };
}

export function isTimeInSlot(targetIso: string, slotIsoStart: string, slotIsoEnd: string): boolean {
  const t = parseISO(targetIso);
  const sStart = parseISO(slotIsoStart);
  const sEnd = parseISO(slotIsoEnd);
  return (isEqual(t, sStart) || isAfter(t, sStart)) && isBefore(t, sEnd);
}
