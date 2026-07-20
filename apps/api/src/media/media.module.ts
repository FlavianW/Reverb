import { Module } from '@nestjs/common';
import { InternalVideoController } from './internal-video.controller';
import { S3Service } from './s3.service';

@Module({
  controllers: [InternalVideoController],
  providers: [S3Service],
  exports: [S3Service],
})
export class MediaModule {}
