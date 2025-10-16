import NextAuth, { type NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
// import type { JWT } from "next-auth/jwt";
// import type { Session } from "next-auth";

// --- mở rộng kiểu dữ liệu Session ---
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }
}

// --- cấu hình NextAuth ---
export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: "" as any,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),
  ],

  callbacks: {
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.accessToken) {
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },

    async jwt({ token, account }) {
      if (account) {
        token.accessToken = (account as any).access_token;
      }
      return token;
    },

    async redirect({ baseUrl }) {
      return `${baseUrl}/dashboard`;
    },
  },

  pages: {
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",

  // thêm event khi signOut
  events: {
    async signOut({ token }) {
      try {
        const realm = process.env.KEYCLOAK_REALM!;
        const keycloakUrl = process.env.KEYCLOAK_BASE_URL!;
        const userId = token.sub;

        if (!userId) {
          console.warn("Không tìm thấy userId để logout Keycloak");
          return;
        }

        // --- Lấy admin token ---
        const adminTokenRes = await fetch(
          `${keycloakUrl}/realms/master/protocol/openid-connect/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: "admin-cli",
              grant_type: "password",
              username: process.env.KEYCLOAK_ADMIN_USERNAME!,
              password: process.env.KEYCLOAK_ADMIN_PASSWORD!,
            }),
          }
        );

        if (!adminTokenRes.ok) {
          console.error(
            "Không thể lấy admin token:",
            await adminTokenRes.text()
          );
          return;
        }

        const { access_token } = await adminTokenRes.json();

        // --- Gọi API logout user ---
        const logoutRes = await fetch(
          `${keycloakUrl}/admin/realms/${realm}/users/${userId}/logout`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!logoutRes.ok) {
          console.error(
            `Lỗi khi gọi Keycloak logout user ${userId}:`,
            await logoutRes.text()
          );
        } else {
          console.log(`User ${userId} đã logout khỏi tất cả session Keycloak`);
        }
      } catch (err) {
        console.error("Lỗi khi logout Keycloak:", err);
      }
    },
  },
};

// --- export handler cho App Router ---
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
