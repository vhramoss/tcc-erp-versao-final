import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateAlmoxarifadoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  idEmpresa: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}