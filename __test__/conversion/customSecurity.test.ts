import axios from 'axios';
import CustomSecurity from '../../src/server/util/CustomSecurity';

describe('Custom security class works', () => {
  it('Send security request works', async () => {
    const axiosPostSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        code: 200000,
        message: 'some message',
        content: {
          isAllowed: true,
          subject: 'someSubject',
        },
      },
    });

    const customSecurity = new CustomSecurity();

    customSecurity.configuration.customSecurity = {
      useCustomSecurity: true,
      httpBaseUrl: 'http',
      validateAccess: {
        endpoint: '/someEndpoint',
        requestConf: {
          body: {
            token: 'sometoken',
            permission: '$.permissionString',
            appIdentifier: 'appid',
          },
          headers: {
            'x-usil-request-id': '$.permissionString',
          },
        },
        responseEvaluationConfig: {
          valueToEvaluate: '$.content.isAllowed',
          equalTo: true,
        },
      },
    };
    const nextFunction = jest.fn();

    await customSecurity.validateAccess('some:some')(
      {} as any,
      {} as any,
      nextFunction,
    );

    expect(axiosPostSpy).toHaveBeenCalledWith(
      'http/someEndpoint',
      {
        token: 'sometoken',
        permission: 'some:some',
        appIdentifier: 'appid',
      },
      { headers: { 'x-usil-request-id': 'some:some' } },
    );

    expect(nextFunction).toHaveBeenCalled();

    axiosPostSpy.mockRestore();
  });

  it('Send security request user no allowed', async () => {
    const axiosPostSpy = jest.spyOn(axios, 'post').mockResolvedValue({
      data: {
        code: 200000,
        message: 'some message',
        content: {
          isAllowed: false,
          subject: 'someSubject',
        },
      },
    });

    const customSecurity = new CustomSecurity();

    customSecurity.configuration.customSecurity = {
      useCustomSecurity: true,
      httpBaseUrl: 'http',
      validateAccess: {
        endpoint: '/someEndpoint',
        requestConf: {
          body: {
            token: 'sometoken',
            permission: '$.permissionString',
            appIdentifier: 'appid',
          },
          headers: {
            'x-usil-request-id': '$.permissionString',
          },
        },
        responseEvaluationConfig: {
          valueToEvaluate: '$.content.isAllowed',
          equalTo: true,
        },
      },
    };

    const nextFunction = jest.fn();

    await customSecurity.validateAccess('some:some')(
      {} as any,
      {} as any,
      nextFunction,
    );

    expect(axiosPostSpy).toHaveBeenCalledWith(
      'http/someEndpoint',
      {
        token: 'sometoken',
        permission: 'some:some',
        appIdentifier: 'appid',
      },
      { headers: { 'x-usil-request-id': 'some:some' } },
    );

    expect(nextFunction).toHaveBeenCalledWith({
      errorCode: 400801,
      errorObject: undefined,
      logMessage: 'Client not authorized',
      message: 'Client not authorized',
      onFile: 'CustomSecurity.ts',
      onFunction: 'sendSecurityRequest',
      originalError: undefined,
      statusCode: 401,
    });
  });

  it('Send security request errors', async () => {
    const axiosPostSpy = jest
      .spyOn(axios, 'post')
      .mockRejectedValue({ response: {} });

    const customSecurity = new CustomSecurity();
    customSecurity.configuration.customSecurity = {
      useCustomSecurity: true,
      httpBaseUrl: 'http',
      validateAccess: {
        endpoint: '/someEndpoint',
        requestConf: {
          body: {
            token: 'sometoken',
            permission: '$.permissionString',
            appIdentifier: 'appid',
          },
          headers: {
            'x-usil-request-id': '$.permissionString',
          },
        },
        responseEvaluationConfig: {
          valueToEvaluate: '$.content.isAllowed',
          equalTo: true,
        },
      },
    };
    const nextFunction = jest.fn();

    await customSecurity.validateAccess('some:some')(
      {} as any,
      {} as any,
      nextFunction,
    );

    expect(axiosPostSpy).toHaveBeenCalledWith(
      'http/someEndpoint',
      {
        token: 'sometoken',
        permission: 'some:some',
        appIdentifier: 'appid',
      },
      { headers: { 'x-usil-request-id': 'some:some' } },
    );

    expect(nextFunction).toHaveBeenCalled();
  });
});
