"use client";

import { useEffect, useState } from "react";

type Character = {
  id: number;
  name: string;
  ki: string;
  race: string;
  description: string;
  image: string;
  affiliation: string;
};

type ApiResponse = {
  items: Character[];
};

export default function ClientFetchPage() {
  const [data, setData] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCharacters = async () => {
      try {
        const res = await fetch("https://dragonball-api.com/api/characters");

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json: ApiResponse = await res.json();
        setData(json.items);
      } catch (err) {
        console.error("Lỗi khi fetch:", err);
        setError("Không thể tải dữ liệu từ API");
      } finally {
        setLoading(false);
      }
    };

    getCharacters();
  }, []);

  if (loading) return <p>⏳ Đang tải dữ liệu...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Client Component Fetch</h1>
      <ul className="grid gap-4">
        {data.map((char) => (
          <li
            key={char.id}
            className="flex gap-4 p-2 border rounded-md items-center"
          >
            <img
              src={char.image}
              width={80}
              height={80}
              alt={char.name}
              className="rounded-md object-cover"
            />
            <div>
              <strong>{char.name}</strong> <br />
              {char.race} – {char.affiliation} – <span>Ki: {char.ki}</span>
              <br />
              <span className="text-gray-600 text-sm block mt-1">
                {char.description}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
