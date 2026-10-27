import type { AnchorHTMLAttributes, ReactNode } from 'react';
export default function Link({ href, children, ...resto }: { href: string; children: ReactNode } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={href} {...resto}>{children}</a>;
}
