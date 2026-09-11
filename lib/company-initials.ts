export type CompanyAvatarPalette = {
  background: string;
  text: string;
  border: string;
};

const AVATAR_PALETTES: CompanyAvatarPalette[] = [
  {
    background: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200/90',
  },
  {
    background: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200/80',
  },
  {
    background: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200/80',
  },
  {
    background: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200/80',
  },
  {
    background: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200/80',
  },
  {
    background: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200/80',
  },
  {
    background: 'bg-zinc-100',
    text: 'text-zinc-700',
    border: 'border-zinc-200/90',
  },
];

const IGNORED_SUFFIXES = new Set([
  'pvt',
  'pvt.',
  'ltd',
  'ltd.',
  'llp',
  'llp.',
  'inc',
  'inc.',
  'company',
  'co',
  'co.',
  'corp',
  'corporation',
  'limited',
  'private',
]);

function normalizeWord(word: string): string {
  return word.replace(/[.,]/g, '').trim().toLowerCase();
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function getMeaningfulCompanyWords(name: string): string[] {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.replace(/[.,]/g, '').trim())
    .filter(Boolean)
    .filter((word) => !IGNORED_SUFFIXES.has(normalizeWord(word)));
}

export function getCompanyInitials(name: string): string {
  const words = getMeaningfulCompanyWords(name);

  if (words.length === 0) return '?';

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  if (words.length === 2) {
    return words.map((word) => word[0]).join('').toUpperCase();
  }

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function getCompanyAvatarPalette(name: string): CompanyAvatarPalette {
  const hash = hashString(name.trim().toLowerCase() || 'company');
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}
