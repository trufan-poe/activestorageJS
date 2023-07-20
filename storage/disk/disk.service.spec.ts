import { execSync } from 'child_process';
import configuration from '../../config/configuration';
import { DiskService } from './disk.service';

describe('DiskService', () => {
  let service: DiskService;
  // const railsStorageDirectory = 'external/activestorage_ex_rails/storage/';
  const rakefilePath = 'external/activestorage_ex_rails';
  const localKey = execSync(`cd ${rakefilePath}; bundle exec rake get_local_upload_key`).toString();

  beforeAll(() => {
    service = configuration().activeStorage.service;
  });

  const resetStoragePath = () => {
    process.env.ELIXIR_STORAGE_PATH = './external/activestorage_ex_rails/storage';
  };

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('pathFor', () => {
    it('Directories of returned path are based off key name', () => {
      const pathFor = service.pathFor('asdf');
      expect(pathFor).toContain('as/df');
    });
    it('Directories of variants are represented correctly', () => {
      const pathFor = service.pathFor('variant/blob_key/variant_key');
      expect(pathFor).toContain('/va/ri/variant/blob_key/variant_key');
    });
    it('Filename of returned path is the key name', () => {
      const pathFor = service.pathFor('asdf');
      expect(pathFor.split('/').pop()).toBe('asdf');
    });
    it('Returned path is built based off of key name', () => {
      process.env.ELIXIR_STORAGE_PATH = '/';
      const newService = new DiskService();
      const pathFor = newService.pathFor('asdf');
      expect(pathFor).toBe('/as/df/asdf');
      resetStoragePath();
    });
    it('Custom root paths are built into returned path', () => {
      process.env.ELIXIR_STORAGE_PATH = '/root/path';
      const newService = new DiskService();
      const pathFor = newService.pathFor('asdf');
      expect(pathFor).toBe('/root/path/as/df/asdf');
      resetStoragePath();
    });
  });
  describe('download', () => {
    // it('Returns a file from a given key as binary', async () => {
    //   const downloadedFile = await service.download(localKey);
    //   expect(downloadedFile).toBeDefined();
    // });
    it('Returns an error if the file cannot be found', () => {
      process.env.ELIXIR_STORAGE_PATH = '/not/a/real/path';
      const newService = new DiskService();
      try {
        newService.download(localKey);
      } catch (error) {
        expect(error).toBe('ENOENT');
      }
      resetStoragePath();
    });
  });
});
