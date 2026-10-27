import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SignJWT, jwtVerify } from 'jose';
import { randomUUID, createHash } from 'node:crypto';

export const ACCESS_SECONDS = 15 * 60;
export const REFRESH_SECONDS = 7 * 24 * 60 * 60;
export interface IdentidadeToken { sub: number; idEmpresa: number; sid: number; }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class TokensService {
  private readonly access: Buffer;
  private readonly refresh: Buffer;
  constructor() {
    const a = process.env.JWT_ACCESS_SECRET, r = process.env.JWT_REFRESH_SECRET;
    if (!a || !r || Buffer.byteLength(a) < 32 || Buffer.byteLength(r) < 32 || a === r) {
      throw new Error('Configure JWT_ACCESS_SECRET e JWT_REFRESH_SECRET distintos, com pelo menos 32 bytes cada.');
    }
    this.access = Buffer.from(a); this.refresh = Buffer.from(r);
  }
  async emitir(identidade: IdentidadeToken, expiraRefresh: Date) {
    const agora = Math.floor(Date.now() / 1000);
    const fimRefresh = Math.floor(expiraRefresh.getTime() / 1000);
    const fimAccess = Math.min(agora + ACCESS_SECONDS, fimRefresh);
    const assinar = (tipo: 'access' | 'refresh', exp: number) => new SignJWT({ idEmpresa: identidade.idEmpresa, sid: identidade.sid, tipo })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' }).setSubject(String(identidade.sub))
      .setIssuer('erp').setAudience(tipo === 'access' ? 'erp-api' : 'erp-refresh')
      .setJti(randomUUID()).setIssuedAt(agora).setExpirationTime(exp)
      .sign(tipo === 'access' ? this.access : this.refresh);
    const [accessToken, refreshToken] = await Promise.all([assinar('access', fimAccess), assinar('refresh', fimRefresh)]);
    return { accessToken, refreshToken, tokenType: 'Bearer', expiresIn: fimAccess - agora, refreshExpiresIn: fimRefresh - agora };
  }
  async validar(token: string, tipo: 'access' | 'refresh'): Promise<IdentidadeToken> {
    try {
      if (typeof token !== 'string' || token.length > 4096) throw new Error();
      const { payload } = await jwtVerify(token, tipo === 'access' ? this.access : this.refresh, {
        algorithms: ['HS256'], typ: 'JWT', issuer: 'erp', audience: tipo === 'access' ? 'erp-api' : 'erp-refresh',
        requiredClaims: ['sub', 'exp', 'iat', 'jti', 'idEmpresa', 'sid', 'tipo'],
      });
      if (payload.tipo !== tipo || typeof payload.sub !== 'string' || !/^[1-9]\d*$/.test(payload.sub) ||
          ![Number(payload.sub), payload.idEmpresa, payload.sid].every(v => typeof v === 'number' && Number.isInteger(v) && v > 0 && v <= 2147483647) ||
          typeof payload.jti !== 'string' || !uuid.test(payload.jti) ||
          typeof payload.iat !== 'number' || payload.iat > Math.floor(Date.now() / 1000)) throw new Error();
      return { sub: Number(payload.sub), idEmpresa: payload.idEmpresa as number, sid: payload.sid as number };
    } catch { throw new UnauthorizedException('Token inválido ou expirado.'); }
  }
  hash(token: string) { return createHash('sha256').update(token).digest('hex'); }
}
