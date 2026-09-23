import { Ikon, type NamaIkon } from './Ikon';

export interface ItemMenu { id: string; label: string; ikon: NamaIkon; lencana?: number }
export interface GrupMenu { judul: string; item: ItemMenu[] }

export function Sidebar({
  grup, aktif, onPilih, ciut, onCiut, terbuka, onTutup, onSumberData,
}: {
  grup: GrupMenu[]; aktif: string; onPilih: (id: string) => void;
  ciut: boolean; onCiut: () => void; terbuka: boolean; onTutup: () => void; onSumberData: () => void;
}) {
  return (
    <>
      <div className={`tirai ${terbuka ? 'tampil' : ''}`} onClick={onTutup} aria-hidden="true" />
      <aside className={`sidebar ${ciut ? 'ciut' : ''} ${terbuka ? 'terbuka' : ''}`} aria-label="Navigasi utama">
        <div className="sidebar-atas">
          <div className="logo">
            <span className="logo-tanda" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="9" fill="var(--merek)" /><path d="M9 11v6.5a7 7 0 0 0 14 0V11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>
            </span>
            <span className="logo-teks"><strong>Uniport</strong><small>Executive Dashboard</small></span>
          </div>
          <button type="button" className="tombol-ikon kecil sembunyi-mobile" onClick={onCiut} aria-label={ciut ? 'Lebarkan menu' : 'Ciutkan menu'}>
            <Ikon nama="chevronsLeft" ukuran={18} className={ciut ? 'putar' : ''} />
          </button>
          <button type="button" className="tombol-ikon kecil hanya-mobile" onClick={onTutup} aria-label="Tutup menu">
            <Ikon nama="x" ukuran={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {grup.map((g) => (
            <div className="menu-grup" key={g.judul}>
              <p className="menu-judul">{g.judul}</p>
              {g.item.map((it) => (
                <button
                  type="button" key={it.id} className={`menu-item ${aktif === it.id ? 'aktif' : ''}`}
                  onClick={() => onPilih(it.id)} title={ciut ? it.label : undefined} aria-current={aktif === it.id ? 'true' : undefined}
                >
                  <Ikon nama={it.ikon} />
                  <span className="menu-label">{it.label}</span>
                  {it.lencana !== undefined && it.lencana > 0 && <span className="menu-lencana">{it.lencana}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="kartu-promo">
          <p className="promo-judul"><Ikon nama="shield" ukuran={18} /> <span>Status data</span></p>
          {/* <p className="promo-isi">Produksi: data contoh. Effort &amp; prospek: simulasi. Belum terhubung ke eReport &amp; Matrix Distribution.</p> */}
          <button type="button" className="tombol-promo" onClick={onSumberData}><Ikon nama="info" ukuran={16} /> <span>Lihat sumber data</span></button>
        </div>
      </aside>
    </>
  );
}
