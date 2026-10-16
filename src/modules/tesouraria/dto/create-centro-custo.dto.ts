import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCentroCustoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;
}