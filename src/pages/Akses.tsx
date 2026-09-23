import { Ikon } from '../components/Ikon';
import type { HasilAkses } from '../logika/akses';

type Gagal = Extract<HasilAkses, { ok: false }>['alasan'];

const PESAN: Record<Gagal, { judul: string; isi: string }> = {
  'tanpa-token': {
    judul: 'Buka portal lewat tautan Anda',
    isi: 'Dashboard ini diakses melalui tautan portal yang dikirimkan kepada Anda. Buka kembali tautan tersebut.',
  },
  ditolak: {
    judul: 'Tautan tidak valid',
    isi: 'Tautan portal ini tidak dikenali atau masa berlakunya sudah habis. Minta tautan baru kepada administrator.',
  },
  'tak-terjangkau': {
    judul: 'Layanan akses tidak dapat dihubungi',
    isi: 'Tautan Anda belum bisa diperiksa. Pastikan jaringan tersambung, lalu muat ulang halaman ini.',
  },
};

function Merek() {
  return (
    <div className="login-merek">
      <svg viewBox="0 0 32 32" width="44" height="44" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--merek)" /><path d="M9 11v6.5a7 7 0 0 0 14 0V11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
      <span><strong>Uniport</strong><small>Executive Dashboard</small></span>
    </div>
  );
}

export function MemeriksaAkses() {
  return (
    <div className="akses">
      <div className="akses-kartu" role="status" aria-live="polite">
        <Merek />
        <span className="akses-pemutar" aria-hidden="true" />
        <p className="teks-redup">Memeriksa tautan akses…</p>
      </div>
    </div>
  );
}

export function AksesGagal({ alasan }: { alasan: Gagal }) {
  const p = PESAN[alasan];
  return (
    <div className="akses">
      <div className="akses-kartu" role="alert">
        <Merek />
        <span className={`akses-ikon ${alasan === 'tak-terjangkau' ? 'waspada' : ''}`}><Ikon nama={alasan === 'tanpa-token' ? 'lock' : 'alert'} ukuran={26} /></span>
        <h1>{p.judul}</h1>
        <p className="teks-redup">{p.isi}</p>
        {alasan === 'tak-terjangkau' && (
          <button type="button" className="tombol utama" onClick={() => window.location.reload()}>Muat ulang</button>
        )}
      </div>
      <p className="login-kaki">Rahasia internal · Asuransi Sinar Mas</p>
    </div>
  );
}
