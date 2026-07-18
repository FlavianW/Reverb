import type { GoogleMobileLoginRequest } from '@reverb/shared';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleMobileLoginDto implements GoogleMobileLoginRequest {
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}
