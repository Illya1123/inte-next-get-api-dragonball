"use client";

import axios from "axios";
import type { WalletLoginParams } from "@/app/(types)/wallet";

export function useWalletLogin() {
  async function handleLogin({
    address,
    chainId,
    signMessageAsync,
  }: WalletLoginParams) {
    try {
      console.log("Bắt đầu đăng nhập ví:", address);

      const signMessageRes = await axios.get(
        "https://auth-api.luban.com.vn/api/v1/auth/sign-message",
        {
          headers: {
            accept: "*/*",
            "x-guid": "4f8df6dc-760a-4767-b786-4cc3189a7905",
          },
        }
      );

      const { message, nonce } = signMessageRes.data.data;
      console.log("Nhận được message:", message, "nonce:", nonce);

      const signature = await signMessageAsync({ message });
      // console.log("Signature:", signature);

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
        }
      );

      // console.log("Login successful:", loginRes.data);

      document.cookie = `luban_login=${encodeURIComponent(
        JSON.stringify(loginRes.data)
      )}; path=/; max-age=86400`;

      return loginRes.data;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Login failed:", err.response?.data || err.message);
      } else if (err instanceof Error) {
        console.error("Login failed:", err.message);
      } else {
        console.error("Login failed: Unknown error", err);
      }
      throw err;
    }
  }

  return { handleLogin };
}
