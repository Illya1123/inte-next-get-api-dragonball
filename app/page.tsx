"use client";

import {
  useAccount,
  useConnect,
  useDisconnect,
  useSignMessage,
  useChainId,
} from "wagmi";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useWalletLogin } from "@/app/(lib)/useWalletLogin";

export default function Home() {
  const account = useAccount();
  const chainId = useChainId();
  const { handleLogin } = useWalletLogin();
  const { connectors, connect, status: connectStatus, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);

  const hasLoginAttempted = useRef(false);

  const getCookie = useCallback((name: string) => {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }, []);

  const waitForCookie = useCallback(async (cookieName: string, timeoutMs = 3000) => {
    const interval = 200;
    let waited = 0;
    while (waited < timeoutMs) {
      const cookie = getCookie(cookieName);
      if (cookie) return cookie;
      await new Promise((r) => setTimeout(r, interval));
      waited += interval;
    }
    return null;
  }, [getCookie]);

  const loginFlow = useCallback(async () => {
    if (isLoggingIn || hasLoggedIn) return;
    try {
      setIsLoggingIn(true);
      console.log("Bắt đầu đăng nhập...");

      await handleLogin({
        address: account.address!,
        chainId,
        signMessageAsync,
      });

      const cookie = await waitForCookie("luban_login", 5000);
      if (cookie) {
        // console.log("Cookie luban_login đã được lưu:", cookie);
        setHasLoggedIn(true);
      } else {
        console.warn("Không tìm thấy cookie luban_login sau đăng nhập!");
      }
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
    } finally {
      setIsLoggingIn(false);
      hasLoginAttempted.current = true;
    }
  }, [
    account.address,
    chainId,
    signMessageAsync,
    handleLogin,
    waitForCookie,
    isLoggingIn,
    hasLoggedIn,
  ]);

  useEffect(() => {
    if (account.status === "connected" && account.address) {
      document.cookie = "wallet_connected=true; path=/";

      const existingLogin = getCookie("luban_login");

      if (!existingLogin && !hasLoginAttempted.current) {
        console.log("Chưa có cookie → loginFlow()");
        loginFlow();
      } else if (existingLogin) {
        console.log("Đã có cookie → bỏ qua loginFlow()");
        setHasLoggedIn(true);
      }
    } else {
      document.cookie = "wallet_connected=false; path=/";
      setHasLoggedIn(false);
      hasLoginAttempted.current = false;
    }
  }, [account.status, account.address, getCookie, loginFlow]);

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

        {connectStatus === "pending" && <div>Đang kết nối...</div>}
        {error && <div className="text-red-500">{error.message}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h2 className="text-2xl font-semibold">Xin chào</h2>
      <div className="text-gray-600 text-sm">
        Ví: {account.address} <br />
        Chain ID: {chainId}
      </div>

      {isLoggingIn && <p>Đang xác thực...</p>}
      {hasLoggedIn && <p className="text-green-600">Đã đăng nhập thành công!</p>}

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
          onClick={() => {
            document.cookie =
              "luban_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            disconnect();
            setHasLoggedIn(false);
            hasLoginAttempted.current = false;
          }}
          className="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Ngắt kết nối ví
        </button>
      </div>
    </div>
  );
}
