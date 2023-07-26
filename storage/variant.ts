import { ActiveStorageJS } from 'index';
import { createHash } from 'node:crypto';
import path from 'node:path';
import Variation from './variation';

const util = require('util');
const im = require('imagemagick');

const convertPromise = util.promisify(im.convert);

const activeStorage = new ActiveStorageJS();
const Variant = {
  /**
   * Returns an identifying key for a given `Blob{}` and set of transformations
   * @param blob - A `Blob{}` representing a root image. Presumably from the database
   * @param transformations - An ordered list of maps that represent valid ImageMagick commands
   */
  key: (blob, transformations) => {
    const variantKey = Variation.key(transformations);
    const hashedVariantKey = Variant.sha256(variantKey);
    return `variants/${blob.key}/${hashedVariantKey}`;
  },
  /**
   * Returns an identifying key for a given `Variant{}` and set of transformations
   * @param variant - A `Variant{}` representing a root image. Presumably from the database
   * @param transformations - An ordered list of maps that represent valid ImageMagick commands
   */
  keyFromVariant: (variant) => {
    const { transformations } = variant;
    delete variant.transformations;
    return Variant.key(variant, transformations);
  },
  /**
   * Returns a variant matching `blob` and `transformations`
   * or creates one if it doesn't exist
   *
   * @param blob - A `Blob` representing a root image. Presumably from the database
   * @param transformations - An ordered list of maps that represent valid ImageMagick commands
   */
  processed: async (blob, transformations): Promise<void> => {
    const variant = { ...blob, transformations };
    if (await Variant.isProcessed(variant)) return variant;

    return Variant.process(variant);
  },

  process: async (variant): Promise<void> => {
    const { key } = variant;
    const filepath = key + path.extname(variant.filename);
    const fullOperation = [filepath];
    await convertPromise(fullOperation)
      .then((result) => result)
      .catch((error) => {
        // console.log(error);
        throw new Error(error.message);
      });
  },
  /**
   * Returns a SHA256 hash using SHA-2 for the given `content`.
   *
   * @see https://en.wikipedia.org/wiki/SHA-2
   *
   * @param {String} content
   *
   * @returns {String}
   */
  sha256: (content) => createHash('sha256').update(content).digest('hex'),
  isProcessed: async (variant): Promise<boolean> =>
    activeStorage.service().exists(Variant.keyFromVariant(variant))
};
export default Variant;
