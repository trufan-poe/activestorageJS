/* eslint no-useless-escape: 0 */ // --> OFF
/* eslint  no-control-regex: 0 */

/**
 *Provides a base set of methods and behaviours that will be used across other service modules
 */
export abstract class StorageService {
  acceptableDispositions: string[] = ['inline', 'attachment'];

  abstract download(key: string): any;
  abstract streamDownload(key: string, filepath: string): Promise<string>;
  abstract upload(image: any, key: string): void;
  abstract delete(key: string, filepath: string): void;
  abstract url(key: string, opts: any): string;
  abstract exists(key: string): Promise<boolean>;

  /**
   * Returns a valid Content-Disposition string from a provided
   * disposition type and a filename
   *
   * @param {string} name - The filename to sanitize
   * @param {string} filename - The name of the given file
   * @param {any} opts - Optional sanitization settings.  Can controll padding or fallback filenames
   */
  contestDispositionWith(type: string, filename: string, opts: any): string {
    return `${this.cleanedType(type)}; filename="${this.sanitize(filename, opts)}"`;
  }

  cleanedType(type: string): string {
    return this.acceptableDispositions.includes(type) ? type : 'inline';
    const pipe =
      <T>(...fns: Array<(arg: T) => T>) =>
      (value: T) =>
        fns.reduce((acc, fn) => fn(acc), value);
  }

  /**
   * Takes a given filename and normalizes, filters and truncates it.
   * if extra breathing room is required (for example to add your own filename
   * extension later), you can leave extra room with the padding parameter
   *
   * @param {string}  name - The filename to sanitize
   * @param {any} opts - Optional sanitization settings.  Can controll padding or fallback filenames
   */
  sanitize(name: string, opts: any): string {
    const padding = opts.padding || 0;
    const filenameFallback = opts.filenameFallback || 'file';
    let cleanedName = name
      .trim()
      .replace(/\s+/u, ' ')
      .slice(0, 255 - padding)
      .replace(/[\x00-\x1F\/\\:\*\?\"<>\|]/g, '')
      .replace(/\s+/u, ' ');

    cleanedName = this.filterWindowsReservedNames(cleanedName, filenameFallback);
    cleanedName = this.filterDots(cleanedName, filenameFallback);
    cleanedName = this.filenameFallback(cleanedName, filenameFallback);
    return cleanedName;
  }

  filenameFallback(name: string, fallback: string): string {
    return name.length === 0 ? fallback : name;
  }

  filterWindowsReservedNames(name: string, fallback: string) {
    const wrn = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9'
    ];
    // TODO: add fallback code here
    return wrn.includes(name.toUpperCase()) ? fallback : name;
  }

  filterDots(name: string, fallback: string): string {
    return name.startsWith('.') ? `${fallback}${name}` : name;
  }
}
