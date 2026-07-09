import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    jwtService = { sign: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: JwtService, useValue: jwtService }],
    }).compile();

    service = module.get(AuthService);
  });

  describe('issueSessionToken', () => {
    it("signe un JWT dont le payload ne contient que l'identifiant utilisateur", () => {
      jwtService.sign.mockReturnValueOnce('signed-jwt');

      const token = service.issueSessionToken({ id: 'user-1' });

      expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-1' });
      expect(token).toBe('signed-jwt');
    });
  });
});
