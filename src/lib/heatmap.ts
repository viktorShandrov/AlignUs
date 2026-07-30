import { Participant, Availability, HeatmapSlotData, BestSlotWindow, SlotParticipantInfo } from '../types';
import { SlotDefinition } from './dateUtils';
import { format, parseISO } from 'date-fns';

export function computeHeatmapGrid(
  slots: SlotDefinition[],
  participants: Participant[],
  availabilities: Availability[]
): Record<string, HeatmapSlotData> {
  const heatmapMap: Record<string, HeatmapSlotData> = {};

  // Map participant availabilities by participantId for fast lookup
  const availMapByParticipant: Record<string, Availability[]> = {};
  availabilities.forEach(a => {
    if (!availMapByParticipant[a.participantId]) {
      availMapByParticipant[a.participantId] = [];
    }
    availMapByParticipant[a.participantId].push(a);
  });

  slots.forEach(slot => {
    const slotStartMs = new Date(slot.isoStart).getTime();
    const slotEndMs = new Date(slot.isoEnd).getTime();

    const activeParticipants: SlotParticipantInfo[] = [];
    let availableCount = 0;
    let preferredCount = 0;

    participants.forEach(p => {
      const pAvails = availMapByParticipant[p.id] || [];
      const match = pAvails.find(a => {
        const aStartMs = new Date(a.startSlot).getTime();
        const aEndMs = new Date(a.endSlot).getTime();
        return aStartMs <= slotStartMs && aEndMs >= slotEndMs;
      });

      if (match) {
        const isPref = match.isPreferred;
        availableCount += 1; // 1 point per available participant
        if (isPref) preferredCount += 1;

        activeParticipants.push({
          participantId: p.id,
          name: p.name,
          isPreferred: isPref,
        });
      }
    });

    // Total score is strictly the count of available participants
    heatmapMap[slot.isoStart] = {
      startSlot: slot.isoStart,
      endSlot: slot.isoEnd,
      timeLabel: slot.timeLabel,
      dateKey: slot.dateKey,
      participants: activeParticipants,
      totalScore: availableCount,
      availableCount,
      preferredCount,
    };
  });

  return heatmapMap;
}

export function findBestSlotWindows(
  slotsByDate: Record<string, SlotDefinition[]>,
  heatmapMap: Record<string, HeatmapSlotData>,
  totalParticipants: number,
  minDurationMinutes: number = 30
): BestSlotWindow[] {
  if (totalParticipants === 0) return [];

  const windows: BestSlotWindow[] = [];
  const targetSlotsCount = Math.max(1, Math.round(minDurationMinutes / 30));

  Object.entries(slotsByDate).forEach(([dateKey, slots]) => {
    if (slots.length < targetSlotsCount) return;

    for (let i = 0; i <= slots.length - targetSlotsCount; i++) {
      const subSlots = slots.slice(i, i + targetSlotsCount);
      let windowMinAvailable = totalParticipants;
      let windowPreferredSum = 0;
      const participantSet = new Set<string>();

      subSlots.forEach(s => {
        const hData = heatmapMap[s.isoStart];
        if (hData) {
          windowMinAvailable = Math.min(windowMinAvailable, hData.availableCount);
          windowPreferredSum += hData.preferredCount;
          hData.participants.forEach(p => participantSet.add(p.name));
        } else {
          windowMinAvailable = 0;
        }
      });

      const firstSlot = subSlots[0];
      const lastSlot = subSlots[subSlots.length - 1];

      const startDateObj = parseISO(firstSlot.isoStart);
      const endDateObj = parseISO(lastSlot.isoEnd);

      windows.push({
        startDate: dateKey,
        startSlot: firstSlot.isoStart,
        endSlot: lastSlot.isoEnd,
        displayDate: format(startDateObj, 'EEEE, MMM d, yyyy'),
        displayTime: `${format(startDateObj, 'h:mm a')} – ${format(endDateObj, 'h:mm a')}`,
        durationMinutes: targetSlotsCount * 30,
        totalScore: windowMinAvailable, // Based purely on attendance count
        availableCount: windowMinAvailable,
        totalParticipants,
        participantNames: Array.from(participantSet),
      });
    }
  });

  // Sort strictly by highest available participant count first
  windows.sort((a, b) => {
    if (b.availableCount !== a.availableCount) {
      return b.availableCount - a.availableCount;
    }
    return b.totalScore - a.totalScore;
  });

  return windows.slice(0, 5);
}
