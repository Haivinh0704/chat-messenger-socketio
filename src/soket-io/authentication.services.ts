import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CustomerSocketOptions } from './socket-config';

@Injectable()
export class AuthenticationService {
    constructor(
        private jwtService: JwtService,
        @Inject('CONFIG_IO_OPTION')
        private option: CustomerSocketOptions,
    ) {}

    public decode(token: string): string | null {
        try {
            const jwt = token.replace('Bearer ', '');
            var decodeJWT = this.jwtService.decode(jwt, { json: true }) as any;
            if (decodeJWT[this.option.AliasIdInJWTToken])
                return decodeJWT[this.option.AliasIdInJWTToken];
            throw new UnauthorizedException({
                errorCode: 'ERROR.TOKEN_IS_FALSE',
                message: 'Token is failder',
            });
        } catch (e) {
            throw new UnauthorizedException({
                errorCode: 'ERROR.TOKEN_IS_FALSE',
                message: 'Token is failder',
            });
        }
    }
}
