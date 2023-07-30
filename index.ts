/* eslint-disable import/no-cycle */
import { verify, sign, JsonWebTokenError } from 'jsonwebtoken';
import configuration from './config/configuration';
import { StorageService } from './storage/service.abstract';

export class ActiveStorageJS {
  /**
   * Returns the service module specified in config
   *
   * @return {StorageService}
   */
  service(): StorageService {
    return configuration().activeStorage.service;
  }

  /**
   * Returns a given environment/config variable by its name
   *
   * @param {string} name - The environment variable you want to fetch
   * @return {any} Env Variable
   */
  env(name): string {
    return configuration().activeStorage[name];
  }

  /**
   *  Returns a URL-safe base64 encoded string representing a JWT.
   *  An expiration can optionally be specified
   *
   * @param {any} payload - The Map you want to encode
   * @param {any} tokenDuration: The token expiration.  Leave `nil` to generate
   *  a non-expiring token
   * @return {strign} URL-Safe signed string
   */
  signMessage(payload, tokenDuration): any {
    let token = null;
    if (tokenDuration === null) {
      token = sign(payload, configuration().activeStorage.jwtSecret, {
        algorithm: 'HS256',
        noTimestamp: true
      });
    } else {
      token = sign(payload, configuration().activeStorage.jwtSecret, {
        algorithm: 'HS256',
        expiresIn: tokenDuration
      });
    }
    return btoa(token);
  }

  /**
   *  Returns a URL-safe base64 encoded string representing a JWT.
   *  An expiration can optionally be specified
   *
   * @param {any} encodedToken - The token you want to decode
   * @return {any} claims
   */
  verifyMessage(encodedToken): any {
    let payload;
    try {
      payload = verify(atob(encodedToken), configuration().activeStorage.jwtSecret);
      return payload;
    } catch (e) {
      if (e instanceof JsonWebTokenError) {
        throw new Error(e.message);
      }
      throw new Error(e.message);
    }
  }

  /**
   *  Returns the future timestamp days from now
   *
   * @param {number} n - The number of days to add to this moment
   * @return {number} Unix timestamp n days from now
   */
  daysFromNow(n: number): number {
    return Math.floor(+new Date() / 1000) + n * 24 * 60 * 60;
  }
}
