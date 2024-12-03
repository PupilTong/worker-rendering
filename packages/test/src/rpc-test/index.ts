import { Rpc } from '@pupiltong/rpc';
import {
  addAsync,
  addSync,
  consoleLog,
  consoleLogSync,
  throwError,
  throwErrorSync,
  wait,
  waitSync,
} from './endpoints.js';

const channel = new MessageChannel();

const worker = new Worker(
  new URL('./worker.js', import.meta.url),
  {
    type: 'module',
    name: 'worker',
  },
);

const rpc = new Rpc(channel.port1, 'main');

function waitImpl(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  setTimeout(() => resolve(), ms);
  return promise;
}

rpc.registerHandler(addAsync, async (a, b) => a + b);
rpc.registerHandler(addSync, (a, b) => a + b);
rpc.registerHandler(consoleLog, async (msg) => console.log(msg));
rpc.registerHandler(consoleLogSync, (msg) => console.log(msg));
rpc.registerHandler(throwError, async () => {
  throw new Error();
});
rpc.registerHandler(throwErrorSync, () => {
  throw new Error();
});
rpc.registerHandler(wait, waitImpl);
rpc.registerHandler(waitSync, waitImpl);

worker.postMessage({ port: channel.port2 }, { transfer: [channel.port2] });
