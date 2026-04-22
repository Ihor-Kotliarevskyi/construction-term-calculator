import type { ReactNode } from 'react';
import styles from './Chip.module.css';

interface ChipProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function Chip({ active, onClick, children }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.chip} ${active ? styles.active : ''}`}
    >
      {children}
    </button>
  );
}
