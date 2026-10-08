export function formatDateTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(date);
}

export function formatDate(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function toInputDateTime(d: Date) {
  // yyyy-MM-ddTHH:mm in UTC for <input type="datetime-local">
  return d.toISOString().slice(0, 16);
}

export function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
