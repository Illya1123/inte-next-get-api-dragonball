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
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Helper: đọc cookie
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

  // Quy trình login ví
  const loginFlow = useCallback(async () => {
    if (isLoggingIn || hasLoggedIn || isDisconnecting.current) return;
    try {
      setIsLoggingIn(true);
      console.log("🔹 Bắt đầu đăng nhập ví...");

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
        console.log("Đăng nhập ví thành công!");
        setHasLoggedIn(true);
        localStorage.setItem("wallet_connected_address", account.address);
      } else {
        console.warn("Không tìm thấy cookie luban_login sau đăng nhập!");
      }
    } catch (err: any) {
      console.error("Lỗi đăng nhập ví:", err);

      // Reset trạng thái khi có lỗi
      document.cookie =
        "luban_login=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie =
        "wallet_connected=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      localStorage.removeItem("wallet_connected_address");
      setHasLoggedIn(false);
      setWalletRemembered(false);
      hasLoginAttempted.current = false;
      isDisconnecting.current = false;

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

  // Kiểm tra cookie và ví nhớ khi khởi động
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
    console.log("Ngắt kết nối ví...");
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

  const handleSignOut = async () => {
    try {
      console.log("🔹 Đăng xuất người dùng...");

      // Ngắt kết nối ví
      handleDisconnect();

      // Gọi NextAuth signOut → backend sẽ tự logout khỏi Keycloak
      await signOut({ callbackUrl: "/login" });

      console.log("Đăng xuất hoàn tất (NextAuth + Keycloak)");
    } catch (err) {
      console.error("Lỗi khi đăng xuất:", err);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">
          Đang chuyển hướng đến trang đăng nhập...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Dashboard - Naruto API
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Xin chào, {session?.user?.name || session?.user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Wallet Connection Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Kết nối Ví</h2>

          {account.status !== "connected" ? (
            <div className="space-y-4">
              <p className="text-gray-600">
                Vui lòng kết nối ví để sử dụng các tính năng của ứng dụng
              </p>
              <div className="flex flex-wrap gap-3">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {connector.name}
                  </button>
                ))}
              </div>
              {connectStatus === "pending" && (
                <div className="text-blue-600">Đang kết nối...</div>
              )}
              {error && (
                <div className="text-red-500 text-sm">{error.message}</div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md">
                <div>
                  <p className="text-green-800 font-medium">Ví đã kết nối</p>
                  <p className="text-green-600 text-sm">
                    {account.address} (Chain ID: {chainId})
                  </p>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  Ngắt kết nối
                </button>
              </div>

              {isLoggingIn && !hasLoggedIn && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800">Đang xác thực chữ ký ví...</p>
                </div>
              )}

              {hasLoggedIn && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-green-800 font-medium">
                    Xác thực ví thành công!
                  </p>
                  <p className="text-green-600 text-sm">
                    Bạn có thể truy cập các trang API
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* API Pages Section */}
        {hasLoggedIn && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">
              Truy cập API Naruto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                href="/dragon-ball-client"
                className="block p-4 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
              >
                <h3 className="font-semibold text-blue-600">
                  Naruto Client Side
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gọi API từ client side với React hooks
                </p>
              </Link>
              <Link
                href="/dragon-ball-server"
                className="block p-4 border border-green-200 rounded-md hover:bg-green-50 transition-colors"
              >
                <h3 className="font-semibold text-green-600">
                  Naruto Server Side
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Gọi API từ server side với Next.js
                </p>
              </Link>
            </div>
          </div>
        )}

        {!hasLoggedIn && account.status === "connected" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-yellow-600 mb-2">
                Chờ xác thực ví
              </h2>
              <p className="text-gray-600">
                Vui lòng ký message để xác thực quyền sở hữu ví
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
