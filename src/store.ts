import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Movie } from './api';

interface LibraryState {
  watchlist: Movie[];
  seenList: Movie[];
  addToWatchlist: (movie: Movie) => void;
  removeFromWatchlist: (id: number) => void;
  markAsSeen: (movie: Movie) => void;
  removeFromSeen: (id: number) => void;
  isInWatchlist: (id: number) => boolean;
  hasSeen: (id: number) => boolean;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      watchlist: [],
      seenList: [],
      addToWatchlist: (movie) =>
        set((state) => {
          if (state.watchlist.find((m) => m.id === movie.id)) return state;
          return {
            watchlist: [movie, ...state.watchlist],
            seenList: state.seenList.filter((m) => m.id !== movie.id), // remove from seen if re-adding to watch
          };
        }),
      removeFromWatchlist: (id) =>
        set((state) => ({
          watchlist: state.watchlist.filter((m) => m.id !== id),
        })),
      markAsSeen: (movie) =>
        set((state) => {
          if (state.seenList.find((m) => m.id === movie.id)) return state;
          return {
            seenList: [movie, ...state.seenList],
            watchlist: state.watchlist.filter((m) => m.id !== movie.id), // remove from watchlist if seen
          };
        }),
      removeFromSeen: (id) =>
        set((state) => ({
          seenList: state.seenList.filter((m) => m.id !== id),
        })),
      isInWatchlist: (id) => !!get().watchlist.find((m) => m.id === id),
      hasSeen: (id) => !!get().seenList.find((m) => m.id === id),
    }),
    {
      name: 'cinemind-library', // name of the item in the storage (must be unique)
    }
  )
);
