import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePlanoContasDto {
  @IsString()
  @IsNotEmpty()
  idEmpresa: string;

  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  tipo: string; // 'RECEITA' ou 'DESPESA'
}