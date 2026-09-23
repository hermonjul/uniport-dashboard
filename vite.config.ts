import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Satu berkas HTML mandiri: seluruh JS/CSS di-inline.
export default defineConfig(({ mode }) => {
  // Awalan '' = baca semua variabel .env di sisi Node saja; tidak ada yang ikut ke browser
  // kecuali yang berawalan VITE_.
  const env = loadEnv(mode, process.cwd(), '');

  // URL_GO menunjuk ke backend Go (…/api/v1/matrix/). Endpoint ditulis relatif dari /api/v1
  // (mis. "matrix/kanwils"), jadi akhiran "matrix/" dibuang dari target proxy.
  const go = env.URL_GO ? new URL(env.URL_GO) : null;
  const dasarGo = go ? go.pathname.replace(/\/?matrix\/?$/, '').replace(/\/$/, '') : '';

  return {
    plugins: [react(), viteSingleFile()],
    base: './',
    server: {
      // Port & alamat tetap supaya tautan akses (npm run link) selalu menunjuk ke tempat yang sama.
      // 127.0.0.1 = hanya dari komputer ini (data rahasia internal tidak terbuka ke jaringan).
      host: '127.0.0.1',
      port: 5175,
      strictPort: true,
      proxy: {
        // Layanan akses portal (npm run api).
        // Regex (bukan awalan '/api') supaya tidak ikut menangkap '/api-go'.
        '^/api/': { target: 'http://localhost:8787', changeOrigin: true },
        // Backend Go: /api-go/matrix/kanwils → {URL_GO tanpa "matrix/"}/matrix/kanwils.
        // Lewat proxy karena backend tidak mengirim header CORS.
        ...(go && {
          '/api-go': {
            target: go.origin, changeOrigin: true,
            rewrite: (p: string) => p.replace(/^\/api-go/, dasarGo),
          },
        }),
      },
    },
  };
});
