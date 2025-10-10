export type Character = {
  id: number;
  name: string;
  ki: string;
  race: string;
  description: string;
  image: string;
  affiliation: string;
};

export type ApiResponse = {
  items: Character[];
};