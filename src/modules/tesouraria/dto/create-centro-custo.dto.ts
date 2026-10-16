import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCentroCustoDto {
  @IsString()
  @IsNotEmpty()
  idEmpresa: string;

  @IsString()
  @IsNotEmpty()
  nome: string;
}