export type NameAffixButton = {
  id: string;
  label: string;
  prefix: string;
  suffix: string;
};

export function applyNameAffix(
  value: string,
  selected: NameAffixButton,
  availableAffixes: readonly NameAffixButton[]
): string {
  let name = value.replace(/\s+/gu, ' ').trim();
  if (!name || /^N\/A$/iu.test(name)) return value;

  for (const affix of availableAffixes) {
    const prefix = `${affix.prefix} `;
    const suffix = ` ${affix.suffix}`;

    if (name.startsWith(prefix)) name = name.slice(prefix.length).trim();
    if (name.endsWith(suffix)) name = name.slice(0, -suffix.length).trim();
  }

  if (!name) return value;
  return `${selected.prefix} ${name} ${selected.suffix}`;
}
