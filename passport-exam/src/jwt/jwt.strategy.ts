import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization 헤더에서 JWT 추출
      ignoreExpiration: false, // 만료된 토큰 거부
      secretOrKey: 'your-secret-key', // 환경변수로 관리 권장
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub }; // 요청에서 userId 사용 가능
  }
}
