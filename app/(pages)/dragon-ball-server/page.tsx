import axios from "axios";
import type { Character, ApiResponse } from "@/app/(types)/characters";

export default async function NarutoSSRPage() {
  let data: Character[] = [];

  try {
    const response = await axios.get<ApiResponse>(
      "https://dattebayo-api.onrender.com/characters",
      {
        timeout: 10000,
      }
    );

    data = response.data.characters;
  } catch (err) {
    console.error("Lỗi khi fetch:", err);
    return (
      <p className="text-red-500 text-center mt-10">
        Không thể tải dữ liệu từ Naruto API
      </p>
    );
  }

  if (!data?.length) {
    return (
      <p className="text-gray-500 text-center mt-10">
        Không có dữ liệu nhân vật.
      </p>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-center text-orange-600">
        Danh sách nhân vật Naruto (SSR )
      </h1>

      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((char) => (
          <li
            key={char.id}
            className="border rounded-lg shadow hover:shadow-lg transition overflow-hidden bg-white"
          >
            {/* Ảnh */}
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
              {char.images?.length ? (
                <img
                  src={char.images[0]}
                  alt={char.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-400">Không có ảnh</span>
              )}
            </div>

            {/* Nội dung */}
            <div className="p-4">
              <h2 className="font-semibold text-lg text-gray-800 mb-2">
                {char.name}
              </h2>

              {/* Thông tin cơ bản */}
              <p className="text-sm text-gray-600">
                <strong>Giới tính:</strong> {char.personal?.sex || "Không rõ"}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Trạng thái:</strong> Không rõ
              </p>
              {char.personal?.affiliation && (
                <p className="text-sm text-gray-600">
                  <strong>Liên kết:</strong>{" "}
                  {char.personal.affiliation.join(", ")}
                </p>
              )}

              {/* Jutsu */}
              {char.jutsu?.length ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-orange-500">
                    🌀 Jutsu ({char.jutsu.length})
                  </summary>
                  <ul className="mt-1 text-sm text-gray-700 list-disc list-inside max-h-24 overflow-y-auto">
                    {char.jutsu.slice(0, 5).map((j, idx) => (
                      <li key={idx}>{j}</li>
                    ))}
                    {char.jutsu.length > 5 && <li>...và nhiều hơn</li>}
                  </ul>
                </details>
              ) : (
                <p className="text-sm text-gray-500 mt-2 italic">
                  Không có jutsu được ghi nhận.
                </p>
              )}

              {/* Debut */}
              <div className="mt-3 text-sm text-gray-600">
                {char.debut?.anime && (
                  <p>
                    🎬 <strong>Anime:</strong> {char.debut.anime}
                  </p>
                )}
                {char.debut?.manga && (
                  <p>
                    📖 <strong>Manga:</strong> {char.debut.manga}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
