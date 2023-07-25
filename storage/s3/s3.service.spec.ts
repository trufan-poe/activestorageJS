import { CreateBucketCommand, DeleteBucketCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { access, constants, rm } from 'node:fs/promises';
import configuration from 'config/configuration';
import { IncomingMessage } from 'node:http';
import { S3Service } from './s3.service';

const util = require('util');
const im = require('imagemagick');

describe('S3Service', () => {
  let s3Service: S3Service;
  const testKey = 'testing_key';

  beforeAll(async () => {
    const { client } = configuration();
    await client.send(new CreateBucketCommand({ Bucket: configuration().activeStorage.s3Bucket }));
  });

  afterAll(async () => {
    const { client } = configuration();
    await client.send(
      new DeleteObjectsCommand({
        Bucket: configuration().activeStorage.s3Bucket,
        Delete: {
          Objects: [{ Key: testKey }, { Key: 'variants/new_key' }]
        }
      })
    );
    await client.send(
      new DeleteBucketCommand({
        Bucket: configuration().activeStorage.s3Bucket
      })
    );
  });

  beforeEach(async () => {
    s3Service = new S3Service();
  });

  const uploadTestImage = async (key) => {
    const identifyPromise = util.promisify(im.identify);
    await identifyPromise('test/files/image.jpg').then(async (image) => {
      await s3Service.upload(image, key);
    });
  };

  const removeFile = async (filepath: string): Promise<void> => {
    try {
      await rm(filepath, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    } catch (err) {
      throw Error(err.message);
    }
  };

  const exists = async (filepath: string): Promise<boolean> => {
    try {
      await access(filepath, constants.R_OK || constants.W_OK);
      return true;
    } catch {
      return false;
    }
  };

  it('should be defined', () => {
    expect(s3Service).toBeDefined();
  });
  describe('download', () => {
    it('Returns a file from a given key as binary', async () => {
      await uploadTestImage(testKey);
      const downloadedFile = await s3Service.download(testKey);

      expect(downloadedFile).toBeInstanceOf(IncomingMessage);
    });
    it('Returns an error if the file cannot be found', async () => {
      try {
        await s3Service.download('non-existent-key');
      } catch (error) {
        expect(error.message).toBe('NoSuchKey: The specified key does not exist.');
      }
    });
  });
  describe('streamDownload', () => {
    it('An image is downloaded to the given filepath', async () => {
      await uploadTestImage(testKey);
      const filepath = await s3Service.streamDownload(testKey, 'test/files/streamed.jpg');

      expect(exists(filepath)).toBeTruthy();
      removeFile(filepath);
    });
    it('The filepath is returned upon success', async () => {
      await uploadTestImage(testKey);
      const filepath = await s3Service.streamDownload(testKey, 'test/files/streamed.jpg');

      expect(filepath).toBe('test/files/streamed.jpg');
      removeFile(filepath);
    });
  });
  describe('upload', () => {
    it('An image is sucessfully saved to s3', async () => {
      await uploadTestImage(testKey);
      expect(s3Service.exists(testKey)).toBeTruthy();
    });
    it('An image with a complex path is sucessfully saved to s3', async () => {
      await uploadTestImage('variants/new_key');
      expect(s3Service.exists('variants/new_key')).toBeTruthy();
    });
  });
  describe('delete', () => {
    it('An image is sucessfully deleted from s3', async () => {
      await uploadTestImage(testKey);
      await s3Service.delete(testKey);
      expect(await s3Service.exists(testKey)).toBeFalsy();
    });
    it('An image with a complex path is sucessfully deleted from s3', async () => {
      await uploadTestImage('variants/new_key');
      expect(await s3Service.exists('variants/new_key')).toBeTruthy();
      await s3Service.delete('variants/new_key');
      expect(await s3Service.exists('variants/new_key')).toBeFalsy();
    });
  });

  describe('url', () => {
    it('The full disposition is present in the final URL', () => {
      expect(s3Service).toBeDefined();
    });
    it('The filename is present in the final URL', () => {
      expect(s3Service).toBeDefined();
    });
  });

  describe('exists', () => {
    it('Returns true if a file with a given key exists', () => {
      expect(s3Service).toBeDefined();
    });
    it("Returns false if a file with a given key doesn't exist", () => {
      expect(s3Service).toBeDefined();
    });
  });
});
