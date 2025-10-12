export type Character = {
  id: number;
  name: string;
  images: string[];
  debut: {
    manga?: string;
    anime?: string;
    novel?: string;
    movie?: string;
    game?: string;
    ova?: string;
    appearsIn?: string;
  };
  family?: Record<string, string>;

  jutsu?: string[];
  natureType?: string[];

  personal?: {
    birthdate?: string;
    sex?: string;
    age?: Record<string, string>;
    height?: Record<string, string>;
    weight?: Record<string, string>;
    bloodType?: string;
    kekkeiGenkai?: string[];
    classification?: string[];
    tailedBeast?: string;
    occupation?: string[];
    affiliation?: string[];
    team?: string[];
    clan?: string;
    titles?: string[];
  };

  rank?: {
    ninjaRank?: Record<string, string>;
    ninjaRegistration?: string;
  };

  tools?: string[];

  voiceActors?: {
    japanese?: string[];
    english?: string[];
  };
};

export type ApiResponse = {
  characters: Character[];
};
