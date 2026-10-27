import { IdBanco } from '../../common/decorators/id-banco.decorator';
import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePessoaDto } from '../pessoas/dto/pessoa.dto';
import { PERMISSOES } from './auth.decorators';
export class LoginDto {
  // A empresa é identificada pelo CNPJ (uso normal) ou pelo ID numérico (integrações). Exatamente um dos dois.
  @ValidateIf((o) => !o.cnpj) @IdBanco() idEmpresa?: number;
  @ValidateIf((o) => !o.idEmpresa) @Matches(/^\d{14}$/, { message: 'Informe o CNPJ com 14 dígitos, somente números.' }) cnpj?: string;
  @IsString() @IsNotEmpty() @MaxLength(100) username: string;
  @IsString() @MinLength(1) @MaxLength(128) senha: string;
}
export class RefreshDto { @IsString() @IsNotEmpty() @MaxLength(4096) refreshToken: string; }
export class SenhaDto {
  @IsString() @MinLength(1) @MaxLength(128) senhaAtual: string;
  @IsString() @MinLength(12) @MaxLength(128) novaSenha: string;
}
export class PermissoesDto {
  @IsArray() @ArrayUnique() @ArrayMaxSize(PERMISSOES.length) @IsIn(PERMISSOES, { each: true }) permissoes: string[];
}
export class DepartamentoDto {
  @IsString() @IsNotEmpty() @MaxLength(100) nome: string;
  @IsOptional() @IsString() @MaxLength(20) sigla?: string;
}
export class UsuarioDto extends PermissoesDto {
  @IsOptional() @IdBanco() pessoaId?: number;
  @IsOptional() @ValidateNested() @Type(() => CreatePessoaDto) pessoa?: CreatePessoaDto;
  @IdBanco() departamentoId: number;
  @IsString() @IsNotEmpty() @MaxLength(100) username: string;
  @IsString() @MinLength(12) @MaxLength(128) senha: string;
}
export class AtualizarUsuarioDto {
  @IsOptional() @IdBanco() departamentoId?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
