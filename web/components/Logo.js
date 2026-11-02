'use client';
import { motion } from 'framer-motion';

const TICKET = 'M12 21a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v6a5 5 0 0 0 0 10v6a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3v-6a5 5 0 0 0 0-10z';

export function Logo({ size = 30 }) {
  return (
    <span className="logo">
      <svg width={size} height={size} viewBox="8 14 48 36" aria-hidden="true">
        <path fill="#fff" d={TICKET} />
        <motion.path fill="none" stroke="#2563d9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
          d="m23 32 7 7 12-13" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }} />
      </svg>
      IT-Tiket
    </span>
  );
}
