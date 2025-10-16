import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { baseAccount, injected, walletConnect } from "wagmi/connectors";

// Create config once to avoid re-initialization
let config: ReturnType<typeof createConfig> | undefined;

export function getConfig() {
  if (config) return config;

  config = createConfig({
    chains: [mainnet, sepolia],
    connectors: [
      injected(),
      baseAccount(),
      walletConnect({
        projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
        metadata: {
          name: "Intern Project",
          description: "Dragon Ball API App",
          url: "http://localhost:3000",
          icons: ["https://avatars.githubusercontent.com/u/37784886"],
        },
      }),
    ],
    storage: createStorage({
      storage: cookieStorage,
    }),
    ssr: true,
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
  });

  return config;
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof getConfig>;
  }
}
