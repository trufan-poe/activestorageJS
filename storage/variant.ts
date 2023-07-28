import { ActiveStorageJS } from 'index';
import { createHash } from 'node:crypto';
import { rm } from 'node:fs/promises';
import configuration from 'config/configuration';
import Variation from './variation';

const path = require('node:path');

const util = require('util');
const im = require('imagemagick');

const convertPromise = util.promisify(im.convert);
const webImageContentTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];

class Variant {
  /**
   * Returns a URL with the information required to represent a Blob,
   * taking the current file service into account.
   *
   * @param blob A `Blob` representing a root image. Presumably from the database
   * @param transformations An ordered list of maps that represent valid ImageMagick commands
   * @returns a service URL from a variant directly
   */
  serviceURL(blob, transformations): string {
    const key = this.key(blob, transformations);
    return new ActiveStorageJS().service().url(key, {
      contentType: this.contentType(blob),
      filename: this.filename(blob),
      tokenDuration: configuration().activeStorage.linkExpiration
    });
  }

  /**
   * Returns a URL with the information required to represent a variant,
   * taking the current file service into account.
   *
   * Delgates to `serviceUrl(blob, transformations)`
   *
   * @param variant A `Blob` representing a root image. Presumably from the database
   * @returns a service URL from a variant directly
   */
  variantServiceURL(variant): string {
    const blob = { ...variant };
    const transformations = variant.transformations.slice();
    delete blob.transformations;
    return this.serviceURL(blob, transformations);
  }

  /**
   * Returns an identifying key for a given `Blob{}` and set of transformations
   * @param blob - A `Blob{}` representing a root image. Presumably from the database
   * @param transformations - An ordered list of maps that represent valid ImageMagick commands
   */
  key(blob, transformations): any {
    const key = Variation.key(transformations);
    const hashedVariantKey = this.sha256(key);
    return `variants/${blob.key}/${hashedVariantKey}`;
  }

  /**
   * Returns an identifying key for a given `Variant{}` and set of transformations
   * @param variant - A `Variant{}` representing a root image. Presumably from the database
   * @param transformations - An ordered list of maps that represent valid ImageMagick commands
   */
  keyFromVariant(variant): any {
    const blob = {
      ...variant
    };
    delete blob.transformations;
    return this.key(blob, variant.transformations);
  }

  /**
   * Returns a variant matching `blob` and `transformations`
   * or creates one if it doesn't exist
   *
   * @param blob - A `Blob` representing a root image. Presumably from the database
   * @param transformations - An ordered list of maps that represent valid ImageMagick commands
   */
  async processed(blob, transformations): Promise<void> {
    const variant = { ...blob, transformations };
    const isProcessed = await this.isProcessed(variant);
    if (isProcessed) return variant;
    return this.process(variant);
  }

  async process(variant): Promise<void> {
    const { key } = variant;
    const filepath = key + path.extname(variant.filename);
    const fullOperation = ['-size', '50x50', 'xc:white', filepath];
    await convertPromise(fullOperation)
      .then(async () => {
        await this.transform(filepath, variant);
        await this.format(filepath, variant);
        await this.upload(filepath, variant);
      })
      .catch((error) => {
        throw new Error(error.message);
      });

    return variant;
  }

  /**
   * Returns a SHA256 hash using SHA-2 for the given `content`.
   *
   * @see https://en.wikipedia.org/wiki/SHA-2
   *
   * @param {String} content
   *
   * @returns {String}
   */
  sha256(content): string {
    return createHash('sha256').update(content).digest('hex');
  }

  async isProcessed(variant): Promise<boolean> {
    return new ActiveStorageJS().service().exists(this.keyFromVariant(variant));
  }

  async transform(imagePath, variant): Promise<void> {
    const operations = variant.transformations === undefined ? [] : [...variant.transformations];
    try {
      await Variation.transform(operations, imagePath);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async downloadImage(key, filepath): Promise<void> {
    await new ActiveStorageJS().service().streamDownload(key, filepath);
  }

  async format(imagePath, variant): Promise<any> {
    if (this.invalidImageContentType(variant)) {
      const newImagePath = `${imagePath.split('.')[0]}.png`;
      try {
        await convertPromise([imagePath, newImagePath]);
      } catch (error) {
        throw new Error(error.message);
      }
      return newImagePath;
    }
    return imagePath;
  }

  invalidImageContentType(variant): boolean {
    return webImageContentTypes.includes(variant.content_type);
  }

  async upload(imagePath, variant): Promise<void> {
    return new ActiveStorageJS()
      .service()
      .upload({ filename: imagePath }, this.keyFromVariant(variant));
  }

  async removeFile(filepath: string): Promise<void> {
    try {
      await rm(filepath, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    } catch (err) {
      throw Error(err.message);
    }
  }

  contentType(blob): string {
    return this.invalidImageContentType(blob) ? blob.content_type : 'image/png';
  }

  filename(blob): string {
    return this.invalidImageContentType(blob)
      ? blob.filename
      : `${path.basename(blob.filename)}.png`;
  }
}
export default Variant;
