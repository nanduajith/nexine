import { useEffect, useState } from 'react';

import { preferencesStore } from '../storage/preferences-store';

import de from './de.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import ml from './ml.json';
import no from './no.json';
import pt from './pt.json';
import uk from './uk.json';
import vi from './vi.json';
import zh from './zh.json';

const dicts: Record<string, Record<string, string>> = { en, ml, es, fr, de, no, pt, uk, vi, zh };

/** Synchronous translation getter for non-React contexts (like tools) */
export function t(key: string): string {
  const lang = preferencesStore.getSnapshot().language;
  const dict = dicts[lang] || dicts.en;
  return (dict && dict[key]) || (dicts.en && dicts.en[key]) || key;
}

/** React hook for translation that updates when language changes */
export function useTranslation() {
  const [lang, setLang] = useState(preferencesStore.getSnapshot().language);

  useEffect(() => {
    return preferencesStore.subscribe(() => {
      setLang(preferencesStore.getSnapshot().language);
    });
  }, []);

  return {
    t: (key: string) => {
      const dict = dicts[lang] || dicts.en;
      return (dict && dict[key]) || (dicts.en && dicts.en[key]) || key;
    },
    lang,
  };
}
