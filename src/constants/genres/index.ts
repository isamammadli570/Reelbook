/** Genre tiles on the discover page. TMDB uses different ids for movies and series, so both are kept. */
export const GENRES = [
    {key: "drama", movieId: 18, tvId: 18, bg: "#3A1E2A", fg: "#F9D3E4", dot: "#6B2E4A"},
    {key: "comedy", movieId: 35, tvId: 35, bg: "#4A2E14", fg: "#FCE3C4", dot: "#7A4A1E"},
    {key: "animation", movieId: 16, tvId: 16, bg: "#163A33", fg: "#CDEBE2", dot: "#235A4F"},
    {key: "documentary", movieId: 99, tvId: 99, bg: "#2A2440", fg: "#DDD8F5", dot: "#433A6B"},
    {key: "crime", movieId: 80, tvId: 80, bg: "#2A2A1A", fg: "#EEEBC8", dot: "#4A4A2A"},
    {key: "scifi", movieId: 878, tvId: 10765, bg: "#1A2A4A", fg: "#CFE0FA", dot: "#2E4A7A"},
] as const;

export type GenreTile = (typeof GENRES)[number];

/**
 * TMDB has almost no Azerbaijani data, so the app asks it in English; these are its movie and TV genre
 * names in the other app languages. Russian requests already return Russian names and pass through unchanged.
 */
export const GENRE_TRANSLATIONS: Record<string, {az: string; ru: string}> = {
    "Action": {az: "Döyüş", ru: "Боевик"},
    "Adventure": {az: "Macəra", ru: "Приключения"},
    "Animation": {az: "Animasiya", ru: "Мультфильм"},
    "Comedy": {az: "Komediya", ru: "Комедия"},
    "Crime": {az: "Kriminal", ru: "Криминал"},
    "Documentary": {az: "Sənədli", ru: "Документальный"},
    "Drama": {az: "Dram", ru: "Драма"},
    "Family": {az: "Ailə", ru: "Семейный"},
    "Fantasy": {az: "Fantaziya", ru: "Фэнтези"},
    "History": {az: "Tarix", ru: "История"},
    "Horror": {az: "Qorxu", ru: "Ужасы"},
    "Music": {az: "Musiqi", ru: "Музыка"},
    "Mystery": {az: "Detektiv", ru: "Детектив"},
    "Romance": {az: "Romantika", ru: "Мелодрама"},
    "Science Fiction": {az: "Elmi fantastika", ru: "Фантастика"},
    "TV Movie": {az: "TV filmi", ru: "Телефильм"},
    "Thriller": {az: "Triller", ru: "Триллер"},
    "War": {az: "Müharibə", ru: "Военный"},
    "Western": {az: "Vestern", ru: "Вестерн"},
    "Action & Adventure": {az: "Döyüş və macəra", ru: "Боевик и приключения"},
    "Kids": {az: "Uşaq", ru: "Детский"},
    "News": {az: "Xəbər", ru: "Новости"},
    "Reality": {az: "Realiti", ru: "Реалити-шоу"},
    "Sci-Fi & Fantasy": {az: "Fantastika", ru: "НФ и фэнтези"},
    "Soap": {az: "Melodram", ru: "Мыльная опера"},
    "Talk": {az: "Tok-şou", ru: "Ток-шоу"},
    "War & Politics": {az: "Müharibə və siyasət", ru: "Война и политика"},
};
