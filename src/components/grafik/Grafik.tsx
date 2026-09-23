// Primitif grafik SVG buatan sendiri (tanpa pustaka chart, harus jalan luring).
// Warna seri memakai token --seri-*; teks selalu memakai token tinta, bukan warna seri.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

function useLebar<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [lebar, setLebar] = useState(600);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setLebar(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setLebar(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, lebar] as const;
}

/** Skala sumbu "rapi": 0 sampai kelipatan 1/2/2,5/5 × 10^n. */
function skalaRapi(maks: number, langkah = 4): number[] {
  if (maks <= 0) return [0, 1];
  const kasar = maks / langkah;
  const p = Math.pow(10, Math.floor(Math.log10(kasar)));
  const k = [1, 2, 2.5, 5, 10].find((x) => x * p >= kasar)! * p;
  return Array.from({ length: Math.ceil(maks / k) + 1 }, (_, i) => i * k);
}

function Tooltip({ x, y, lebar, children }: { x: number; y: number; lebar: number; children: ReactNode }) {
  const kiri = Math.min(Math.max(x + 14, 8), lebar - 190);
  return <div className="tooltip" style={{ left: kiri, top: Math.max(0, y - 16) }}>{children}</div>;
}

// ── Donut ───────────────────────────────────────────────────────────────────
export interface Irisan { label: string; nilai: number; warna: string }

export function Donut({ data, ukuran = 148, tengah, subTengah }: { data: Irisan[]; ukuran?: number; tengah: string; subTengah: string }) {
  const total = data.reduce((s, d) => s + Math.max(0, d.nilai), 0);
  const r = ukuran / 2 - 10, keliling = 2 * Math.PI * r, celah = data.length > 1 ? 3 : 0;
  let offset = 0;
  const [aktif, setAktif] = useState<number | null>(null);
  return (
    <div className="donut-bungkus" style={{ width: ukuran, height: ukuran }}>
      <svg width={ukuran} height={ukuran} role="img" aria-label={data.map((d) => `${d.label} ${Math.round((d.nilai / total) * 100)}%`).join(', ')}>
        <circle cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke="var(--garis)" strokeWidth={16} />
        {total > 0 && data.map((d, i) => {
          const panjang = (Math.max(0, d.nilai) / total) * keliling;
          const el = (
            <circle
              key={d.label} cx={ukuran / 2} cy={ukuran / 2} r={r} fill="none" stroke={d.warna}
              strokeWidth={aktif === i ? 20 : 16}
              strokeDasharray={`${Math.max(0, panjang - celah)} ${keliling}`} strokeDashoffset={-offset}
              transform={`rotate(-90 ${ukuran / 2} ${ukuran / 2})`}
              onMouseEnter={() => setAktif(i)} onMouseLeave={() => setAktif(null)}
            >
              <title>{`${d.label}: ${((d.nilai / total) * 100).toFixed(1).replace('.', ',')}%`}</title>
            </circle>
          );
          offset += panjang;
          return el;
        })}
      </svg>
      <div className="donut-tengah">
        <strong>{tengah}</strong>
        <span>{subTengah}</span>
      </div>
    </div>
  );
}

