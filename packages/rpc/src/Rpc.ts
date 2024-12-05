import type {
  RpcEndpoint,
  RpcEndpointAsync,
  RpcEndpointBase,
  RpcEndpointSync,
  RpcEndpointSyncVoid,
} from './RpcEndpoint.js';
interface RpcMessageData {
  retId: string | undefined;
  name: string;
  data: unknown[];
  sync: false;
}
interface RpcMessageDataSync {
  name: string;
  data: unknown[];
  sync: true;
  lock: SharedArrayBuffer;
  buf: SharedArrayBuffer | undefined;
}

type RetEndpoint<Return> = RpcEndpointBase<
  [Return, boolean],
  void,
  false,
  false
>;

/**
 * The instance for handling MessagePort Remote Process Call
 */
export class Rpc {
  private incId = 0;
  #textEncoder = new TextEncoder();
  #textDecoder = new TextDecoder();
  #handlerMap = new Map<
    string,
    (...args: any[]) => unknown | Promise<unknown>
  >();

  /**
   * @param port one size of a message channel
   * @param name instance name
   */
  constructor(private port: MessagePort, private name: string) {
    port.onmessage = this.#onMessage;
  }
  get nextRetId() {
    return `ret_${this.name}_${this.incId++}`;
  }

  /**
   * @private do not use this
   * @param retId
   * @returns
   */
  private static createRetEndpoint<Return>(retId: string): RetEndpoint<Return> {
    return {
      name: retId,
      hasReturn: false,
      isSync: false,
    } as unknown as RetEndpoint<Return>;
  }

