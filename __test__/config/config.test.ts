import { getConfig } from '../../config/main.config';
import log4js from 'log4js';

describe('Correct configuration declaration', () => {
  const configuration = getConfig();

  it('Correct environment', () => {
    expect(configuration).toBeTruthy();
    expect(configuration.state).toBe('test');
  });

  it('Correct logger', () => {
    expect(configuration.log()).toBeTruthy();
  });

  it('Correct port', () => {
    expect(configuration.port).toEqual(expect.any(Number));
    expect(configuration.port).toBeGreaterThan(-1);
  });

  it('Correct mysql port', () => {
    expect(configuration.dataBasePort).toEqual(expect.any(Number));
    expect(configuration.dataBasePort).toBeGreaterThan(-1);
  });

  it('Correct database host', () => {
    expect(configuration.dataBaseHost).toBeTruthy();
    expect(configuration.dataBaseHost).toEqual(expect.any(String));
  });

  it('Correct database password', () => {
    expect(configuration.dataBasePassword).toBeTruthy();
  });

  it('Correct logger wit othe configuration', () => {
    process.env.LOG_LEVEL = 'error';
    process.env.LOG_FILE_PATH = 'true';
    const otherConfiguration = getConfig();
    expect(otherConfiguration.log()).toBeTruthy();
    process.env.LOG_LEVEL = undefined;
    process.env.LOG_FILE_PATH = undefined;
    const otherConfigurationSecond = getConfig();
    expect(otherConfigurationSecond.log()).toBeTruthy();
  });
});
