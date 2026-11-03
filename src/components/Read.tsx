import { Fragment, type ReactNode } from 'react';

const words = (text: string): ReactNode[] =>
  text.split(/(\s+)/).map((w, i) => (!w ? null : /^\s+$/.test(w) ? w : <span className="w" key={i}>{w}</span>));

/**
 * Text that can be read along with the voice: every word is its own span, so the words ink in as they are said. A phrase marked with
 * *asterisks* gets a red pen underline, drawn as it passes the middle of the screen.
 */
export function Read({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/).map((part, i) => part.startsWith('*') && part.endsWith('*') && part.length > 2
        ? <mark className="key" key={i}>{words(part.slice(1, -1))}<svg className="key__pen" viewBox="0 0 100 10" preserveAspectRatio="none" fill="none" aria-hidden="true"><path d="M1 6 C22 3 48 8 72 4 S92 6 99 5" stroke="#ce261e" strokeWidth="3" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset="1" /></svg></mark>
        : <Fragment key={i}>{words(part)}</Fragment>)}
    </>
  );
}
