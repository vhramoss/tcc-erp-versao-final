import { applyDecorators, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export const MAX_ID_BANCO = 2147483647;

export function converterId(valor: unknown): unknown {
  return typeof valor === 'string' && /^[1-9]\d*$/.test(valor) ? Number(valor) : valor;
}

export function IdBanco() {
  return applyDecorators(Transform(({ value }) => converterId(value)), IsInt(), Min(1), Max(MAX_ID_BANCO));
}

@Injectable()
export class IdBancoPipe implements PipeTransform {
  transform(valor: unknown): number {
    const id = converterId(valor);
    if (typeof id !== 'number' || !Number.isInteger(id) || id < 1 || id > MAX_ID_BANCO) {
      throw new BadRequestException('Informe um ID inteiro positivo válido.');
    }
    return id;
  }
}
