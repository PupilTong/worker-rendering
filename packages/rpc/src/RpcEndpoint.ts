export class RpcEndpoint<Parameters extends any[], Return> {
  readonly _TypeParameters!: Parameters;
  readonly _TypeReturn!: Return;
  constructor(
    public name: string,
    public sync: boolean = false,
    public bufferSize: number = 128,
  ) {
  }
}
