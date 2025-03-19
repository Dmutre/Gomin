import * as process from 'process';
import { Request, Response } from 'express';

export class CookieUtils {
  static setRefreshToken(response: Response, token: string) {
    const refreshTtl = process.env['JWT_TTL'] || '18600000000000';
    const expires = new Date(Date.now() + parseInt(refreshTtl, 10));

    const oldRefreshToken = response
      .getHeader('Set-Cookie')
      ?.toString()
      .includes('refreshToken');
    if (oldRefreshToken) {
      response.clearCookie('refreshToken', { path: '/' });
    }

    response.cookie('refreshToken', token, {
      httpOnly: true,
      expires,
      path: '/',
    });
  }

  static getRefreshToken(request: Request) {
    return request.cookies['refreshToken'];
  }
}