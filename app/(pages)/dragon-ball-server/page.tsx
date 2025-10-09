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

export default async function ServerFetchPage() {
  const res = await fetch("https://dragonball-api.com/api/characters", {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Lỗi khi fetch dữ liệu");
  }

  const data: ApiResponse = await res.json();

  return (
    <div>
      <h1>Server Component Fetch</h1>
      <ul className="grid gap-2">
        {data.items.map((char) => (
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
