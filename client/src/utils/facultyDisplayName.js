// Preserve an existing academic title and collapse accidental duplicate titles.
export function formatFacultyName(value, fallback = 'Faculty') {
  const name = String(value || '').trim().replace(/\s+/g, ' ');
  if (!name) return fallback;
  const prefix = /^(Prof(?:essor)?|Dr|Mr|Mrs|Ms)(?:\.\s*|\s+)/i;
  const match = name.match(prefix);
  if (!match) return 'Prof. ' + name;
  const title = {prof: 'Prof.', professor: 'Prof.', dr: 'Dr.', mr: 'Mr.', mrs: 'Mrs.', ms: 'Ms.'}[match[1].toLowerCase()];
  let rest = name.slice(match[0].length);
  while (rest.match(prefix)?.[1].toLowerCase() === match[1].toLowerCase()) rest = rest.replace(prefix, '');
  return title + ' ' + rest;
}
