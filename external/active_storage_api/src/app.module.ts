import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ShowController } from './show/show.controller';
import { ActiveStorageController } from './active_storage/active_storage.controller';

@Module({
  imports: [],
  controllers: [AppController, ShowController, ActiveStorageController],
  providers: [AppService],
})
export class AppModule {}
