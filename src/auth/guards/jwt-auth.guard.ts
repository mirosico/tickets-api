import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthenticatedRequest } from '@types';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Відсутній токен авторизації');
    }

    const token = authHeader.substring(7); // Видаляємо 'Bearer ' з початку

    try {
      // TODO: Додати перевірку токена

      if (!token) {
        throw new UnauthorizedException('Токен авторизації відсутній');
      }
      // Якщо токен валідний, додаємо об'єкт користувача до запиту
      request.user = {
        id: token,
        email: 'user@example.com',
      };

      return true;
    } catch {
      throw new UnauthorizedException('Невалідний токен авторизації');
    }
  }
}
