// Minimal class-name merge helper (avoids adding tailwind-merge dependency)
export function twMerge(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
