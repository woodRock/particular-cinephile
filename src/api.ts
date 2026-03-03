import { GoogleGenerativeAI } from "@google/generative-ai";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export interface Movie {
  id: number;
  title: string;
  poster_path: string;
  backdrop_path?: string;
  overview: string;
  release_date: string;
  vote_average: number;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface MovieDetails extends Movie {
  runtime: number;
  genres: { id: number; name: string }[];
  credits: { cast: CastMember[] };
  videos: { results: Video[] };
  similar: { results: Movie[] };
}

export const searchMoviesSemantic = async (query: string, seenMovieTitles: string[] = []): Promise<Movie[]> => {
  try {
    let contextStr = "";
    if (seenMovieTitles.length > 0) {
      contextStr = `\nThe user has already seen these movies and liked them. Try to recommend NEW movies similar to these but matching their query, OR avoid these if they are looking for something completely different. DO NOT recommend any movies in this "seen" list: ${seenMovieTitles.slice(0, 30).join(", ")}.`;
    }

    const prompt = `You are a movie recommendation expert. The user is asking: "${query}". ${contextStr}
    Provide a list of 10 movie titles that match this semantic search. 
    Return ONLY a JSON array of strings containing the exact movie titles. 
    Example: ["Inception", "Interstellar", "The Matrix"]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const titles: string[] = JSON.parse(text.match(/\[.*\]/s)?.[0] || "[]");

    const moviePromises = titles.map(async (title) => {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
      );
      const data = await response.json();
      // Ensure exact or very close title matches if multiple results
      return data.results?.[0] as Movie | undefined;
    });

    const movies = await Promise.all(moviePromises);
    return movies.filter((m): m is Movie => !!m); // Filter out undefined and type assert
  } catch (error) {
    console.error("Semantic search failed:", error);
    return [];
  }
};

export const getTrendingMovies = async (): Promise<Movie[]> => {
  const response = await fetch(
    `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}`
  );
  const data = await response.json();
  return data.results;
};

export const getMovieDetails = async (id: number): Promise<MovieDetails | null> => {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits,similar`
    );
    if (!response.ok) return null;
    return await response.json();
  } catch (e) {
    console.error("Failed to fetch details", e);
    return null;
  }
};
