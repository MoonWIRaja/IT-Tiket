// IT-Tiket env sync (Gos).
// Root `.env.local` ialah satu tempat menampal nilai (keputusan MoonWiRaja).
// Next.js hanya membaca env dari folder app (`web/`), jadi skrip ini menyalin
// root -> web sebelum dev/build/start:
//   - web/.env.local tiada                 -> salin dari root
//   - root lebih baharu daripada web       -> salin (root menang)
//   - web lebih baharu (suntingan awak di web) -> biarkan web
// cwd-independent: laluan diselesaikan dari lokasi skrip ini (toolbox/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rootEnv = path.join(repoRoot, '.env.local');
const webEnv = path.join(repoRoot, 'web', '.env.local');

if (!fs.existsSync(rootEnv)) {
    console.log('env sync: langkau - root .env.local tiada. Salin .env.example ke .env.local (root) dan isi nilai dahulu.');
    process.exit(0);
}
const mtime = (p) => (fs.existsSync(p) ? fs.statSync(p).mtimeMs : 0);
if (mtime(webEnv) > mtime(rootEnv)) {
    console.log('env sync: langkau - web/.env.local lebih baharu daripada root (suntingan web dihormati).');
    process.exit(0);
}
fs.copyFileSync(rootEnv, webEnv);
// Windows CopyFile menyalin mtime sumber ke destinasi; tanda destinasi 'sekarang'
// supaya perbandingan lebih-baharu tetap berkesan di run seterusnya.
fs.utimesSync(webEnv, new Date(), new Date());
console.log('env sync: root .env.local -> web/.env.local (root lebih baharu).');
