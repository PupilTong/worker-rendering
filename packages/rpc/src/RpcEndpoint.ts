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
  readonly name: string;
  readonly _TypeParameters: Parameters;
  readonly _TypeReturn: Return;
  readonly hasReturn: HasReturn;
  readonly isSync: IsSync;
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
