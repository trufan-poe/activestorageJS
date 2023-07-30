/* eslint-disable import/no-cycle */
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { rm } from 'node:fs/promises';
import { ActiveStorageJS } from '../../index';
import { StorageService } from '../service.abstract';
import configuration from '../../config/configuration';

/**
 * Wraps Amazon S3 as a storage service. Documentation mirrors that of `DiskService`.
 */
export class S3Service extends StorageService {
  client: any;

  constructor() {
    super();
    this.client = configuration().client;
  }

  /**
   * Returns a binary representation of an image from a given `%Blob{}` or `%Variant{}` key
   *
   * @param {key} - A `%Blob{}` or `%Variant{}`'s key
   */
  async download(key: string): Promise<any> {
    try {
      const output = await this.objectFor(key);
      return output;
    } catch (err) {
      throw Error(err.message);
    }
  }

  /**
   * Downloads and saves a file to disk in a streaming fashion.
   * Good for downloading large files
   *
   * @param {key} - A `%Blob{}` or `%Variant{}`'s key
   * @return {filepath} - The created path of the file
   */
  async streamDownload(key: string, filepath: string): Promise<string> {
    try {
      const writableStream = await createWriteStream(filepath);
      const inconmingMessage = await this.download(key);
      await pipeline(inconmingMessage, writableStream);
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
  async upload(image: any, key: string): Promise<boolean> {
    try {
      await this.putObjectFor(key, image);
      // this.removeTempFile(image.filename);
      return true;
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
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName(),
          Key: key
        })
      );
    } catch (error) {
      throw new Error(error.message);
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
      { key, disposition, content_type: opts.contentType },
      opts.tokenDuration === undefined ? null : opts.tokenDuration
    );
    return this.s3Url(verifiedKeyWithExpiration, {
      host: configuration().activeStorage.assetHost,
      disposition,
      contentType: opts.contentType,
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
      return await this.objectExists(key);
    } catch (error) {
      return false;
    }
  }

  private async objectFor(key: string): Promise<any> {
    try {
      const { Body } = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName(),
          Key: key
        })
      );
      return Body;
    } catch (error) {
      throw new Error(error);
    }
  }

  private async objectExists(key: string): Promise<any> {
    try {
      const { Body } = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName(),
          Key: key
        })
      );
      return Body;
    } catch (error) {
      if (error.Code === 'NoSuchKey') return false;
      throw new Error(error);
    }
  }

  private async putObjectFor(key: string, image: any): Promise<any> {
    try {
      const response = await this.client.send(
        new PutObjectCommand({
          Body: createReadStream(image.filename),
          Bucket: this.bucketName(),
          Key: key
        })
      );
      return response;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  private bucketName(): string {
    return configuration().activeStorage.s3Bucket;
  }

  private removeTempFile(filepath: string): void {
    try {
      rm(filepath, { force: true, maxRetries: 10, retryDelay: 100 });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  private s3Url(token, opts): string {
    const cleanedfilename = this.sanitize(opts.filename, {});
    const { contentType } = opts;
    const { disposition } = opts;
    const baseUrl = new URL(`${opts.host}/active_storage/s3/${token}/${cleanedfilename}`);
    baseUrl.searchParams.set('content_type', contentType);
    baseUrl.searchParams.set('disposition', disposition);
    return baseUrl.toString();
  }
}
