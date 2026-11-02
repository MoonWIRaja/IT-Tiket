'use client';
import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';

// Phone view of a table: slim rows, with details in a bottom sheet on tap.
export function RowList({ items, id, title, sub, badge, href, detail }) {
  const [open, setOpen] = useState(null);
  const current = items.find((x) => id(x) === open);
  return (
    <>
      <div className="rows mobile-block">
        {items.map((x) => {
          const body = <><span className="row-text"><b>{title(x)}</b><small>{sub(x)}</small></span>{badge?.(x)}</>;
          return href
            ? <Link key={id(x)} className="row-item" href={href(x)}>{body}</Link>
            : <button key={id(x)} type="button" className="row-item" onClick={() => setOpen(id(x))}>{body}<i>›</i></button>;
        })}
      </div>
      <AnimatePresence>
        {current && (
          <motion.div className="sheet-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(null)}>
            <motion.section className="sheet" role="dialog" aria-label={String(title(current))} onClick={(e) => e.stopPropagation()}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
              <span className="grip" />
              <h2>{title(current)}</h2>
              {detail(current)}
              <button type="button" onClick={() => setOpen(null)}>Close</button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export const Fact = ({ label, children }) => <div className="fact"><small>{label}</small><span>{children}</span></div>;
