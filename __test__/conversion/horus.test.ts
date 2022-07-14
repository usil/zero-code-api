import axios from 'axios';
import Horus from '../../src/server/util/Horus';

describe('All conversion helper functions works', () => {
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

    const horus = new Horus('/someEndpoint');
    horus.configuration.customSecurity = {
      useCustomSecurity: true,
      token: 'sometoken',
      appIdentifier: 'appid',
      checkPermissionEndpoint: '/someEndpoint',
    };
    const nextFunction = jest.fn();

    await horus.sendSecurityRequest('some:some')(
      {} as any,
      {} as any,
      nextFunction,
    );

    expect(axiosPostSpy).toHaveBeenCalledWith('/someEndpoint', {
      token: 'sometoken',
      permission: 'some:some',
      appIdentifier: 'appid',
    });

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

    const horus = new Horus('/someEndpoint');
    horus.configuration.customSecurity = {
      useCustomSecurity: true,
      token: 'sometoken',
      appIdentifier: 'appid',
      checkPermissionEndpoint: '/someEndpoint',
    };
    const nextFunction = jest.fn();

    await horus.sendSecurityRequest('some:some')(
      {} as any,
      {} as any,
      nextFunction,
    );

    expect(axiosPostSpy).toHaveBeenCalledWith('/someEndpoint', {
      token: 'sometoken',
      permission: 'some:some',
      appIdentifier: 'appid',
    });

    expect(nextFunction).toHaveBeenCalledWith({
      errorCode: 400801,
      errorObject: undefined,
      logMessage: 'Client not authorized',
      message: 'Client not authorized',
      onFile: 'Horus.ts',
      onFunction: 'sendSecurityRequest',
      originalError: undefined,
      statusCode: 401,
    });
  });

  it('Send security request errors', async () => {
    const axiosPostSpy = jest
      .spyOn(axios, 'post')
      .mockRejectedValue({ response: {} });

    const horus = new Horus('/someEndpoint');
    horus.configuration.customSecurity = {
      useCustomSecurity: true,
      token: 'sometoken',
      appIdentifier: 'appid',
      checkPermissionEndpoint: '/someEndpoint',
    };
    const nextFunction = jest.fn();

    await horus.sendSecurityRequest('some:some')(
      {} as any,
      {} as any,
      nextFunction,
    );

    expect(axiosPostSpy).toHaveBeenCalledWith('/someEndpoint', {
      token: 'sometoken',
      permission: 'some:some',
      appIdentifier: 'appid',
    });

    expect(nextFunction).toHaveBeenCalled();
  });
});
