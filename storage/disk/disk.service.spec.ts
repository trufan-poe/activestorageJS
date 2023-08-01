import { access, constants, rm } from 'node:fs/promises';
import configuration from '../../config/configuration';
import { DiskService } from './disk.service';
import { ActiveStorageJS } from '../../index';

const util = require('util');
const im = require('imagemagick');

describe('DiskService', () => {
  let service: DiskService;
  // const railsStorageDirectory = 'external/activestorage_ex_rails/storage/';
  const localKey = '3thAm8BFR5Jp1vW9H1u2XDDR';

  beforeAll(() => {
    service = configuration().activeStorage.service;
  });

  beforeEach(() => {
    service = new DiskService();
  });

  const resetStoragePath = () => {
    process.env.ELIXIR_STORAGE_PATH = './external/disk/storage';
  };

  const resetAssetHost = () => {
    process.env.ASSET_URL = 'http://localhost.test';
  };

  const saveFile = async (key: string) => {
    const identifyPromise = util.promisify(im.identify);
    await identifyPromise('test/files/image.jpg').then(async (image) => {
      process.env.rootPath = 'streamtest/files/';
      await service.upload(image, key);
    });
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

  const jwtFromUrl = (key: string, opts: any): string => {
    const jwt: string = service.url(key, opts);
    return jwt.split('/')[5];
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
      const pathFor = service.pathFor('asdf');
      expect(pathFor).toBe('/as/df/asdf');
      resetStoragePath();
    });
    it('Custom root paths are built into returned path', () => {
      process.env.ELIXIR_STORAGE_PATH = '/root/path';
      const pathFor = service.pathFor('asdf');
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
      try {
        await service.download(localKey);
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
        await service.upload(image, key);
        expect(await exists(service.pathFor(key))).toBeTruthy();
        await removeFile(service.pathFor(key));
      });
      resetStoragePath();
    });
  });
  describe('delete', () => {
    it('File is deleted if it exists', async () => {
      const key = 'test_key';
      await saveFile(key);
      await service.delete(key);
      expect(await exists(service.pathFor(key))).toBeFalsy();
      await removeFile(service.pathFor(key));
      resetStoragePath();
    });
    it("No error is thrown if a file doesn't exist", async () => {
      const key = 'super_fake_test_key';
      await service.delete(key);
      await removeFile(service.pathFor(key));
      resetStoragePath();
    });
  });
  describe('url', () => {
    it('The JWT contains disposition + filename, key, and content_type', async () => {
      const jwt = jwtFromUrl('test_key', {
        filename: 'test.png',
        disposition: 'inline',
        contentType: 'image/png'
      });
      const claims = new ActiveStorageJS().verifyMessage(jwt);
      expect(claims.key).toBe('test_key');
      expect(claims.disposition).toBe('inline; filename="test.png"');
      expect(claims.content_type).toBe('image/png');
    });
    it('A custom host can be specified', async () => {
      process.env.ASSET_URL = 'http://custom.host';
      service = new DiskService();

      const url: string = service.url('', { filename: '' });
      expect(url.startsWith('http://custom.host')).toBeTruthy();
      resetAssetHost();
    });

    it('The filename is present in the final URL', async () => {
      const url: string = service.url('', { filename: 'test.png' });
      expect(url.includes('/test.png')).toBeTruthy();
    });

    it('The full disposition is present in the final URL', async () => {
      const url: string = service.url('', { filename: 'test.png', disposition: 'inline' });
      expect(url.includes('disposition=inline%3B+filename%3D%22test.png%22')).toBeTruthy();
    });

    it('The content_type is present in the final URL', async () => {
      const url: string = service.url('', { filename: '', contentType: 'image/png' });
      expect(url.includes('content_type=image%2Fpng')).toBeTruthy();
    });

    it('Extra opts are discardedL', async () => {
      const url: string = service.url('', {
        filename: '',
        customThingy: 'omiitedIdeally'
      });
      expect(url.includes('omiitedIdeally')).toBeFalsy();
    });
  });
  describe('exists', () => {
    it('Returns true if a file with a given key exists', async () => {
      expect(await service.exists(localKey)).toBeTruthy();
    });
    it("Returns false if a file with a given key doesn't exist", async () => {
      expect(await service.exists('not_a_real_key')).toBeFalsy();
    });
  });
});