// ── Batang bulanan (satu seri + garis acuan) ─────────────────────────────────
export function BatangBulanan({
  label, nilai, acuan, labelAcuan, sorotAwal, formatNilai, formatSumbu, namaSeri, rentang,
}: {
  label: string[]; nilai: (number | null)[]; acuan?: number; labelAcuan?: string; sorotAwal: number;
  /** Rentang indeks periode terpilih; batang di luarnya diredupkan. */
  rentang?: [number, number];
  formatNilai: (n: number) => string; formatSumbu: (n: number) => string; namaSeri: string;
}) {
  const [ref, lebar] = useLebar<HTMLDivElement>();
  const [sorot, setSorot] = useState(sorotAwal);
  useEffect(() => setSorot(sorotAwal), [sorotAwal, nilai]);
  const tinggi = 260, kiri = 56, bawah = 30, atas = 16;
  const maks = Math.max(...nilai.map((v) => v ?? 0), acuan ?? 0) * 1.08;
  const tick = skalaRapi(maks);
  const puncak = tick[tick.length - 1];
  const lebarPlot = Math.max(100, lebar - kiri - 8);
  const slot = lebarPlot / label.length;
  const lebarBatang = Math.min(46, slot * 0.66);
  const y = (v: number) => atas + (tinggi - atas - bawah) * (1 - v / puncak);
  const v = nilai[sorot];

  return (
    <div className="grafik" ref={ref} onMouseLeave={() => setSorot(sorotAwal)}>
      <svg width={lebar} height={tinggi} role="img" aria-label={label.map((l, i) => `${l}: ${nilai[i] === null ? 'belum berjalan' : formatNilai(nilai[i]!)}`).join('; ')}>
        <defs>
          <linearGradient id="gradBatang" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--batang-lembut)" stopOpacity={1} />
            <stop offset="1" stopColor="var(--batang-lembut)" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id="gradSorot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--seri-1)" stopOpacity={1} />
            <stop offset="1" stopColor="var(--seri-1)" stopOpacity={0.15} />
          </linearGradient>
        </defs>
        {tick.map((t) => (
          <g key={t}>
            <line x1={kiri} x2={lebar - 4} y1={y(t)} y2={y(t)} className="grid-garis" />
            <text x={kiri - 10} y={y(t) + 4} textAnchor="end" className="sumbu-teks">{formatSumbu(t)}</text>
          </g>
        ))}
        {nilai.map((n, i) => {
          const cx = kiri + slot * i + slot / 2;
          const ada = n !== null;
          const h = ada ? Math.max(2, y(0) - y(Math.max(0, n!))) : 0;
          return (
            <g key={i} onMouseEnter={() => setSorot(i)}>
              <rect x={kiri + slot * i} y={atas} width={slot} height={tinggi - atas - bawah} fill="transparent" />
              {ada ? (
                <rect x={cx - lebarBatang / 2} y={y(0) - h} width={lebarBatang} height={h} rx={6}
                  fill={i === sorot ? 'url(#gradSorot)' : 'url(#gradBatang)'}
                  opacity={rentang && (i < rentang[0] || i > rentang[1]) ? 0.3 : 1} />
              ) : (
                <rect x={cx - lebarBatang / 2} y={y(0) - 3} width={lebarBatang} height={3} rx={1.5} fill="var(--garis)" />
              )}
              <text x={cx} y={tinggi - 8} textAnchor="middle" className={`sumbu-teks ${i === sorot ? 'tebal' : ''}`}>{label[i]}</text>
            </g>
          );
        })}
        {acuan !== undefined && (
          <g>
            <line x1={kiri} x2={lebar - 4} y1={y(acuan)} y2={y(acuan)} className="garis-acuan" />
            <text x={kiri + 6} y={y(acuan) - 6} textAnchor="start" className="sumbu-teks tebal">{labelAcuan}</text>
          </g>
        )}
        {v !== null && v !== undefined && (() => {
          const cx = kiri + slot * sorot + slot / 2;
          return (
            <g pointerEvents="none">
              <line x1={cx} x2={cx} y1={y(Math.max(0, v))} y2={y(0)} stroke="var(--permukaan)" strokeWidth={2} opacity={0.8} />
              <circle cx={cx} cy={y(Math.max(0, v))} r={6} fill="var(--seri-1)" stroke="var(--permukaan)" strokeWidth={3} />
            </g>
          );
        })()}
      </svg>
      {v !== null && v !== undefined && (
        <Tooltip x={kiri + slot * sorot + slot / 2} y={y(Math.max(0, v))} lebar={lebar}>
          <span className="tooltip-label"><i className="titik" style={{ background: 'var(--seri-1)' }} />{namaSeri} · {label[sorot]}</span>
          <strong>{formatNilai(v)}</strong>
          {acuan !== undefined && acuan > 0 && <span className="teks-redup">{Math.round((v / acuan) * 100)}% dari {labelAcuan?.toLowerCase()}</span>}
        </Tooltip>
      )}
    </div>
  );
}

