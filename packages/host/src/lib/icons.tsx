import {
  Binary,
  Braces,
  Clock,
  Code,
  Fingerprint,
  Hash,
  KeyRound,
  Link,
  Puzzle,
  Regex,
  Settings,
  ShieldCheck,
  Type,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps the icon *names* declared in tool metadata to concrete Lucide components.
 * Tool metadata stays framework-free (just a string); the host owns rendering.
 */
const ICONS: Record<string, LucideIcon> = {
  Binary,
  Braces,
  Clock,
  Code,
  Fingerprint,
  Hash,
  KeyRound,
  Link,
  Puzzle,
  Regex,
  Settings,
  ShieldCheck,
  Type,
};

export function toolIcon(name: string | undefined): LucideIcon {
  return (name && ICONS[name]) || Wrench;
}
