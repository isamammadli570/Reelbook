export type Genre = {
    id: number;
    name: string;
};

export type CastMember = {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
    order: number;
};

export type CrewMember = {
    id: number;
    name: string;
    job: string;
};

/** The `credits` block TMDB appends to a movie or series. */
export type Credits = {
    cast: CastMember[];
    crew: CrewMember[];
};
