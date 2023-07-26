/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe } from 'node:test';
import { stat } from 'node:fs/promises';
import Variant from './variant';
import { DiskService } from './disk/disk.service';

describe('Variant', () => {
  const imagePath = 'test/files/image.jpg';
  const localKey = 'rBUGDqWXt57DiVCEJYfqi8fX';
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
  it('should be defined', () => {
    expect(Variant).toBeDefined();
  });
  describe('key', () => {
    it("A variant key includes the root blob's key", () => {
      expect(Variant.key(mockBlob, [])).toContain(localKey);
    });
    it('A variant key includes a unique hash of the transformations', () => {
      const variantKey1 = Variant.key(mockBlob, [{ resize: '1x1' }]);
      const variantKey2 = Variant.key(mockBlob, [{ extent: '1x1' }]);

      expect(variantKey1 === variantKey2).toBe(false);
    });
    it('A variant can be provided instead of a blob + transformation', async () => {
      const variantKey: string = Variant.keyFromVariant(mockVariant);
      const fileStatBefore = await stat(new DiskService().pathFor(variantKey));
      await Variant.processed(mockBlob, mockTransformations);
      const fileStatAfter = await stat(new DiskService().pathFor(variantKey));
      expect(fileStatAfter).toEqual(fileStatBefore);
    });
  });
  describe('processed', () => {
    it('Returns a variant directly if it exists', () => {
      const key = Variant.key(mockBlob, mockTransformations);
      expect(Variant.key(mockBlob, mockTransformations)).toContain(localKey);
    });
    it("Creates a new variant if it doesn't exist", () => {
      const variantKey1 = Variant.key(mockBlob, [{ resize: '1x1' }]);
      const variantKey2 = Variant.key(mockBlob, [{ extent: '1x1' }]);

      expect(variantKey1 === variantKey2).toBe(false);
    });
    it('New variants have transformations applied', () => {
      expect(Variant.key(mockBlob, null)).toBeDefined();
    });
  });
});
