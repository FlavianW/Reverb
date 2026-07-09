import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Protège une route derrière un JWT de session valide (US-1.2). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
