import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class CreatePlanoContasDto {
  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsIn(['RECEITA', 'DESPESA'])
  tipo: string;
}