import { Trip } from '@/types';

/**
 * Generate an iCal (.ics) file content for a trip
 */
export function generateICalContent(trip: Trip): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TripLink//Trip Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  trip.cities.forEach((city, index) => {
    const startDate = formatICalDate(city.arriveDate);
    const endDate = city.departDate 
      ? formatICalDate(city.departDate)
      : formatICalDate(city.arriveDate, 1); // Add 1 day if no end date

    const uid = `${trip.id}-${city.id}@triplink`;
    const summary = `${trip.name}: ${city.name}`;
    const location = `${city.name}, ${city.country}`;
    const description = `Stop ${index + 1} of ${trip.cities.length} on your trip "${trip.name}"`;

    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${escapeICalText(summary)}`,
      `LOCATION:${escapeICalText(location)}`,
      `DESCRIPTION:${escapeICalText(description)}`,
      'END:VEVENT'
    );
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function formatICalDate(dateStr: string, addDays: number = 0): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + addDays);
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Trigger download of iCal file
 */
export function downloadICal(trip: Trip): void {
  const content = generateICalContent(trip);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${trip.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
