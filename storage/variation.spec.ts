/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe } from 'node:test';
import Variation from './variation';

describe('Variation', () => {
  const imagePath = 'test/files/image.jpg';
  it('should be defined', () => {
    expect(Variation).toBeDefined();
  });

  describe('encode', () => {
    it('A list of transformations is encoded into a JWT', async () => {
      const token = Variation.encode([]);
      expect(atob(token)).toBeDefined();
    });
  });

  describe('decode', () => {
    it('A list of transformations is decoded from a JWT', async () => {
      const token = Variation.encode([{ foo: 'bar' }]);
      const transformations = Variation.decode(token);
      expect(transformations.pop()).toHaveProperty('foo');
    });
  });

  describe('transform', () => {
    it('A single operation can be performed', async () => {
      const image = await Variation.transform([{ resize: '100x100' }], imagePath);
      expect(image).toHaveProperty('filename');
    });
    it('Multiple operations have their order preserved', async () => {
      const image: any = await Variation.transform(
        [{ gravity: 'Center' }, { extent: '100x100' }],
        imagePath
      );
      expect(image.operations.pop()).toBe('extent');
      expect(image.operations.pop()).toBe('gravity');
    });
  });
});
