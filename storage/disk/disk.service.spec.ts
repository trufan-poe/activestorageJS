import { execSync } from 'child_process';
import { access, constants, rm } from 'node:fs/promises';
import configuration from '../../config/configuration';
import { DiskService } from './disk.service';

const util = require('util');
const im = require('imagemagick');

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

  const exists = async (filepath: string): Promise<boolean> => {
    try {
      await access(filepath, constants.R_OK || constants.W_OK);
      return true;
    } catch {
      return false;
    }
  };

  const removeFile = async (filepath: string): Promise<void> => {
    try {
      await rm(filepath, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    } catch (err) {
      throw Error(err.message);
    }
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
    it('Returns a file from a given key as binary', async () => {
      const downloadedFile = await service.download(localKey);
      expect(downloadedFile).toBeDefined();
    });
    it('Returns an error if the file cannot be found', async () => {
      process.env.ELIXIR_STORAGE_PATH = '/not/a/real/path';
      const newService = new DiskService();
      try {
        await newService.download(localKey);
      } catch (error) {
        expect(error.message).toBe('ENOENT');
      }
      resetStoragePath();
    });
  });
  describe('streamDownload', () => {
    it('An image is downloaded to the given filepath', async () => {
      const filepath = 'streamtest/files/streamed.jpg';
      const downloadedFile = await service.streamDownload(localKey, filepath);
      expect(await exists(downloadedFile)).toBeTruthy();
      await removeFile(filepath);
    });
    it('The filepath is returned upon success', async () => {
      const filepath = 'streamtest/files/streamed.jpg';
      const filepathReturned = await service.streamDownload(localKey, filepath);
      expect(filepathReturned).toBe(filepath);
      await removeFile(filepath);
    });
  });
  describe('upload', () => {
    it('An image is sucessfully saved to disk', async () => {
      const identifyPromise = util.promisify(im.identify);
      await identifyPromise('test/files/image.jpg').then(async (image) => {
        process.env.rootPath = 'streamtest/files/';
        const key = 'test_key';
        service = new DiskService();
        await service.upload(image, key);
        expect(await exists(service.pathFor(key))).toBeTruthy();
        expect(true).toBeTruthy();
        await removeFile(service.pathFor(key));
      });
      resetStoragePath();
    });
    it("Image directory is created if it doesn't exist", async () => {
      const identifyPromise = util.promisify(im.identify);
      await identifyPromise('test/files/image.jpg').then(async (image) => {
        process.env.rootPath = 'streamtest/files/';
        const key = 'non_existant_key';
        expect(await exists(service.pathFor(key))).toBeFalsy();
        service = new DiskService();
        await service.upload(image, key);
        expect(await exists(service.pathFor(key))).toBeTruthy();
        await removeFile(service.pathFor(key));
      });
      resetStoragePath();
    });
  });
});
