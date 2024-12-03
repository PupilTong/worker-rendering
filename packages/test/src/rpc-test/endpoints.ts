import { createRpcEndpoint } from '@pupiltong/rpc';

export const addAsync = createRpcEndpoint<[number, number], number>(
  'add_async',
  false,
);

export const addSync = createRpcEndpoint<[number, number], number>(
  'add_sync',
  true,
  true,
  16,
);

export const consoleLog = createRpcEndpoint<[string]>('console_log', false);

export const consoleLogSync = createRpcEndpoint<[string]>(
  'console_log_sync',
  true,
  false,
);

export const throwError = createRpcEndpoint<[]>('throw_async', false);

export const throwErrorSync = createRpcEndpoint<[]>('throw_sync', true, false);

export const wait = createRpcEndpoint<[number]>('wait_async', false);

export const waitSync = createRpcEndpoint<[number]>('wait_async', true, false);
