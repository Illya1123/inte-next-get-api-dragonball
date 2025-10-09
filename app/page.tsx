"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import Link from "next/link";
import { useEffect } from "react";

export default function Home() {
  const account = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    if (account.status === "connected") {
      document.cookie = "wallet_connected=true; path=/";
    } else {
      document.cookie = "wallet_connected=false; path=/";
    }
  }, [account.status]);

  if (account.status !== "connected") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-2xl font-semibold">Kết nối ví</h2>

        {connectors.map((connector) => (
          <button
            key={connector.uid}
            onClick={() => connect({ connector })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {connector.name}
          </button>
        ))}

        {status === "pending" && <div>Đang kết nối...</div>}
        {error && <div className="text-red-500">{error.message}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2 className="text-2xl font-semibold">Xin chào</h2>
      <div className="text-gray-600 text-sm">
        Ví: {account.addresses?.[0]} <br />
        Chain ID: {account.chainId}
      </div>

      <div className="flex flex-col items-center gap-3 mt-4">
        <Link
          href="/dragon-ball-client"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Dragon Ball Client Page
        </Link>

        <Link
          href="/dragon-ball-server"
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Dragon Ball Server Page
        </Link>

        <button
          onClick={() => disconnect()}
          className="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Ngắt kết nối ví
        </button>
      </div>
    </div>
  );
}
