import { format, parseISO } from 'date-fns';

export function formatIcalDate(isoDateString: string): string {
  const d = new Date(isoDateString);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function getGoogleCalendarUrl(
  title: string,
  startIso: string,
  endIso: string,
  details: string = ''
): string {
  const startStr = formatIcalDate(startIso);
  const endStr = formatIcalDate(endIso);

  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `AlignUs: ${title}`,
    dates: `${startStr}/${endStr}`,
    details: details || `Scheduled via AlignUs real-time scheduler.`,
  });

  return `${baseUrl}?${params.toString()}`;
}

export function downloadIcalFile(
  title: string,
  startIso: string,
  endIso: string,
  details: string = ''
): void {
  const startStr = formatIcalDate(startIso);
  const endStr = formatIcalDate(endIso);
  const nowStr = formatIcalDate(new Date().toISOString());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AlignUs//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${crypto.randomUUID()}`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:AlignUs: ${title}`,
    `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_meeting.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
