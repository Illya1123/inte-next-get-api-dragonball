export type WalletLoginParams = {
  address: string;
  chainId: number;
  signMessageAsync: (args: { message: string }) => Promise<string>;
};