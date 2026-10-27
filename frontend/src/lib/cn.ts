import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Junta classes condicionais e resolve conflitos do Tailwind (a última vence). */
export const cn = (...entradas: ClassValue[]) => twMerge(clsx(entradas));
