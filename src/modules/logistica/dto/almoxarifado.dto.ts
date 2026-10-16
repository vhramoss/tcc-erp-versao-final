import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAlmoxarifadoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}