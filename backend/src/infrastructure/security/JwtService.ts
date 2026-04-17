import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
}

export class JwtService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '1d'
  ) {}

  sign(payload: JwtPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
  }

  verify(token: string): JwtPayload {
    return jwt.verify(token, this.secret) as JwtPayload;
  }
}
