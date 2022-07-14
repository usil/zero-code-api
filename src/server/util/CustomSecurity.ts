import axios from 'axios';
import { NextFunction, Request, Response } from 'express';
import ErrorForNext from './ErrorForNext';
import { getConfig } from '../../../config/main.config';
import jp from 'jsonpath';
import randomString from 'randomstring';

class CustomSecurity {
  endpoint: string;
  configuration = getConfig();

  validateAccess = (permissionString: string) => {
    this.endpoint =
      this.configuration.customSecurity.httpBaseUrl +
      this.configuration.customSecurity.validateAccess.endpoint;

    return async (req: Request, _res: Response, next: NextFunction) => {
      try {
        const allDataObj = {
          req: { ...req },
          permissionString,
          randomString: randomString.generate(7),
        };

        const requestConfigBody = {
          ...this.configuration.customSecurity.validateAccess.requestConf.body,
        };

        const requestConfigHeaders = {
          ...this.configuration.customSecurity.validateAccess.requestConf
            .headers,
        };

        for (const key in requestConfigBody) {
          if (requestConfigBody[key].startsWith('$.')) {
            requestConfigBody[key] = jp.query(
              allDataObj,
              requestConfigBody[key],
            )[0] as string;
          }
        }

        for (const key in requestConfigHeaders) {
          if (requestConfigHeaders[key].startsWith('$.')) {
            requestConfigHeaders[key] = jp.query(
              allDataObj,
              requestConfigHeaders[key],
            )[0] as string;
          }
        }

        const result = await axios.post(
          this.endpoint,
          { ...requestConfigBody },
          {
            headers: requestConfigHeaders,
          },
        );

        const confirmationResult = result.data;

        const valueToEvaluate = jp.query(
          confirmationResult,
          this.configuration.customSecurity.validateAccess
            .responseEvaluationConfig.valueToEvaluate,
        )[0] as string | number | boolean;

        const expectedValue =
          this.configuration.customSecurity.validateAccess
            .responseEvaluationConfig.equalTo;

        if (valueToEvaluate === expectedValue) {
          return next();
        }

        const forbiddedErrorForNext = new ErrorForNext(
          'Client not authorized',
          401,
          400801,
          'sendSecurityRequest',
          'CustomSecurity.ts',
        ).setLogMessage('Client not authorized');

        return next(forbiddedErrorForNext.toJSON());
      } catch (error) {
        const errorForNext = new ErrorForNext(
          'CustomSecurity validation failed',
          500,
          500801,
          'sendSecurityRequest',
          'CustomSecurity.ts',
        ).setLogMessage('CustomSecurity validation failed');

        if (error && error.response === undefined)
          errorForNext.setOriginalError(error);

        if (error && error.response)
          errorForNext.setErrorObject(error.response);

        return next(errorForNext.toJSON());
      }
    };
  };
}

export default CustomSecurity;
