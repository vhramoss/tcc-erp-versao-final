// Configuração do servidor (BFF). Nada daqui é enviado ao navegador.
export const API_URL = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

export const COOKIE = { access: 'erp_at', refresh: 'erp_rt', sessao: 'erp_s' } as const;

// Em produção os cookies exigem https; para testar localmente em http defina COOKIE_SECURE=false.
export const COOKIE_SECURE = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production';
