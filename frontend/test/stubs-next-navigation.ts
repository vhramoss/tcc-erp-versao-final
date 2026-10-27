// Substitui next/navigation fora do Next: o teste controla caminho, query string e navegações.
type G = typeof globalThis & { __ui: { path: string; search: string; navegou: string[] } };
const g = globalThis as G;
export const useRouter = () => ({ push: (u: string) => void g.__ui.navegou.push(u), replace: (u: string) => void g.__ui.navegou.push(u), back() {}, prefetch() {}, refresh() {} });
export const usePathname = () => g.__ui.path;
export const useSearchParams = () => new URLSearchParams(g.__ui.search);
export const useParams = () => ({});
