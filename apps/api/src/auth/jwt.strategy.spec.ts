import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { UserService } from '../user/user.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let userService: { findById: jest.Mock };

  beforeEach(() => {
    const configService = {
      getOrThrow: jest.fn().mockReturnValue('test-secret'),
    } as unknown as ConfigService;
    userService = { findById: jest.fn() };

    strategy = new JwtStrategy(
      configService,
      userService as unknown as UserService,
    );
  });

  describe('validate', () => {
    it('résout le payload en profil public si le compte existe encore', async () => {
      const user = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: null,
        googleId: 'google-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      userService.findById.mockResolvedValueOnce(user);

      const result = await strategy.validate({ sub: 'user-1' });

      expect(userService.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: null,
      });
    });

    it("rejette si le compte a été supprimé depuis l'émission du jeton", async () => {
      userService.findById.mockResolvedValueOnce(null);

      await expect(strategy.validate({ sub: 'user-deleted' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
