// Format angka & tanggal gaya Indonesia.

const angka1 = new Intl.NumberFormat('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const angka0 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** Rupiah ringkas: Rp 298,8 M · Rp 24,6 jt · Rp 850 rb. */
export function rp(n: number): string {
  const tanda = n < 0 ? '–' : '';
  const a = Math.abs(n);
  if (a >= 1e12) return `${tanda}Rp ${angka1.format(a / 1e12)} T`;
  if (a >= 1e9) return `${tanda}Rp ${angka1.format(a / 1e9)} M`;
  if (a >= 1e6) return `${tanda}Rp ${angka1.format(a / 1e6)} jt`;
  if (a >= 1e3) return `${tanda}Rp ${angka0.format(a / 1e3)} rb`;
  return `${tanda}Rp ${angka0.format(a)}`;
}

/** Rupiah lengkap dalam miliar untuk judul besar: Rp 298,8 miliar. */
export function rpMiliar(n: number): string {
  return `Rp ${angka1.format(n / 1e9)} miliar`;
}

export function persen(r: number, desimal = 1): string {
  if (!isFinite(r)) return '–';
  return `${new Intl.NumberFormat('id-ID', { minimumFractionDigits: desimal, maximumFractionDigits: desimal }).format(r * 100)}%`;
}

/** Persen bertanda untuk perubahan: +2,7% / –4,1%. */
export function delta(r: number, desimal = 1): string {
  if (!isFinite(r)) return '–';
  const s = persen(Math.abs(r), desimal);
  return r > 0 ? `+${s}` : r < 0 ? `–${s}` : s;
}

export function bilangan(n: number): string {
  return angka0.format(n);
}

export function tanggalPanjang(d: Date): string {
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
}

export function tanggalPendek(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
