import { Matches } from 'class-validator';
import { REGEX_DATA } from '../../common/utils/datas';

export class FiltroIndicadoresDto {
  @Matches(REGEX_DATA, { message: 'Use o formato AAAA-MM-DD.' }) dataInicio: string;
  @Matches(REGEX_DATA, { message: 'Use o formato AAAA-MM-DD.' }) dataFim: string;
}
