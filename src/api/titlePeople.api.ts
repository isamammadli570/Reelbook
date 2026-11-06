import {api, segment} from "@/api/client";
import type {TitlePeople} from "@/api/library.api";
import type {Credits} from "@/api/people.api";
import type {AggregateCredits} from "@/api/titleExtras.api";
import {API_ENDPOINTS} from "@/constants/endpoints";
import {MEDIA_TYPE, type MediaType} from "@/constants/other";
import {moviePeople, seriesPeople} from "@/helpers/library";

/** Who directed and stars in one title, asked on its own for items saved before people were kept. */
export const getTitlePeople = async (mediaType: MediaType, id: number): Promise<TitlePeople> => {
    if (mediaType === MEDIA_TYPE.MOVIE) {
        return moviePeople(await api.get<Credits>(`${API_ENDPOINTS.MOVIE}/${segment(id)}/credits`));
    }
    return seriesPeople(await api.get<AggregateCredits>(`${API_ENDPOINTS.TV}/${segment(id)}/aggregate_credits`));
};
