/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe } from 'node:test';
import { stat, rm } from 'node:fs/promises';
import { ActiveStorageJS } from 'index';
import Variant from './variant';
import { DiskService } from './disk/disk.service';

const util = require('util');
const im = require('imagemagick');

const identifyPromise = util.promisify(im.identify);

describe('Variant', () => {
  const imagePath = 'test/files/image.jpg';
  const localKey = '3thAm8BFR5Jp1vW9H1u2XDDR';
  const mockBlob = {
    key: localKey,
    filename: 'foo.png',
    content_type: 'image/png'
  };
  const mockTransformations = [{ resize: '50x50^' }];
  const mockVariant = {
    ...mockBlob,
    transformations: mockTransformations
  };
  let variant = null;

  const resetStoragePath = () => {
    process.env.ELIXIR_STORAGE_PATH = './external/disk/storage';
  };

  const removeFile = async (filepath: string): Promise<void> => {
    try {
      await rm(filepath, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    } catch (err) {
      throw Error(err.message);
    }
  };

  const claimsFromURL = (url: string) => {
    const token = url.split('/')[5];
    return new ActiveStorageJS().verifyMessage(token);
  };

  beforeEach(() => {
    variant = new Variant();
  });
  // it('should be defined', () => {
  //   expect(Variant).toBeDefined();
  // });
  // describe('key', () => {
  //   it("A variant key includes the root blob's key", () => {
  //     expect(variant.key(mockBlob, [])).toContain(localKey);
  //   });
  //   it('A variant key includes a unique hash of the transformations', () => {
  //     const variantKey1 = variant.key(mockBlob, [{ resize: '1x1' }]);
  //     const variantKey2 = variant.key(mockBlob, [{ extent: '1x1' }]);

  //     expect(variantKey1 === variantKey2).toBe(false);
  //   });
  // });
  // describe('keyFromVariant', () => {
  //   it('A variant can be provided instead of a blob + transformation', async () => {
  //     const variantKey: string = variant.keyFromVariant(mockVariant);
  //     expect(variantKey).toBeDefined();
  //   });
  // });
  // describe('processed', () => {
  //   it('Returns a variant directly if it exists', async () => {
  //     const key: string = variant.key(mockBlob, mockTransformations);
  //     const fileStatBefore = await stat(new DiskService().pathFor(key));
  //     await variant.processed(mockBlob, mockTransformations);
  //     const fileStatAfter = await stat(new DiskService().pathFor(key));
  //     expect(fileStatAfter).toEqual(fileStatBefore);
  //   });
  //   it("Creates a new variant if it doesn't exist", async () => {
  //     process.env.ELIXIR_STORAGE_PATH = 'streamtest/files/';
  //     variant = new Variant();
  //     const diskService = new DiskService();
  //     const updatedBlob = { ...mockBlob, key: 'TFJvzLbsfxgFnMY52mz65p5j' };
  //     const variantKey: string = variant.keyFromVariant({
  //       ...updatedBlob,
  //       transformations: mockTransformations
  //     });
  //     expect(await diskService.exists(variantKey)).toBeFalsy();
  //     await variant.processed(updatedBlob, mockTransformations);
  //     expect(await diskService.exists(variantKey)).toBeTruthy();
  //     await removeFile(diskService.pathFor(variantKey));
  //     resetStoragePath();
  //   });
  //   it('New variants have transformations applied', async () => {
  //     process.env.ELIXIR_STORAGE_PATH = 'streamtest/files/';
  //     variant = new Variant();
  //     const diskService = new DiskService();
  //     const updatedBlob = { ...mockBlob, key: 'TFJvzLbsfxgFnMY52mz65p5j' };
  //     const customTransformations = [{ resize: '75x75^' }, { extent: '75x75' }];
  //     const variantKey: string = variant.keyFromVariant({
  //       ...updatedBlob,
  //       transformations: customTransformations
  //     });

  //     await variant.processed(updatedBlob, customTransformations);

  //     await identifyPromise(diskService.pathFor(variantKey)).then((image) => {
  //       expect(image.height).toBe(75);
  //       expect(image.width).toBe(75);
  //     });
  //     await removeFile(diskService.pathFor(variantKey));
  //     resetStoragePath();
  //   });
  //   it('Variants are formatted as PNG if they have an invalid content_type', async () => {
  //     process.env.ELIXIR_STORAGE_PATH = 'streamtest/files/';
  //     variant = new Variant();
  //     const diskService = new DiskService();
  //     const updatedBlob = {
  //       ...mockBlob,
  //       key: 'TFJvzLbsfxgFnMY52mz65p5j',
  //       content_type: 'fake/bad'
  //     };
  //     const variantKey: string = variant.keyFromVariant({
  //       ...updatedBlob,
  //       transformations: mockTransformations
  //     });

  //     await variant.processed(updatedBlob, mockTransformations);

  //     await identifyPromise(diskService.pathFor(variantKey)).then((image) => {
  //       expect(image.format).toBe('PNG');
  //       expect(image['mime type']).toBe('image/png');
  //     });
  //     await removeFile(diskService.pathFor(variantKey));
  //     resetStoragePath();
  //   });
  // });
  describe('serviceURL', () => {
    it('A URL is created from a Blob and transformations', () => {
      const url = new URL(variant.serviceURL(mockBlob, mockTransformations));
      expect(url.host).toBeDefined();
      expect(url.protocol).toBeDefined();
    });
    it('A URL contains specified content_type and filename', () => {
      const blob = {
        key: localKey,
        filename: 'custom.jpg',
        content_type: 'image/jpg'
      };
      const url = variant.serviceURL(blob, mockTransformations);
      const claims = claimsFromURL(url);
      expect(claims.content_type).toBe(blob.content_type);
      expect(claims.disposition).toContain(blob.filename);
    });
    it("A URL's content_type defaults to png if image is invalid", () => {
      const blob = {
        key: localKey,
        filename: 'custom.jpg',
        content_type: 'fake/bad'
      };
      const url = variant.serviceURL(blob, mockTransformations);
      const claims = claimsFromURL(url);
      expect(claims.content_type).toBe('image/png');
    });
    it("A URL's filename defaults to png if image is invalid", () => {
      const blob = {
        key: localKey,
        filename: 'custom.bad',
        content_type: 'fake/bad'
      };
      const url = variant.serviceURL(blob, mockTransformations);
      const claims = claimsFromURL(url);
      expect(claims.disposition).toContain('custom.bad.png');
    });
  });
  describe('variantServiceURL', () => {
    it('A URL is created from a Variant', () => {
      const url = new URL(variant.variantServiceURL(mockVariant));
      expect(url.host).toBeDefined();
      expect(url.protocol).toBeDefined();
    });
  });
});
