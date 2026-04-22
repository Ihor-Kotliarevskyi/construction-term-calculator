import styles from './StatCard.module.css';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  small?: boolean;
}

export function StatCard({ label, value, sub, small }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={`${styles.value} ${small ? styles.small : ''}`}>{value}</div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}
