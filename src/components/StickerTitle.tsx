import type { CSSProperties } from 'react';

interface Props {
  children: string;
  as?: 'h1' | 'h2' | 'p';
  /** font size, any CSS length */
  size: string;
  className?: string;
}

/**
 * The reel's solid title in real, selectable text: one element carries the word, the others are its extrusion, edge, band, line and hatch.
 * Over it sits the red strip that gets torn off (timelines/tear.ts). The strip stays hidden unless motion is allowed, so the title is never missing.
 */
export function StickerTitle({ children, as: Tag = 'h2', size, className = '' }: Props) {
  const layer = (name: string) => <span className={`st__${name}`} aria-hidden="true">{children}</span>;
  return (
    <Tag className={`st ${className}`} style={{ '--s': size } as CSSProperties}>
      {layer('edge')}{layer('band')}{layer('line')}
      <span className="st__face">{children}</span>
      {layer('hatch')}
      <span className="tear" aria-hidden="true">
        <i className="tear__core" />
        <i className="tear__strip" />
        <i className="tear__flap" />
      </span>
    </Tag>
  );
}
