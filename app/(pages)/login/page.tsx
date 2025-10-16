import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import LoginButton from "@/app/(components)/LoginButton";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const showSuccessMessage = searchParams?.message === "registration-success";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md w-full">
          <div className="flex items-center">
            <div className="text-green-600 text-xl mr-3">✅</div>
            <div>
              <h3 className="text-green-800 font-medium">
                Đăng ký thành công!
              </h3>
              <p className="text-green-700 text-sm">
                Bạn có thể đăng nhập với tài khoản vừa tạo.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Chào mừng trở lại!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Đăng nhập để truy cập ứng dụng Naruto API
        </p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200 w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Đăng nhập</h2>
          <p className="text-gray-600 mt-2">
            Sử dụng tài khoản Keycloak của bạn
          </p>
        </div>

        {/* <form action="/api/auth/signin/keycloak" method="post">
          <button
            type="submit"
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Đăng nhập với Keycloak
          </button>
        </form> */}

        <LoginButton />

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Bằng cách đăng nhập, bạn đồng ý với các điều khoản sử dụng
          </p>
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="text-sm text-gray-500">
          Cần hỗ trợ?{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Liên hệ hỗ trợ
          </a>
        </p>
      </div>
    </div>
  );
}
