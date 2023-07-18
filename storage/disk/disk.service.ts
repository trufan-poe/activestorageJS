import { StorageService } from '../service.abstract';
import config from '../../config/configuration';
import path from 'path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createReadStream } from 'fs';
export class DiskService extends StorageService {
  constructor() {
    super();
  }

  async download(key: string): Promise<any> {
    try {
      return await readFile(this.pathFor(key), { encoding: 'utf8' });
    } catch (err) {
      console.error(err.message);
    }
  }
  streamDownload(key: string, filepath: string): string {
    return;
  }

  /**
   * Saves an `%Image{}` to disk, as determined by a given `%Blob{}` or `%Variant{}` key
   *
   * @param {any} image
   * @param {string} key - The blob or variant's key
   * @return {string} Path on disk
   */
  upload(image: string, key: string): void {
    // try {
    //   await writeFile(path.dirname(this.pathFor(key)));
    //   return;
    // } catch (err) {
    //   console.error(err.message);
    //   throw Error(err.message);
    // }
    return;
  }
  delete(key: string, filepath: string): void {
    return;
  }
  url(key: string): void {
    return;
  }
  exists(key: string): boolean {
    return true;
  }
  /**
   * Returns the path on disk for a given `%Blob{}` or `%Variant{}` key
   *
   * @param {string} key - The blob or variant's key
   * @return {string} Path on disk
   */
  pathFor(key: string): string {
    return path.join(this.rootPath(), this.folderFor(key), key);
  }

  private async makePathFor(key: string): Promise<string> {
    try {
      await mkdir(path.dirname(this.pathFor(key)));
      return '';
    } catch (err) {
      console.error(err.message);
      throw Error(err.message);
    }
  }

  private folderFor(key: string): string {
    // [String.slice(key, 0..1), String.slice(key, 2..3)] |> Enum.join("/")
    return [key.slice(0, 1), key.slice(2, 3)].join('/');
  }

  private rootPath(): string {
    return config().activeStorage.rootPath;
  }

  private renameImage(image, key: string): any {
    // File copy current --> new path
    return image;
  }

  private disk_service_url(): string {
    return '';
  }
}
