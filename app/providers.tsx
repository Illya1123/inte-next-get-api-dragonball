"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { type ReactNode, useMemo } from "react";
import { type State, WagmiProvider } from "wagmi";
import { ErrorBoundary } from "@/app/(components)/error-boundary";

import { getConfig } from "@/app/wagmi";

export function Providers(props: {
  children: ReactNode;
  initialState?: State;
}) {
  const config = useMemo(() => getConfig(), []);
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
    []
  );

  return (
    <ErrorBoundary>
      <SessionProvider>
        <WagmiProvider config={config} initialState={props.initialState}>
          <QueryClientProvider client={queryClient}>
            {props.children}
          </QueryClientProvider>
        </WagmiProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
