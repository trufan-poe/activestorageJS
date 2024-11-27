import { ActiveStorageJS } from '../index';

const util = require('util');
const im = require('imagemagick');

const activeStorage = new ActiveStorageJS();
const identifyPromise = util.promisify(im.identify);
/**
 * A set of transformations that can be applied to a blob to create a variant.
 */
const Variation = {
  /**
   * An alias for encode/
   */
  key: (transformations): string => Variation.encode(transformations),
  /**
   * Returns a base64 encoded string from an list of transformations
   *
   * @param {transformations} - `transformations`: A List of Maps representing the desired transformations
   */
  encode: (transformations): string => activeStorage.signMessage({ transformations }, null),
  /**
   * Returns a list of transformations from an encoded token
   *
   * @param {token} - `token`: `token`: A JWT representing transformations
   */
  decode: (token): any => {
    const claims = activeStorage.verifyMessage(token);
    return claims.transformations;
  },
  /**
   * Takes a map of `operations` and an `image_path`.  Each `operation` is then performed on
   * the image, returning the image with operations queued
   *
   * @param {operations} - `operations`: A List of Maps representing the desired transformations
   * @param {imagePath} - `imagePath`: The location of the base image
   */
  transform: async (operations, imagePath): Promise<any> => {
    let transformedImage = null;
    await identifyPromise(imagePath)
      .then(async (image) => {
        transformedImage = await Variation.applyTransformation(operations, image);
      })
      .catch((error) => {
        throw new Error(error.message);
      });
    return transformedImage;
  },
  applyTransformation: async (operations: any[], image): Promise<any> => {
    // Either no operations to perform or we have performed all operations
    if (operations.length === 0) {
      const afd = await Variation.identify(image);
      return afd;
    }
    // First pass, operations is not defined
    if (image.operations === undefined) image.operations = [];

    const convertPromise = util.promisify(im.convert);
    const operation = operations.shift();
    const operationName = Object.keys(operation)[0];
    const fullOperation = [
      image.filename,
      `-${operationName}`,
      operation[operationName],
      image.filename
    ];
    await convertPromise(fullOperation)
      .then(async () => {
        image.operations.push(operationName);
      })
      .catch((error) => {
        throw new Error(error.message);
      });
    return Variation.applyTransformation(operations, image);
  },
  identify: async (originalImage): Promise<any> => {
    let output = null;
    await identifyPromise(originalImage.filename).then(async (processed) => {
      processed.operations = originalImage.operations;
      output = processed;
    });
    return output;
  }
};

export default Variation;
