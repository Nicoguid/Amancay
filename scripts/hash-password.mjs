// Genera las variables del panel para .env.local.
// Uso: node scripts/hash-password.mjs "la-contraseña-del-panel"
import { randomBytes, scryptSync } from 'node:crypto';

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error('Pasá una contraseña de 12 caracteres o más: node scripts/hash-password.mjs "..."');
  process.exit(1);
}
const N = 32768, r = 8, p = 1;
const salt = randomBytes(16);
const hash = scryptSync(password.normalize('NFKC'), salt, 32, { N, r, p, maxmem: 256 * 1024 * 1024 });
console.log(`ADMIN_PASSWORD_HASH=scrypt:${N}:${r}:${p}:${salt.toString("base64")}:${hash.toString("base64")}`);
console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString('base64url')}`);
