const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Turns a date into text like "28 Sep 2026, 4:30 PM"
export function formatDateTime(value: string | Date): string {
  const d = new Date(value);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hours}:${minutes} ${ampm}`;
}

// True if the deadline has already passed
export function isOverdue(deadline: string): boolean {
  return new Date(deadline).getTime() < Date.now();
}
