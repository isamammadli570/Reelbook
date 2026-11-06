import {api, segment} from "@/api/client";
import {API_ENDPOINTS} from "@/constants/endpoints";
import type {MediaType} from "@/constants/other";

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

/** A person as search results list them. */
export type PersonSummary = {
    id: number;
    name: string;
    profile_path: string | null;
    known_for_department: string;
};

/** One movie or series in a person's career; `character` for acting, `job` for crew work. */
export type PersonCredit = {
    id: number;
    media_type: MediaType;
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_count: number;
    vote_average: number;
    character?: string;
    job?: string;
    episode_count?: number;
};

export type PersonDetails = PersonSummary & {
    biography: string;
    birthday: string | null;
    deathday: string | null;
    place_of_birth: string | null;
    combined_credits: {cast: PersonCredit[]; crew: PersonCredit[]};
};

/** One request for the whole person page: the biography and every movie and series they worked on. */
export const getPerson = (personId: number) =>
    api.get<PersonDetails>(`${API_ENDPOINTS.PERSON}/${segment(personId)}`, {params: {append_to_response: "combined_credits"}});
