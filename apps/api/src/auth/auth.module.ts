import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [UserModule, PassportModule],
  controllers: [AuthController],
  providers: [GoogleStrategy],
})
export class AuthModule {}
