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
  const { handleLogin, cancelLogin } = useWalletLogin();
  const { connectors, connect, status: connectStatus, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [walletRemembered, setWalletRemembered] = useState(false);

  const hasLoginAttempted = useRef(false);
  const isDisconnecting = useRef(false);

  // 🔹 Helper: đọc cookie
  const getCookie = useCallback((name: string) => {
    const match = document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)")
    );
    return match ? decodeURIComponent(match[2]) : null;
  }, []);

  // 🔹 Helper: chờ cookie được set sau login
  const waitForCookie = useCallback(
    async (cookieName: string, timeoutMs = 5000) => {
      const interval = 200;
      let waited = 0;
      while (waited < timeoutMs) {
        const cookie = getCookie(cookieName);
        if (cookie) return cookie;
        await new Promise((r) => setTimeout(r, interval));
        waited += interval;
      }
      return null;
    },
    [getCookie]
  );

  // 🔹 Quy trình login
  const loginFlow = useCallback(async () => {
  if (isLoggingIn || hasLoggedIn || isDisconnecting.current) return;
  try {
    setIsLoggingIn(true);
    console.log("🔹 Bắt đầu đăng nhập...");

    if (account.status !== "connected" || !account.address) {
      console.warn("Ví chưa sẵn sàng để đăng nhập.");
      return;
    }

    await handleLogin({
      address: account.address,
      chainId,
      signMessageAsync,
    });

    const cookie = await waitForCookie("luban_login", 5000);
    if (cookie) {
      console.log("Đăng nhập thành công!");
      setHasLoggedIn(true);
      localStorage.setItem("wallet_connected_address", account.address);
    } else {
      console.warn("Không tìm thấy cookie luban_login sau đăng nhập!");
    }
  } catch (err: any) {
    console.error("Lỗi đăng nhập:", err);

    // Nếu lỗi hoặc người dùng từ chối ký — reset toàn bộ trạng thái + xóa cookie/localStorage
    console.log(" Xóa sạch cookie và localStorage do lỗi đăng nhập...");

    // Xóa tất cả cookie liên quan
    document.cookie =
      "luban_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "wallet_connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    // Xóa localStorage ví nhớ
    localStorage.removeItem("wallet_connected_address");

    // Reset lại state
    setHasLoggedIn(false);
    setWalletRemembered(false);
    hasLoginAttempted.current = false;
    isDisconnecting.current = false;

    // Nếu lỗi do người dùng từ chối ký, thì cũng ngắt kết nối
    if (
      err?.message?.includes("User rejected") ||
      err?.message?.includes("User denied") ||
      err?.code === 4001
    ) {
      console.warn("Người dùng hủy ký — ngắt kết nối ví.");
      cancelLogin?.();
      disconnect?.();
    }
  } finally {
    setIsLoggingIn(false);
    hasLoginAttempted.current = true;
  }
}, [
  account.address,
  account.status,
  chainId,
  signMessageAsync,
  handleLogin,
  waitForCookie,
  isLoggingIn,
  hasLoggedIn,
  cancelLogin,
  disconnect,
]);


  //Kiểm tra cookie và ví nhớ khi khởi động
  useEffect(() => {
    const cookie = getCookie("luban_login");
    const savedWallet = localStorage.getItem("wallet_connected_address");

    if (cookie && savedWallet) {
      console.log("🔹 Đã có cookie và ví nhớ:", savedWallet);
      setHasLoggedIn(true);
      setWalletRemembered(true);
      hasLoginAttempted.current = true;
    } else {
      console.log("🔹 Chưa có cookie hoặc ví nhớ");
      setHasLoggedIn(false);
      setWalletRemembered(false);
      hasLoginAttempted.current = false;
    }
  }, [getCookie]);

  // Nếu ví kết nối mà chưa có cookie, tự động login
  useEffect(() => {
    const cookie = getCookie("luban_login");

    if (
      account.status === "connected" &&
      account.address &&
      !cookie &&
      !hasLoggedIn &&
      !isLoggingIn &&
      !hasLoginAttempted.current
    ) {
      console.log("Ví vừa kết nối, bắt đầu login...");
      loginFlow();
    } else if (cookie && !hasLoggedIn) {
      console.log("Có cookie, skip login");
      setHasLoggedIn(true);
      hasLoginAttempted.current = true;
    }
  }, [
    account.status,
    account.address,
    hasLoggedIn,
    isLoggingIn,
    loginFlow,
    getCookie,
  ]);

  useEffect(() => {
    if (account.status === "connected" && account.address) {
      isDisconnecting.current = false;
      localStorage.setItem("wallet_connected_address", account.address);
      document.cookie = "wallet_connected=true; path=/";
    } else if (!isDisconnecting.current) {
      console.log("Mất kết nối ví tạm thời, giữ trạng thái đăng nhập.");
    }
  }, [account.status, account.address]);

  const handleDisconnect = () => {
    console.log("ngắt kết nối ví...");
    isDisconnecting.current = true;
    cancelLogin();
    disconnect();
    localStorage.removeItem("wallet_connected_address");
    document.cookie =
      "luban_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "wallet_connected=false; path=/";
    setHasLoggedIn(false);
    setWalletRemembered(false);
    hasLoginAttempted.current = false;
    setIsLoggingIn(false);
  };

  if (account.status !== "connected" && connectStatus !== "success") {
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

  if (isLoggingIn && !hasLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg text-gray-700">Đang xác thực chữ ký ví...</p>
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

      {hasLoggedIn ? (
        <>
          <p className="text-green-600">Đăng nhập & xác thực thành công!</p>
          <div className="flex flex-col items-center gap-3 mt-4">
            <Link
              href="/dragon-ball-client"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Naruto Client Page
            </Link>
            <Link
              href="/dragon-ball-server"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Naruto Server Page
            </Link>
          </div>
        </>
      ) : (
        <p className="text-yellow-600">
          Chưa đăng nhập – hãy kết nối ví để tiếp tục
        </p>
      )}

      <button
        onClick={handleDisconnect}
        className="mt-6 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
      >
        Ngắt kết nối ví
      </button>
    </div>
  );
}
