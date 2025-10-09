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

export default async function ServerFetchPage() {
  const res = await fetch("https://dragonball-api.com/api/characters", {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    console.error("Fetch failed:", res.status, res.statusText);
    throw new Error("Lỗi khi fetch dữ liệu từ API");
  }

  const data: ApiResponse = await res.json();

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Server Component Fetch</h1>
      <ul className="grid gap-4">
        {data.items.map((char) => (
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
