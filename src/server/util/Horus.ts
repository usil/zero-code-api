import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import ErrorForNext from './ErrorForNext';
import { getConfig } from '../../../config/main.config';

class Horus {
  horusEndpoint: string;
  configuration = getConfig();

  constructor(horusEndpoint: string) {
    this.horusEndpoint = horusEndpoint;
  }

  sendSecurityRequest = (permissionString: string) => {
    return async (_req: Request, _res: Response, next: NextFunction) => {
      try {
        const result = await axios.post(this.horusEndpoint, {
          token: this.configuration.customSecurity.token,
          permission: permissionString,
          appIdentifier: this.configuration.customSecurity.appIdentifier,
        });

        const confirmationResult = result.data as {
          code: number;
          message: string;
          content: {
            isAllowed: boolean;
            subject: string;
          };
        };

        if (confirmationResult.content.isAllowed) {
          return next();
        }

        const forbiddedErrorForNext = new ErrorForNext(
          'Client not authorized',
          401,
          400801,
          'sendSecurityRequest',
          'Horus.ts',
        ).setLogMessage('Client not authorized');

        return next(forbiddedErrorForNext.toJSON());
      } catch (error) {
        const errorForNext = new ErrorForNext(
          'Horus validation failed',
          500,
          500801,
          'sendSecurityRequest',
          'Horus.ts',
        ).setLogMessage('Horus validation failed');

        if (error && error.response === undefined)
          errorForNext.setOriginalError(error);

        if (error && error.response)
          errorForNext.setErrorObject(error.response);

        return next(errorForNext.toJSON());
      }
    };
  };
}

export default Horus;
