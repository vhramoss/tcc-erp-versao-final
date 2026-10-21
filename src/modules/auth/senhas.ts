import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const parametros = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
function derivar(senha: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => scrypt(senha, salt, 64, parametros, (erro, chave) => erro ? reject(erro) : resolve(chave)));
}
export async function hashSenha(senha: string): Promise<string> {
  if (typeof senha !== 'string' || senha.length < 12 || senha.length > 128) throw new Error('A senha deve ter de 12 a 128 caracteres.');
  const salt = randomBytes(16);
  const chave = await derivar(senha, salt);
  return `scrypt$32768$8$3$${salt.toString('hex')}$${chave.toString('hex')}`;
}
export async function verificarSenha(senha: string, hash?: string): Promise<boolean> {
  if (typeof senha !== 'string' || senha.length > 128) return false;
  const valido = /^scrypt\$32768\$8\$3\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(hash ?? '');
  // Executa o mesmo KDF quando o usuário não existe ou o hash legado é inválido.
  const partes = valido ? hash!.split('$') : [];
  const chave = await derivar(senha, valido ? Buffer.from(partes[4], 'hex') : Buffer.alloc(16));
  const esperado = valido ? Buffer.from(partes[5], 'hex') : Buffer.alloc(64);
  return timingSafeEqual(chave, esperado) && valido;
}
