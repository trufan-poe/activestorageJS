/* eslint-disable @typescript-eslint/no-unused-vars */
import { ActiveStorageJS } from './index';
import { describe } from 'node:test';
import { DiskService } from './storage/disk/disk.service';
import { verify, sign, validate } from 'jsonwebtoken';
import configuration from 'config/configuration';
describe('StorageService', () => {
  let activeStorage: ActiveStorageJS;
  activeStorage = new ActiveStorageJS();
  it('should be defined', () => {
    expect(activeStorage).toBeDefined();
  });

  describe('env', () => {
    it('It reads environment variables', () => {
      expect(activeStorage.env('rootPath')).toBe(
        process.env.ELIXIR_STORAGE_PATH,
      );
    });
  });

  describe('service', () => {
    it('It returns a service module', () => {
      expect(typeof activeStorage.service()).toBe(typeof new DiskService());
      const disposition = activeStorage
        .service()
        .contestDispositionWith('inline', '', []);
      expect(disposition.startsWith('inline')).toBe(true);
    });
  });

  describe('signMessage', () => {
    it('A signed JWT is returned as a base64 string', () => {
      const base64RegExp =
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
      const isBase64 = (str) => base64RegExp.test(str);
      expect(isBase64(activeStorage.signMessage({}, null))).toBe(true);
    });
    it('A JWT is returned with no expiration', () => {
      const signedMessage = activeStorage.signMessage({}, null);
      const verifiedMessage = activeStorage.verifyMessage(signedMessage);
      expect(verifiedMessage.exp).toBeGreaterThan(verifiedMessage.iat);
    });
    it('A JWT with no expiration and the same payload always returns the same result', () => {
      const signedMessage1 = activeStorage.signMessage({ foo: 'bar' }, null);
      const signedMessage2 = activeStorage.signMessage({ foo: 'bar' }, null);
      expect(signedMessage1).toBe(signedMessage2);
    });
    it('The JWT can be given an expiration in the future and be verified', () => {
      const signedMessage = activeStorage.signMessage({}, 60);
      const verifiedMessage = activeStorage.verifyMessage(signedMessage);
      expect(verifiedMessage.exp).toBeGreaterThan(verifiedMessage.iat);
    });
    it('The JWT cannot be verified if the expiration time has passed', () => {
      const signedMessage = activeStorage.signMessage({}, -60);
      expect(() => {
        activeStorage.verifyMessage(signedMessage);
      }).toThrow(new Error('jwt expired'));
    });
  });
  describe('verifyMessage', () => {
    it('A generic error is returned for an invalid JWT', () => {
      const badToken = sign({}, 'gZH75aKtMN3Yj0iPS4hcgUuTwjAzZr9C', {
        algorithm: 'HS256',
      });
      expect(() => {
        activeStorage.verifyMessage(btoa(badToken));
      }).toThrow(new Error('invalid signature'));
    });
  });
});