  #onMessage: (ev: MessageEvent) => void = async (ev) => {
    const message = ev.data as RpcMessageData | RpcMessageDataSync;
    if (globalThis.__RPC_DEBUG_MODE) {
      console.warn(`[rpc] ${this.name} received ${message.name}`, message);
    }
    const handler = this.#handlerMap.get(message.name);
    if (handler) {
      const lockViewer = message.sync
        ? new Int32Array(message.lock)
        : undefined;
      const replyTempEndpoint = (!message.sync && message.retId)
        ? Rpc.createRetEndpoint(message.retId)
        : undefined;
      try {
        const retData = await handler(...message.data);
        if (message.sync) {
          if (message.buf) {
            const retStr = JSON.stringify(retData);
            const lengthViewer = new Uint32Array(message.buf, 0, 1);
            const bufViewer = new Uint8Array(message.buf, 4);
            const retCache = new Uint8Array(message.buf.byteLength - 4);
            const { written: byteLength } = this.#textEncoder.encodeInto(
              retStr,
              retCache,
            );
            lengthViewer[0] = byteLength;
            bufViewer.set(retCache, 0);
          }
          Atomics.store(lockViewer!, 0, 1);
          Atomics.notify(lockViewer!, 0);
        } else {
          if (message.retId) {
            this.invoke<RetEndpoint<unknown>>(replyTempEndpoint!, [
              retData,
              false,
            ]);
          }
        }
      } catch (e) {
        console.error(e);
        if (message.sync) {
          Atomics.store(lockViewer!, 0, 2);
          Atomics.notify(lockViewer!, 0);
          lockViewer![1] = 2;
        } else {
          this.invoke(replyTempEndpoint!, [undefined, true]);
        }
      }
    } else {
      console.error(
        `[rpc] cannot find handler for rpc call ${message.name}`,
        message,
      );
    }
  };

  /**
   * initialize a endpoint into a function
   * @param endpoint
   */
  createCall<E extends RpcEndpointSync<unknown[], unknown>>(
    endpoint: E,
  ): (...args: E['_TypeParameters']) => E['_TypeReturn'];
  createCall<E extends RpcEndpointSyncVoid<unknown[]>>(
    endpoint: E,
  ): (...args: E['_TypeParameters']) => void;
  createCall<E extends RpcEndpointAsync<unknown[], unknown>>(
    endpoint: E,
  ): (...args: E['_TypeParameters']) => Promise<E['_TypeReturn']>;
  createCall<E extends RpcEndpoint<unknown[], unknown>>(
    endpoint: E,
  ): (
    ...args: E['_TypeParameters']
  ) => Promise<E['_TypeReturn']> | E['_TypeReturn'] | void {
    return (...args) => {
      return this.invoke(endpoint, args);
    };
  }

  /**
   * register a handler for an endpoint
   * @param endpoint
   * @param handler
   */
  registerHandler<T extends RetEndpoint<any>>(
    endpoint: T,
    handler: (...args: T['_TypeParameters']) => void,
  ): void;
  registerHandler<T extends RpcEndpoint<any[], any>>(
    endpoint: T,
    handler:
      | ((...args: T['_TypeParameters']) => T['_TypeReturn'])
      | ((...args: T['_TypeParameters']) => Promise<T['_TypeReturn']>),
  ): void;
  registerHandler<T extends RpcEndpoint<any[], any>>(
    endpoint: T,
    handler:
      | ((...args: T['_TypeParameters']) => T['_TypeReturn'])
      | ((...args: T['_TypeParameters']) => Promise<T['_TypeReturn']>),
  ): void {
    this.#handlerMap.set(endpoint.name, handler);
  }

  /**
   * the low level api for sending a rpc message
   * recommend to use the `createCall`
   * @param endpoint
   * @param parameters
   */
  invoke<T extends RetEndpoint<unknown>>(
    endpoint: T,
    parameters: T['_TypeParameters'],
  ): void;
  invoke<
    E extends (
      | RpcEndpointSyncVoid<unknown[]>
      | RpcEndpointSync<unknown[], unknown>
    ),
  >(
    endpoint: E,
    parameters: E['_TypeParameters'],
    transfer?: Transferable[],
  ): E['_TypeReturn'];
  invoke<E extends RpcEndpointAsync<unknown[], unknown>>(
    endpoint: E,
    parameters: E['_TypeParameters'],
    transfer?: Transferable[],
  ): Promise<E['_TypeReturn']>;
  invoke<E extends RpcEndpoint<unknown[], unknown>>(
    endpoint: E,
    parameters: E['_TypeParameters'],
    transfer?: Transferable[],
  ): Promise<E['_TypeReturn']> | E['_TypeReturn'];
  invoke<E extends RpcEndpoint<unknown[], unknown>>(
    endpoint: E,
    parameters: E['_TypeParameters'],
    transfer: Transferable[] = [],
  ): Promise<E['_TypeReturn']> | E['_TypeReturn'] {
    if (endpoint.isSync) {
      const sharedBuffer = endpoint.bufferSize
        ? new SharedArrayBuffer(endpoint.bufferSize + 4)
        : undefined;
      const lock = new SharedArrayBuffer(4);
      const lockViewer = new Int32Array(lock);
      lockViewer[0] = 0;
      const message: RpcMessageDataSync = {
        name: endpoint.name,
        data: parameters,
        sync: true,
        lock: lock,
        buf: sharedBuffer,
      };
      this.port.postMessage(message, { transfer });
      Atomics.wait(lockViewer, 0, 0);
      if (lockViewer[0] === 2) {
        // error
        throw null;
      }
      if (sharedBuffer) {
        const byteLength = (new Uint32Array(sharedBuffer, 0, 4))[0]!;
        const sharedBufferView = new Uint8Array(sharedBuffer, 4, byteLength);
        const localBuf = new Uint8Array(byteLength);
        localBuf.set(sharedBufferView!, 0);
        const ret = localBuf
          ? JSON.parse(
            this.#textDecoder.decode(localBuf),
          ) as E['_TypeParameters']
          : undefined;
        return ret;
      } else {
        return;
      }
    } else {
      const { promise, resolve, reject } = Promise.withResolvers<
        E['_TypeReturn']
      >();
      const retHandler = endpoint.hasReturn
        ? Rpc.createRetEndpoint(this.nextRetId)
        : undefined;
      if (endpoint.hasReturn) {
        this.registerHandler(retHandler!, (returnValue, error) => {
          if (error) reject();
          resolve(returnValue);
        });
      }
      const message: RpcMessageData = {
        name: endpoint.name,
        data: parameters,
        sync: false,
        retId: retHandler?.name,
      };
      this.port.postMessage(message, { transfer });
      return promise;
    }
  }
}
