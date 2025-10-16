import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await request.json();

  const tokenRes = await fetch(
    `${process.env.KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`,
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

  if (!tokenRes.ok) {
    console.error("Không thể lấy admin token", await tokenRes.text());
    return NextResponse.json({ error: "Failed to get admin token" }, { status: 500 });
  }

  const { access_token } = await tokenRes.json();

  const logoutRes = await fetch(
    `${process.env.KEYCLOAK_URL}/admin/realms/${process.env.KEYCLOAK_REALM}/users/${userId}/logout`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  if (!logoutRes.ok) {
    console.error("Lỗi khi logout user:", await logoutRes.text());
    return NextResponse.json({ error: "Failed to logout user" }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
