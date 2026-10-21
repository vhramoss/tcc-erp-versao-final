import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class SanitizeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }

    return next.handle();
  }

  private sanitizeObject(obj: any): any {
    if (obj !== null && typeof obj === 'object') {
      // Se for array, percorre cada item
      if (Array.isArray(obj)) {
        return obj.map(item => this.sanitizeObject(item));
      }

      // Se for objeto comum, percorre cada chave
      const sanitizedObj: any = {};
      for (const key of Object.keys(obj)) {
        // Senhas são verificadas byte a byte: espaços fazem parte do segredo.
        sanitizedObj[key] = ['senha', 'senhaAtual', 'novaSenha', 'password'].includes(key) ? obj[key] : this.sanitizeObject(obj[key]);
      }
      return sanitizedObj;
    }

    // Se for string, aplica o trim() automaticamente
    if (typeof obj === 'string') {
      return obj.trim();
    }

    return obj;
  }
}
