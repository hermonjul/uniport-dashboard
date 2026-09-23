import { Ikon } from '../../components/Ikon';
import { Bagian, Kartu } from '../../components/Kartu';
import type { Dasbor } from '../../logika/dasbor';
import type { Kegentingan } from '../../logika/insight';

const LABEL: Record<Kegentingan, { teks: string; ikon: 'alert' | 'info' | 'sparkle' }> = {
  kritis: { teks: 'Kritis', ikon: 'alert' },
  perhatian: { teks: 'Perlu perhatian', ikon: 'info' },
  info: { teks: 'Informasi', ikon: 'sparkle' },
};

export function AIInsight({ d }: { d: Dasbor }) {
  return (
    <Bagian id="insight" judul="AI Insight">
      <div className="daftar-insight">
        {d.insight.map((t, i) => (
          <Kartu key={i} className={`insight insight-${t.kegentingan}`}>
            <div className="insight-kepala">
              <span className={`tingkat tingkat-${t.kegentingan}`}><Ikon nama={LABEL[t.kegentingan].ikon} ukuran={16} /> {LABEL[t.kegentingan].teks}</span>
            </div>
            <h3>{t.judul}</h3>
            <p>{t.isi}</p>
          </Kartu>
        ))}
      </div>
    </Bagian>
  );
}
