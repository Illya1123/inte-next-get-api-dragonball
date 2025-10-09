"use client";

import { useEffect, useState } from "react";

type Character = {
  id: number;
  name: string;
  ki:string;
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

  useEffect(() => {
    const getCharacters = async () => {
      try {
        const res = await fetch("https://dragonball-api.com/api/characters");
        const json: ApiResponse = await res.json();
        setData(json.items);
      } catch (err) {
        console.error("Lỗi khi fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    getCharacters();
  }, []);

  if (loading) return <p>Đang tải dữ liệu...</p>;

  return (
    <div>
      <h1>Client Component Fetch</h1>
      <ul className='grid gap-2'>
        {data.map((char) => (
          <li
            key={char.id}
            className="flex gap-2"
          >
            <img src={char.image} width={60} height={60} alt={char.name} />
            <div>
              <strong>{char.name}</strong> <br />
              {char.race} – {char.affiliation} - ki: {char.ki}
              <br />
              Mô tả:
              <strong>
                {char.description}
              </strong>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
