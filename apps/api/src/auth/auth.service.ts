import { Injectable } from '@nestjs/common';
import type { CurrentUserResponseDto } from './dto/current-user-response.dto.js';

@Injectable()
export class AuthService {
  getCurrentUser(): CurrentUserResponseDto {
    return { user: null };
  }
}
