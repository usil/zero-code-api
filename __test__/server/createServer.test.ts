import { newServer } from '../../src/server/createServer';
import ServerInitialization from '../../src/server/ServerInitialization';

describe('Correct app creation', () => {
  it('Creates an instance of an express app', async () => {
    const initMock = jest
      .spyOn(ServerInitialization.prototype, 'init')
      .mockImplementation(() => {
        return true as any;
      });

    const createServerMock = jest
      .spyOn(ServerInitialization.prototype, 'createServer')
      .mockImplementation(() => {
        return true as any;
      });

    await newServer(8083);

    expect(initMock).toHaveBeenCalled();
    expect(createServerMock).toHaveBeenCalled();
  });
});
