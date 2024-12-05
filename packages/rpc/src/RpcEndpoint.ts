export type RpcEndpointSyncVoid<Parameters extends any[]> = RpcEndpointBase<
  Parameters,
  void,
  true,
  false
>;

export interface RpcEndpointSync<Parameters extends any[], Return>
  extends RpcEndpointBase<Parameters, Return, true, true>
{
  readonly bufferSize: number;
}

export type RpcEndpointAsync<Parameters extends any[], Return> =
  RpcEndpointBase<Parameters, Return, false, true>;

export interface RpcEndpointBase<
  Parameters extends any[],
  Return,
  IsSync extends boolean,
  HasReturn extends boolean,
> {
  /**
   * The name of this rpc endpoint.
   * Rpc instance use this name to recognize which callback to call.
   * Keep in mind: this should be unique.
   * @public
   */
  readonly name: string;
  /**
   * @private
   * make typescript happy
   */
  readonly _TypeParameters: Parameters;
  /**
   * @private
   * make typescript happy
   */
  readonly _TypeReturn: Return;
  /**
   * @public
   * if this endpoint has return value.
   * Only valid for sync endpoints.
   * Always true for async endpoints.
   */
  readonly hasReturn: HasReturn;
  /**
   * @public
   * the call is a async call or not
   */
  readonly isSync: IsSync;
  /**
   * The byte size for return value buffer.
   * The return value will be encoded to json string in utf-8
   * So you should ensure this size is enough for your stringified return value.
   */
  readonly bufferSize: never | number;
}

export type RpcEndpoint<Parameters extends any[], Return> =
  | RpcEndpointSyncVoid<Parameters>
  | RpcEndpointSync<Parameters, Return>
  | RpcEndpointAsync<Parameters, Return>;

export function createRpcEndpoint<Parameters extends any[], Return = void>(
  name: string,
  isSync: false,
): RpcEndpointAsync<Parameters, Return>;
export function createRpcEndpoint<Parameters extends any[]>(
  name: string,
  isSync: true,
  hasReturn: false,
): RpcEndpointSyncVoid<Parameters>;
export function createRpcEndpoint<Parameters extends any[], Return>(
  name: string,
  isSync: true,
  hasReturn: true,
  bufferSize: number,
): RpcEndpointSync<Parameters, Return>;
export function createRpcEndpoint(
  name: string,
  isSync: boolean,
  hasReturn: boolean = true,
  bufferSize?: number,
) {
  return {
    name,
    isSync,
    hasReturn,
    bufferSize,
  } as any;
}
