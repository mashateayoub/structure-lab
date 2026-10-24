import { afterEach, expect, it } from 'vitest';
import i18n, { tr, language } from '../src/i18n';
import fr from '../src/fr.json';
import { lessons } from '../src/lessons';
afterEach(async()=>{await i18n.changeLanguage('en');});
it('provides French translations for every existing lesson explanation, quiz, answer and complexity note',()=>{
 for(const l of lessons) for(const field of ['name','group','tag','description','concept','time','space','question','answers','explanation'] as const){const text=Array.isArray(l[field])?l[field] as string[]:[l[field] as string];for(const value of text)expect(Object.hasOwn(fr,value),value).toBe(true);}
});
it('switches French to English and back with consistent resolved language and display values',async()=>{
 await i18n.changeLanguage('fr');expect(language()).toBe('fr');expect(tr('Arrays')).toBe('Tableaux');expect(tr('Added 42 at the end.')).toBe('42 ajouté à la fin.');
 await i18n.changeLanguage('en');expect(i18n.resolvedLanguage).toBe('en');expect(language()).toBe('en');expect(tr('Arrays')).toBe('Arrays');expect(i18n.t('LESSON {{n}}',{n:2})).toBe('LESSON 2');
 await i18n.changeLanguage('fr');expect(i18n.t('LESSON {{n}}',{n:2})).toBe('LEÇON 2');expect(tr('Compare 12 at index 0 with 19.')).toBe('Comparer 12 à l’indice 0 avec 19.');
});
