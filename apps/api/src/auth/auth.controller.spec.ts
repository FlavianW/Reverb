import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@prisma/client';
import { Request, Response } from 'express';
import { GoogleProfile, PublicUser, UserService } from '../user/user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordService } from './password.service';
import { SESSION_COOKIE_NAME } from './session-cookie';

describe('AuthController', () => {
  let controller: AuthController;
  let userService: {
    findOrCreateFromGoogleProfile: jest.Mock;
    findByEmail: jest.Mock;
    findByPseudo: jest.Mock;
    createWithPassword: jest.Mock;
  };
  let authService: { issueSessionToken: jest.Mock };
  let passwordService: { hashPassword: jest.Mock };

  const googleProfile: GoogleProfile = {
    googleId: 'google-123',
    email: 'ana@example.com',
    displayName: 'Ana Étoile',
    avatarUrl: 'https://example.com/avatar.png',
  };

  const createResMock = (): Response =>
    ({
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    }) as unknown as Response;

  beforeEach(async () => {
    userService = {
      findOrCreateFromGoogleProfile: jest.fn(),
      findByEmail: jest.fn(),
      findByPseudo: jest.fn(),
      createWithPassword: jest.fn(),
    };
    authService = { issueSessionToken: jest.fn() };
    passwordService = { hashPassword: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: UserService, useValue: userService },
        { provide: AuthService, useValue: authService },
        { provide: PasswordService, useValue: passwordService },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  describe('googleCallback', () => {
    it('crée ou récupère le compte, ouvre la session (cookie JWT) et renvoie le profil public', async () => {
      const user = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: googleProfile.email,
        avatarUrl: googleProfile.avatarUrl,
        googleId: googleProfile.googleId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      userService.findOrCreateFromGoogleProfile.mockResolvedValueOnce(user);
      authService.issueSessionToken.mockReturnValueOnce('signed-jwt');
      const req = { user: googleProfile } as unknown as Request;
      const res = createResMock();

      const result = await controller.googleCallback(req, res);

      expect(userService.findOrCreateFromGoogleProfile).toHaveBeenCalledWith(
        googleProfile,
      );
      expect(authService.issueSessionToken).toHaveBeenCalledWith(user);
      expect(res.cookie).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        'signed-jwt',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: googleProfile.email,
        avatarUrl: googleProfile.avatarUrl,
      });
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'ana@example.com',
      password: 'correct horse battery',
      pseudo: 'ana-etoile',
    };

    it("refuse l'inscription si l'e-mail est déjà utilisé", async () => {
      userService.findByEmail.mockResolvedValueOnce({
        id: 'existing-user',
      });
      const res = createResMock();

      await expect(controller.register(registerDto, res)).rejects.toThrow(
        ConflictException,
      );
      expect(userService.createWithPassword).not.toHaveBeenCalled();
    });

    it('refuse l’inscription si le pseudo est déjà pris', async () => {
      userService.findByEmail.mockResolvedValueOnce(null);
      userService.findByPseudo.mockResolvedValueOnce({
        id: 'existing-user',
      });
      const res = createResMock();

      await expect(controller.register(registerDto, res)).rejects.toThrow(
        ConflictException,
      );
      expect(userService.createWithPassword).not.toHaveBeenCalled();
    });

    it('hache le mot de passe, crée le compte et ouvre la session', async () => {
      userService.findByEmail.mockResolvedValueOnce(null);
      userService.findByPseudo.mockResolvedValueOnce(null);
      passwordService.hashPassword.mockResolvedValueOnce('hashed-password');
      const createdUser = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: null,
      } as User;
      userService.createWithPassword.mockResolvedValueOnce(createdUser);
      authService.issueSessionToken.mockReturnValueOnce('signed-jwt');
      const res = createResMock();

      const result = await controller.register(registerDto, res);

      expect(passwordService.hashPassword).toHaveBeenCalledWith(
        'correct horse battery',
      );
      expect(userService.createWithPassword).toHaveBeenCalledWith({
        email: 'ana@example.com',
        pseudo: 'ana-etoile',
        passwordHash: 'hashed-password',
      });
      expect(res.cookie).toHaveBeenCalledWith(
        SESSION_COOKIE_NAME,
        'signed-jwt',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(result).toEqual({
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: 'ana@example.com',
        avatarUrl: null,
      });
    });
  });

  describe('me', () => {
    it('renvoie le profil public attaché à la requête par le JwtAuthGuard', () => {
      const publicUser: PublicUser = {
        id: 'user-1',
        pseudo: 'ana-etoile',
        email: googleProfile.email,
        avatarUrl: googleProfile.avatarUrl ?? null,
      };
      const req = { user: publicUser } as unknown as Request;

      expect(controller.me(req)).toBe(publicUser);
    });
  });

  describe('logout', () => {
    it('supprime le cookie de session', () => {
      const res = createResMock();

      controller.logout(res);

      expect(res.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
    });
  });
});
