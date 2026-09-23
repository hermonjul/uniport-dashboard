import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Akar } from './Akar';
import './styles.css';

// Terapkan tema tersimpan sebelum render pertama, supaya halaman login juga ikut tema pilihan.
try {
  if (localStorage.getItem('uniport-tema') === 'gelap') document.documentElement.dataset.theme = 'dark';
} catch { /* localStorage diblokir: pakai tema terang */ }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Akar />
  </StrictMode>,
);
