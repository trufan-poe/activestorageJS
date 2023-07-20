/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe } from 'node:test';
import { StorageService } from './service.abstract';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    class ServiceClass extends StorageService {
      download(key: string) {
        return true;
      }

      upload(key: string, filepath: string): void {}

      streamDownload(key: string, filepath: string): string {
        return 'done';
      }

      url(key: string): void {}

      exists(key: string): boolean {
        return true || key.length === 0;
      }

      delete(key: string, filepath: string): void {}
    }

    service = new ServiceClass();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('contestDispositionWith', () => {
    it('Returns inline disposition if specified', () => {
      const disposition = service.contestDispositionWith('inline', '', []);
      expect(disposition.startsWith('inline')).toBe(true);
    });

    it('Returns attachment disposition if specified', () => {
      const disposition = service.contestDispositionWith('attachment', '', []);
      expect(disposition.startsWith('attachment')).toBe(true);
    });

    it('Returns inline disposition if specified disposition is invalid (close match)', () => {
      const disposition = service.contestDispositionWith('attachments', '', []);
      expect(disposition.startsWith('inline')).toBe(true);
    });

    it('Returns inline disposition if specified disposition is invalid', () => {
      const disposition = service.contestDispositionWith('something bad', '', []);
      expect(disposition.startsWith('inline')).toBe(true);
    });

    it('Returns a full, valid Content-Disposition string', () => {
      const disposition = service.contestDispositionWith('attachments', 'test.txt', []);
      expect(disposition === 'inline; filename="test.txt"').toBe(true);
    });

    it('Filenames are sanitized', () => {
      const disposition = service.contestDispositionWith('', ' some/\\<>thing: ', []);
      expect(disposition.includes('"something"')).toBe(true);
    });
  });

  describe('sanitize', () => {
    it('Strings are normalized against outside whitespace', () => {
      const tests = ['s', ' s', 's ', ' s ', '\n s    \n'];
      tests.forEach((element) => {
        const cleanedName = service.sanitize(element, {});
        expect(cleanedName.includes('s')).toBeTruthy();
      });
    });

    it('Strings are normalized against internal whitespace', () => {
      const tests = ['x x', 'x  x', 'x   x', 'x  |  x', 'x\tx', 'x\r\nx'];
      tests.forEach((element) => {
        const cleanedName = service.sanitize(element, {});
        expect(cleanedName.includes('x x')).toBeTruthy();
      });
    });

    it('Strings are truncated to 255 characters', () => {
      const longString = 'Z'.repeat(400);
      const cleanedName = service.sanitize(longString, {});
      expect(cleanedName.length).toBe(255);
    });

    it('Strings are truncated to 255 characters, less the padding', () => {
      const longString = 'Z'.repeat(400);
      const cleanedName = service.sanitize(longString, { padding: 10 });
      expect(cleanedName.length).toBe(245);
    });

    it('Sanitization ignores roman characters', () => {
      const cleanedName = service.sanitize('åbçdëf', {});
      expect(cleanedName).toBe('åbçdëf');
    });

    it('Sanitization ignores valid, extended characters', () => {
      const cleanedName = service.sanitize('笊, ざる.txt', {});
      expect(cleanedName).toBe('笊, ざる.txt');
    });

    it('Sanitization removes all filename-unsafe characters in isolation', () => {
      const tests = ['<', '>', '|', '/', '\\', '*', '?', ':'];
      tests.forEach((char) => {
        expect(service.sanitize(`a${char}`, {})).toBe('a');
        expect(service.sanitize(`${char}a`, {})).toBe('a');
        expect(service.sanitize(`a${char}a`, {})).toBe('aa');
      });
    });

    it('Sanitization removes filename-unsafe characters in combination', () => {
      expect(service.sanitize(' what\\ēver//wëird:înput:', {})).toBe('whatēverwëirdînput');
    });

    it('A fallback is provided if no input is given', () => {
      expect(service.sanitize('', {})).toBe('file');
    });

    it('A fallback is provided if no valid input is given', () => {
      expect(service.sanitize('\\:?', {})).toBe('file');
    });

    it('Custom fallback can be specified', () => {
      expect(service.sanitize('', { filenameFallback: 'customName' })).toBe('customName');
    });

    it('Sanitization removes all windows-unsafe strings', () => {
      const wrn = ['CON', 'lpt1', 'com4', 'aux ', 'LpT\x122'];
      wrn.forEach((word) => {
        expect(service.sanitize(word, {})).toBe('file');
      });
    });

    it('Filenames that begin with a dot are prepended with the default', () => {
      expect(service.sanitize('.txt', {})).toBe('file.txt');
    });

    it('Filenames that begin with a dot and invalid chars are prepended', () => {
      expect(service.sanitize('>.txt', {})).toBe('file.txt');
    });

    it('Filenames that begin with two dots are prepended with dots preserved', () => {
      expect(service.sanitize('..txt', {})).toBe('file..txt');
    });
  });
});
