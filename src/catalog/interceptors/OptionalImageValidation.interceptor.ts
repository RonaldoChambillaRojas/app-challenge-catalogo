import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class OptionalImageValidationInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;

    // Si no hay archivo, continuar sin validar (imagen OPCIONAL)
    if (!file) {
      return next.handle();
    }

    // Si hay archivo, validar formato
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Formato de imagen no válido. Permitidos: JPEG, PNG, WebP, GIF',
      );
    }

    return next.handle();
  }
}