// ── Batang harian (ritme kerja 30 hari) ─────────────────────────────────────
export function BatangHarian({ label, nilai, rincian, namaSeri }: { label: string[]; nilai: number[]; rincian: (i: number) => ReactNode; namaSeri: string }) {
  const [ref, lebar] = useLebar<HTMLDivElement>();
  const [sorot, setSorot] = useState<number | null>(null);
  const tinggi = 220, kiri = 44, bawah = 28, atas = 12;
  const tick = skalaRapi(Math.max(...nilai) * 1.05);
  const puncak = tick[tick.length - 1];
  const slot = (Math.max(100, lebar - kiri - 4)) / nilai.length;
  const lb = Math.max(3, slot - 3);
  const y = (v: number) => atas + (tinggi - atas - bawah) * (1 - v / puncak);
  return (
    <div className="grafik" ref={ref} onMouseLeave={() => setSorot(null)}>
      <svg width={lebar} height={tinggi} role="img" aria-label={`${namaSeri}, ${nilai.length} hari`}>
        {tick.map((t) => (
          <g key={t}>
            <line x1={kiri} x2={lebar} y1={y(t)} y2={y(t)} className="grid-garis" />
            <text x={kiri - 8} y={y(t) + 4} textAnchor="end" className="sumbu-teks">{Math.round(t)}</text>
          </g>
        ))}
        {nilai.map((n, i) => {
          const x = kiri + slot * i + (slot - lb) / 2;
          const h = Math.max(2, y(0) - y(n));
          return (
            <g key={i} onMouseEnter={() => setSorot(i)}>
              <rect x={kiri + slot * i} y={atas} width={slot} height={tinggi - atas - bawah} fill="transparent" />
              <rect x={x} y={y(0) - h} width={lb} height={h} rx={Math.min(4, lb / 2)} fill="var(--seri-1)" opacity={sorot === null || sorot === i ? 1 : 0.45} />
              {(i % 5 === 0 || i === nilai.length - 1) && (
                <text x={x + lb / 2} y={tinggi - 8} textAnchor="middle" className="sumbu-teks">{label[i]}</text>
              )}
            </g>
          );
        })}
      </svg>
      {sorot !== null && (
        <Tooltip x={kiri + slot * sorot + slot / 2} y={y(nilai[sorot])} lebar={lebar}>
          <span className="tooltip-label"><i className="titik" style={{ background: 'var(--seri-1)' }} />{label[sorot]}</span>
          <strong>{Math.round(nilai[sorot])} poin</strong>
          {rincian(sorot)}
        </Tooltip>
      )}
    </div>
  );
}

// ── Batang mendatar (HTML) ──────────────────────────────────────────────────
export function BatangMendatar({ data, format, warna = 'var(--seri-1)', onPilih }: {
  data: { label: string; nilai: number; ket?: string }[]; format: (n: number) => string; warna?: string; onPilih?: (i: number) => void;
}) {
  const maks = Math.max(...data.map((d) => d.nilai), 1);
  return (
    <ul className="batang-mendatar">
      {data.map((d, i) => {
        const isi = (
          <>
            <span className="bm-label">{d.label}{d.ket && <small className="teks-redup">{d.ket}</small>}</span>
            <span className="bm-jalur"><span className="bm-isi" style={{ width: `${(Math.max(0, d.nilai) / maks) * 100}%`, background: warna }} /></span>
            <span className="bm-nilai">{format(d.nilai)}</span>
          </>
        );
        return (
          <li key={d.label}>
            {onPilih ? <button type="button" className="bm-baris" onClick={() => onPilih(i)}>{isi}</button> : <div className="bm-baris">{isi}</div>}
          </li>
        );
      })}
    </ul>
  );
}
