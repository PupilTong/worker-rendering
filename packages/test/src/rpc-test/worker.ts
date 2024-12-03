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
globalThis.onmessage = (ev) => {
  const port = ev.data.port as MessagePort;
  const rpc = new Rpc(port, 'worker');
  Object.assign(globalThis, {
    addAsync: rpc.createCall(addAsync),
    addSync: rpc.createCall(addSync),
    consoleLog: rpc.createCall(consoleLog),
    consoleLogSync: rpc.createCall(consoleLogSync),
    throwError: rpc.createCall(throwError),
    throwErrorSync: rpc.createCall(throwErrorSync),
    wait: rpc.createCall(wait),
    waitSync: rpc.createCall(waitSync),
  });
};
