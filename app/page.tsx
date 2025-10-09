import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
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
    </div>
  );
}
