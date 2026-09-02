/* Formats an ISO timestamp string to a French date string like "12 janv." */
export function fmtRelativeTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  // French month abbreviations
  const FR_MONTH_ABBR = [
    "janv.",
    "févr.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];

  const day = d.getDate();
  const month = FR_MONTH_ABBR[d.getMonth()];

  return `${day} ${month}`;
}