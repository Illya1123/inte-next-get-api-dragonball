import { NextResponse } from "next/server";

interface RegisterRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body: RegisterRequest = await request.json();
    const { username, email, firstName, lastName, password } = body;

    // Validate required fields
    if (!username || !email || !firstName || !lastName || !password) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    // Get admin access token from Keycloak
    const keycloakBaseUrl = process.env.KEYCLOAK_ISSUER!.replace(
      "/realms/my-realm",
      ""
    );
    const tokenResponse = await fetch(
      `${keycloakBaseUrl}/realms/master/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "password",
          client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
          username: process.env.KEYCLOAK_ADMIN_USERNAMENAME!,
          password: process.env.KEYCLOAK_ADMIN_PASSWORDWORD!,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Token error:", errorText);
      return NextResponse.json(
        { error: "Không thể kết nối đến server xác thực" },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Create user in Keycloak
    const createUserResponse = await fetch(
      `${keycloakBaseUrl}/admin/realms/my-realm/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          username,
          email,
          firstName,
          lastName,
          enabled: true,
          emailVerified: true,
          credentials: [
            {
              type: "password",
              value: password,
              temporary: false,
            },
          ],
        }),
      }
    );

    if (createUserResponse.status === 409) {
      return NextResponse.json(
        { error: "Tên đăng nhập hoặc email đã tồn tại" },
        { status: 409 }
      );
    }

    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      console.error("Create user error:", errorText);
      return NextResponse.json(
        { error: "Không thể tạo tài khoản. Vui lòng thử lại." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Đăng ký thành công!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi đăng ký" },
      { status: 500 }
    );
  }
}
