import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { PublicUser } from '@reverb/shared';
import { ConcertAttendanceService } from './attendance/concert-attendance.service';
import { ConcertController } from './concert.controller';
import { ConcertService } from './concert.service';
import { CommentService } from './comment/comment.service';
import { PhotoService } from './photo/photo.service';
import { ConcertRatingService } from './rating/concert-rating.service';

describe('ConcertController', () => {
  let controller: ConcertController;
  let concertService: {
    findPageById: jest.Mock;
    create: jest.Mock;
    exists: jest.Mock;
    search: jest.Mock;
    findNearby: jest.Mock;
  };
  let attendanceService: {
    markAttended: jest.Mock;
    unmarkAttended: jest.Mock;
    isAttendedBy: jest.Mock;
  };
  let ratingService: { rate: jest.Mock };
  let commentService: { create: jest.Mock };
  let photoService: { uploadForConcert: jest.Mock };

  const currentUser: PublicUser = {
    id: 'user-1',
    pseudo: 'ana-etoile',
    email: 'ana@example.com',
    avatarUrl: null,
    bio: null,
  };
  beforeEach(async () => {
    concertService = {
      findPageById: jest.fn(),
      create: jest.fn(),
      exists: jest.fn(),
      search: jest.fn(),
      findNearby: jest.fn(),
    };
    attendanceService = {
      markAttended: jest.fn(),
      unmarkAttended: jest.fn(),
      isAttendedBy: jest.fn(),
    };
    ratingService = { rate: jest.fn() };
    commentService = { create: jest.fn() };
    photoService = { uploadForConcert: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConcertController],
      providers: [
        { provide: ConcertService, useValue: concertService },
        { provide: ConcertAttendanceService, useValue: attendanceService },
        { provide: ConcertRatingService, useValue: ratingService },
        { provide: CommentService, useValue: commentService },
        { provide: PhotoService, useValue: photoService },
      ],
    }).compile();

    controller = module.get(ConcertController);
  });

  describe('search', () => {
    it('délègue la recherche au service (avec l’utilisateur courant, pour un import Setlist.fm éventuel) et renvoie ses résultats', async () => {
      const results = [{ id: 'concert-1', artistName: 'Muse' }];
      concertService.search.mockResolvedValueOnce(results);

      const result = await controller.search({ q: 'muse' }, currentUser);

      expect(concertService.search).toHaveBeenCalledWith(
        'muse',
        currentUser.id,
      );
      expect(result).toBe(results);
    });

    it("renvoie une liste vide s'il n'y a aucun résultat", async () => {
      concertService.search.mockResolvedValueOnce([]);

      const result = await controller.search({ q: 'inconnu' }, currentUser);

      expect(result).toEqual([]);
    });

    it("sans q, délègue au service avec undefined (fil d'accueil)", async () => {
      const recents = [{ id: 'concert-1', artistName: 'Muse' }];
      concertService.search.mockResolvedValueOnce(recents);

      const result = await controller.search({}, currentUser);

      expect(concertService.search).toHaveBeenCalledWith(
        undefined,
        currentUser.id,
      );
      expect(result).toBe(recents);
    });
  });

  describe('findNearby', () => {
    it('délègue au service avec lat/lng/radiusKm et renvoie ses résultats', async () => {
      const results = [{ id: 'concert-1', distanceKm: 2.5 }];
      concertService.findNearby.mockResolvedValueOnce(results);

      const result = await controller.findNearby({
        lat: 48.8566,
        lng: 2.3522,
        radiusKm: 25,
      });

      expect(concertService.findNearby).toHaveBeenCalledWith(
        48.8566,
        2.3522,
        25,
      );
      expect(result).toBe(results);
    });
  });

  describe('getById', () => {
    it("lève une 404 explicite si le concert n'existe pas", async () => {
      concertService.findPageById.mockResolvedValueOnce(null);

      await expect(
        controller.getById('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow(NotFoundException);
    });

    it('renvoie la page concert quand elle existe', async () => {
      const page = { id: 'concert-1', artistName: 'Muse', setlist: null };
      concertService.findPageById.mockResolvedValueOnce(page);

      const result = await controller.getById('concert-1');

      expect(result).toBe(page);
    });
  });

  describe('markAttendance / unmarkAttendance / getAttendance', () => {
    it("lève une 404 si le concert n'existe pas", async () => {
      concertService.exists.mockResolvedValueOnce(false);

      await expect(
        controller.markAttendance('concert-1', currentUser),
      ).rejects.toThrow(NotFoundException);
      expect(attendanceService.markAttended).not.toHaveBeenCalled();
    });

    it("marque le concert comme vu pour l'utilisateur connecté", async () => {
      concertService.exists.mockResolvedValueOnce(true);

      await controller.markAttendance('concert-1', currentUser);

      expect(attendanceService.markAttended).toHaveBeenCalledWith(
        'concert-1',
        'user-1',
      );
    });

    it('retire la marque pour l’utilisateur connecté', async () => {
      concertService.exists.mockResolvedValueOnce(true);

      await controller.unmarkAttendance('concert-1', currentUser);

      expect(attendanceService.unmarkAttended).toHaveBeenCalledWith(
        'concert-1',
        'user-1',
      );
    });

    it('renvoie le statut courant', async () => {
      concertService.exists.mockResolvedValueOnce(true);
      attendanceService.isAttendedBy.mockResolvedValueOnce(true);

      const result = await controller.getAttendance('concert-1', currentUser);

      expect(result).toEqual({ attending: true });
    });
  });

  describe('rate', () => {
    it("lève une 404 si le concert n'existe pas", async () => {
      concertService.exists.mockResolvedValueOnce(false);

      await expect(
        controller.rate('concert-1', { value: 4 }, currentUser),
      ).rejects.toThrow(NotFoundException);
      expect(ratingService.rate).not.toHaveBeenCalled();
    });

    it("enregistre la note de l'utilisateur connecté", async () => {
      concertService.exists.mockResolvedValueOnce(true);

      await controller.rate('concert-1', { value: 4 }, currentUser);

      expect(ratingService.rate).toHaveBeenCalledWith('concert-1', 'user-1', 4);
    });
  });

  describe('addComment', () => {
    it("lève une 404 si le concert n'existe pas", async () => {
      concertService.exists.mockResolvedValueOnce(false);

      await expect(
        controller.addComment('concert-1', { content: 'Super !' }, currentUser),
      ).rejects.toThrow(NotFoundException);
      expect(commentService.create).not.toHaveBeenCalled();
    });

    it("crée le commentaire pour l'utilisateur connecté", async () => {
      concertService.exists.mockResolvedValueOnce(true);
      const created = { id: 'comment-1', content: 'Super !' };
      commentService.create.mockResolvedValueOnce(created);

      const result = await controller.addComment(
        'concert-1',
        { content: 'Super !' },
        currentUser,
      );

      expect(commentService.create).toHaveBeenCalledWith(
        'concert-1',
        'user-1',
        'Super !',
      );
      expect(result).toBe(created);
    });
  });

  describe('addPhoto', () => {
    const fakeFile = {
      buffer: Buffer.from('fake-image-content'),
      mimetype: 'image/jpeg',
      originalname: 'concert.jpg',
      size: 1024,
    } as Express.Multer.File;

    it("lève une 404 si le concert n'existe pas", async () => {
      concertService.exists.mockResolvedValueOnce(false);

      await expect(
        controller.addPhoto('concert-1', fakeFile, currentUser),
      ).rejects.toThrow(NotFoundException);
      expect(photoService.uploadForConcert).not.toHaveBeenCalled();
    });

    it("téléverse la photo pour l'utilisateur connecté", async () => {
      concertService.exists.mockResolvedValueOnce(true);
      const uploaded = {
        id: 'photo-1',
        url: 'https://example.com/reverb-media/concerts/concert-1/a.jpg',
        pseudo: 'ana-etoile',
        createdAt: new Date(),
      };
      photoService.uploadForConcert.mockResolvedValueOnce(uploaded);

      const result = await controller.addPhoto(
        'concert-1',
        fakeFile,
        currentUser,
      );

      expect(photoService.uploadForConcert).toHaveBeenCalledWith(
        'concert-1',
        'user-1',
        fakeFile,
      );
      expect(result).toBe(uploaded);
    });
  });
});
