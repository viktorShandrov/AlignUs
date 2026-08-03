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

  const getWindowsForDuration = (durationMins: number): BestSlotWindow[] => {
    const windows: BestSlotWindow[] = [];
    const targetSlotsCount = Math.max(1, Math.round(durationMins / 30));

    Object.entries(slotsByDate).forEach(([dateKey, slots]) => {
      if (slots.length < targetSlotsCount) return;

      for (let i = 0; i <= slots.length - targetSlotsCount; i++) {
        const subSlots = slots.slice(i, i + targetSlotsCount);
        let windowMinAvailable = totalParticipants;
        let windowPreferredSum = 0;
        let totalSlotVotes = 0;
        const participantSet = new Set<string>();

        subSlots.forEach(s => {
          const hData = heatmapMap[s.isoStart];
          if (hData) {
            windowMinAvailable = Math.min(windowMinAvailable, hData.availableCount);
            windowPreferredSum += hData.preferredCount;
            totalSlotVotes += hData.availableCount;
            hData.participants.forEach(p => participantSet.add(p.name));
          } else {
            windowMinAvailable = 0;
          }
        });

        // Filter out windows where no participant selected any slot
        if (participantSet.size === 0 || totalSlotVotes === 0) {
          continue;
        }

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
          totalScore: windowMinAvailable * 10 + windowPreferredSum,
          availableCount: windowMinAvailable,
          totalParticipants,
          participantNames: Array.from(participantSet),
        });
      }
    });

    return windows;
  };

  let candidates = getWindowsForDuration(minDurationMinutes);

  // If no candidates found for requested duration or all candidates have 0 full-duration availableCount,
  // check shorter durations (down to 30m) to find actual selected slots with attendance > 0
  if (candidates.length === 0 || candidates.every(w => w.availableCount === 0)) {
    const fallbackDurations = [120, 90, 60, 30].filter(d => d < minDurationMinutes);
    for (const fallbackDur of fallbackDurations) {
      const fallbackCandidates = getWindowsForDuration(fallbackDur);
      if (fallbackCandidates.length > 0) {
        const hasBetterAttendance = fallbackCandidates.some(w => w.availableCount > 0);
        if (hasBetterAttendance || candidates.length === 0) {
          candidates = fallbackCandidates;
          if (hasBetterAttendance) break;
        }
      }
    }
  }

  // Sort strictly by:
  // 1. Highest available participant count for the window
  // 2. Highest total score
  candidates.sort((a, b) => {
    if (b.availableCount !== a.availableCount) {
      return b.availableCount - a.availableCount;
    }
    return b.totalScore - a.totalScore;
  });

  return candidates.slice(0, 5);
}
