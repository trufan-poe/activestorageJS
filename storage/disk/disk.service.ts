/* eslint-disable import/no-cycle */
import { join, dirname } from 'node:path';
import { readFile, writeFile, mkdir, rm, copyFile, access, constants } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { ActiveStorageJS } from 'index';
import { pipeline } from 'node:stream/promises';
import config from '../../config/configuration';
import { StorageService } from '../service.abstract';
/**
 * Wraps a local disk path as an ActivestorageEx service.
 *
 * `:root_path` in your config must be set.  Both blobs and
 * variants are stored in folders with `:root_path` as the root
 */
export class DiskService extends StorageService {
  /**
   * Returns a binary representation of an image from a given `%Blob{}` or `%Variant{}` key
   *
   * @param {key} - A `%Blob{}` or `%Variant{}`'s key
   */
  async download(key: string): Promise<any> {
    try {
      return await readFile(this.pathFor(key));
    } catch (err) {
      throw Error(err.code);
    }
  }

  /**
   * Downloads and saves a file to disk in a streaming fashion.
   * Good for downloading large files
   *
   * @param {key} - A `%Blob{}` or `%Variant{}`'s key
   * @param {filepath} - The desired filepath.  Note that directories will not be created
   * @return {filepath} - The created path of the file
   */
  async streamDownload(key: string, filepath: string): Promise<string> {
    try {
      await mkdir(dirname(filepath), { recursive: true });
      const readableStream = await createReadStream(this.pathFor(key), {
        start: 0,
        end: 5 * 1024 * 1024
      });
      const writableStream = await createWriteStream(filepath);
      await pipeline(readableStream, writableStream);
      return filepath;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Saves an `%Image{}` to disk, as determined by a given `%Blob{}` or `%Variant{}` key
   *
   * @param {any} image
   * @param {string} key - The blob or variant's key
   * @return {string} Path on disk
   */
  async upload(image: any, key: string): Promise<void> {
    try {
      await writeFile(dirname(this.pathFor(key)), image);
    } catch (err) {
      throw new Error(err);
    }
  }

  /**
   * Deletes an image based on its `key`
   *
   * @param key - The blob or variant's key
   * @returns void
   */
  async delete(key: string): Promise<void> {
    try {
      await rm(dirname(this.pathFor(key)), { force: true, maxRetries: 10, retryDelay: 100 });
    } catch (err) {
      throw Error(err.message);
    }
  }

  /**
   * Creates a URL with a signed token that represents an attachment's
   * content type, disposition, and key.
   *
   * @param key - A `%Blob{}` or `%Variant{}`'s key
   * @param opts - A Map containing the following data:
   * ```js
   *      {
   *       disposition: string, // Optional, but recommended
   *       filename: string, // Required
   *       contentType: string, // Required
   *       tokenDuration: null | number // Optional.  `null` will generate a long living URL
   *      }
   * ```
   * @returns URL
   */
  url(key: string, opts: any): string {
    const disposition = this.contestDispositionWith(opts.disposition, opts.filename, {});
    const verifiedKeyWithExpiration = new ActiveStorageJS().signMessage(
      { key, disposition, contentType: opts.contentType },
      opts.tokenDuration
    );
    return this.diskServiceUrl(verifiedKeyWithExpiration, {
      host: config().activeStorage.assetHost,
      disposition,
      content_type: opts.contentType,
      filename: opts.filename
    });
  }

  /**
   *
   * @param key - The blob or variant's key
   * @returns true if the file exists and false if the file does not exist.
   */
  async exists(key: string): Promise<boolean> {
    try {
      await access(this.pathFor(key), constants.R_OK || constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the path on disk for a given `%Blob{}` or `%Variant{}` key
   *
   * @param {string} key - The blob or variant's key
   * @return {string} Path on disk
   */
  pathFor(key: string): string {
    return join(this.rootPath(), this.folderFor(key), key);
  }

  private async makePathFor(key: string): Promise<boolean> {
    try {
      await mkdir(dirname(this.pathFor(key)));
      return true;
    } catch (err) {
      throw Error(err.message);
    }
  }

  private folderFor(key: string): string {
    return [key.slice(0, 2), key.slice(2, 4)].join('/');
  }

  private rootPath(): string {
    return config().activeStorage.rootPath;
  }

  private async renameImage(image, key: string): Promise<any> {
    // File copy current --> new path
    try {
      await copyFile(image.path, this.pathFor(key));
      await rm(image.path);
      return image;
    } catch {
      throw new Error('The file could not be copied');
    }
  }

  private diskServiceUrl(token, opts): string {
    const cleanedfilename = this.sanitize(opts.filename, {});
    const { contentType } = opts;
    const { disposition } = opts;
    const baseUrl = new URL(`${opts.host}/active_storage/disk/${token}/${cleanedfilename}`);
    baseUrl.searchParams.set('content_type', contentType);
    baseUrl.searchParams.set('disposition', disposition);
    return baseUrl.toString();
  }
}
