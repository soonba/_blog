import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  // 비밀번호 비교
  async validateUser(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // JWT 발급
  async login(userId: string) {
    const payload = { sub: userId }; // JWT 페이로드
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // JWT 검증 및 유저 ID 추출
  async validateToken(token: string): Promise<{ userId: string }> {
    try {
      const decoded = this.jwtService.verify(token);
      return { userId: decoded.sub };
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
