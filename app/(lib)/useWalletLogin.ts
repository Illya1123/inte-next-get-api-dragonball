"use client";

import axios from "axios";
import type { WalletLoginParams } from "@/app/(types)/wallet";

let abortController: AbortController | null = null;

export function useWalletLogin() {
  async function handleLogin({
    address,
    chainId,
    signMessageAsync,
  }: WalletLoginParams) {
    try {
      console.log("🔹 Bắt đầu đăng nhập ví:", address);

      if (abortController) {
        console.log("Huỷ request cũ...");
        abortController.abort();
      }

      abortController = new AbortController();
      const signal = abortController.signal;

      // 🔹 Lấy message để ký
      const signMessageRes = await axios.get(
        "https://auth-api.luban.com.vn/api/v1/auth/sign-message",
        {
          headers: {
            accept: "*/*",
            "x-guid": "4f8df6dc-760a-4767-b786-4cc3189a7905",
          },
          signal,
        }
      );

      if (signal.aborted) {
        console.warn("Request bị hủy trước khi nhận message");
        return;
      }

      const { message, nonce } = signMessageRes.data.data;
      console.log("Nhận message:", message, "| nonce:", nonce);

      // 🔹 Ký message
      const signature = await signMessageAsync({ message });
      if (signal.aborted) {
        console.warn("Hủy ký vì đã ngắt kết nối ví.");
        return;
      }

      // 🔹 Gửi signature để đăng nhập
      const loginRes = await axios.post(
        "https://auth-api.luban.com.vn/api/v1/auth/sign-in/wallet",
        {
          signature,
          nonce,
          publicAddress: address,
          chainId,
        },
        {
          headers: {
            accept: "*/*",
            "x-guid": "4f8df6dc-760a-4767-b786-4cc3189a7905",
            "Content-Type": "application/json",
          },
          signal,
        }
      );

      if (signal.aborted) {
        console.warn("Request login bị hủy.");
        return;
      }

      // ✅ Cookie bền vững, giữ khi reload
      // - max-age=86400 (24h)
      // - SameSite=Lax để Next.js đọc được
      // - secure khi deploy HTTPS, còn localhost thì không cần
      const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
      const cookieOptions = [
        "path=/",
        "max-age=86400",
        "SameSite=Lax",
        isSecure ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");

      document.cookie = `luban_login=${encodeURIComponent(
        JSON.stringify(loginRes.data)
      )}; ${cookieOptions}`;

      console.log("✅ Cookie luban_login được lưu:", cookieOptions);
      console.log("✅ Đăng nhập thành công!");

      return loginRes.data;
    } catch (err: unknown) {
      if (axios.isCancel(err)) {
        console.log("Request bị hủy, không làm gì thêm.");
        return;
      }
      if (axios.isAxiosError(err)) {
        console.error("Login failed:", err.response?.data || err.message);
      } else if (err instanceof Error) {
        console.error("Login failed:", err.message);
      } else {
        console.error("Login failed: Unknown error", err);
      }
      throw err;
    } finally {
      abortController = null;
    }
  }

  // 🔹 Hủy request đang chạy
  function cancelLogin() {
    if (abortController) {
      console.log("Huỷ toàn bộ request login...");
      abortController.abort();
      abortController = null;
    }
  }

  return { handleLogin, cancelLogin };
}
