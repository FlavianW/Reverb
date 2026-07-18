import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, seconds } from '@nestjs/throttler';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { GoogleTokenVerifierService } from './google-token-verifier.service';
import { JwtStrategy } from './jwt.strategy';
import { PasswordService } from './password.service';

@Module({
  imports: [
    UserModule,
    PassportModule,
    // Limite les tentatives de connexion/inscription (US-1.2, protection
    // contre le bruteforce de mot de passe — OWASP A07).
    ThrottlerModule.forRoot([{ ttl: seconds(60), limit: 5 }]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Durée de vie en secondes (ex: 3600 = 1h) ; `expiresIn` attend un
          // nombre ou un littéral du type `StringValue` de la lib `ms`, pas
          // une chaîne quelconque issue d'une variable d'environnement.
          expiresIn: Number(
            configService.get<string>('JWT_EXPIRES_IN') ?? 3600,
          ),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    GoogleStrategy,
    JwtStrategy,
    AuthService,
    PasswordService,
    GoogleTokenVerifierService,
  ],
})
export class AuthModule {}
