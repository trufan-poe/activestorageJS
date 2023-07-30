import { Test, TestingModule } from '@nestjs/testing';
import { ActiveStorageController } from './active_storage.controller';

describe('ActiveStorageController', () => {
  let controller: ActiveStorageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ActiveStorageController],
    }).compile();

    controller = module.get<ActiveStorageController>(ActiveStorageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
