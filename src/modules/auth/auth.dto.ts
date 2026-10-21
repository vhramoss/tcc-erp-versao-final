import { ArrayMaxSize, ArrayUnique, IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePessoaDto } from '../pessoas/dto/pessoa.dto';
import { PERMISSOES } from './auth.decorators';
export class LoginDto {
  @IsUUID() idEmpresa: string;
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
  @IsOptional() @IsUUID() pessoaId?: string;
  @IsOptional() @ValidateNested() @Type(() => CreatePessoaDto) pessoa?: CreatePessoaDto;
  @IsUUID() departamentoId: string;
  @IsString() @IsNotEmpty() @MaxLength(100) username: string;
  @IsString() @MinLength(12) @MaxLength(128) senha: string;
}
export class AtualizarUsuarioDto {
  @IsOptional() @IsUUID() departamentoId?: string;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
