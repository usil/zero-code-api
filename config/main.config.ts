/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config();
const EnvSettings = require('advanced-settings').EnvSettings;
const envSettings = new EnvSettings();

import path from 'path';
import ConfigGlobalDto from './config.dto';
import log4js from 'log4js';

const logAppenders = {
  logFile: {
    type: 'dateFile',
    filename: `logs.log`,
  },
  log: { type: 'console' },
};

log4js.configure({
  appenders: logAppenders,
  categories: {
    default: {
      appenders: ['logFile', 'log'],
      level: 'debug',
    },
    zc: {
      appenders: process.env.USE_FILE === 'true' ? ['logFile', 'log'] : ['log'],
      level: process.env.LOG_LEVEL || 'debug',
    },
  },
});

process.on('exit', () => log4js.shutdown());
process.on('SIGINT', () => log4js.shutdown());
process.on('SIGUSR1', () => log4js.shutdown());
process.on('SIGUSR2', () => log4js.shutdown());
process.on('uncaughtException', () => log4js.shutdown());

const logger = log4js.getLogger('zc');

let configuration: Partial<typeof ConfigGlobalDto>;

/**
 * @description Add the config variables here
 */
export const getConfig = () => {
  const settings = envSettings.loadJsonFileSync(
    path.resolve(__dirname, '../settings.json'),
  );

  configuration = settings;

  configuration.port = parseInt(settings.port);

  configuration.dataBasePort = parseInt(settings.dataBasePort);

  configuration.log = (): log4js.Logger => logger;

  return configuration;
};
