import { create } from "zustand";

export type UserDto = {
  user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  utm: string | null;
  rule: boolean;
  subs: boolean;
  created_at: string;
};

export type LocationProgressDto = {
  location: string;
  is_success: boolean;
  attempts: number;
};

export type GetUserDataResponse = {
  user: UserDto | null;
  locations?: LocationProgressDto[];
  winners?: WinnerDto[];
};

export type AnswerDto = {
  id: number;
  text: string;
};

export type WinnerDto = {
  user_id: number;
  username: string | null;
  first_name: string | null;
};

type AppState = {
  user: UserDto | null;
  locations: LocationProgressDto[];
  winners: WinnerDto[];
  isHydrated: boolean;

  selectedAnswersByQuestion: Record<number, number>;

  setUser: (user: UserDto | null) => void;
  setUserSubs: (subs: boolean) => void;
  setUserRule: (rule: boolean) => void;

  setLocations: (locations: LocationProgressDto[]) => void;
  setWinners: (winners: WinnerDto[]) => void;
  upsertLocationProgress: (location: string, isSuccess: boolean) => void;

  hydrateFromServer: (data: GetUserDataResponse) => void;

  setAnswer: (questionId: number, answerId: number) => void;
  resetTestProgress: () => void;

  reset: () => void;
};

const initialState = {
  user: null,
  locations: [],
  questions: [],
  winners: [],
  isHydrated: false,
  selectedAnswersByQuestion: {},
  finalResponse: null,
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  setUserSubs: (subs) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            subs,
          }
        : null,
    })),

  setUserRule: (rule) =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            rule,
          }
        : null,
    })),

  setLocations: (locations) =>
    set({
      locations,
    }),

  setWinners: (winners) =>
    set({
      winners,
    }),

  upsertLocationProgress: (location, isSuccess) =>
    set((state) => {
      const currentLocation = state.locations.find(
        (item) => item.location === location,
      );

      if (!currentLocation) {
        return {
          locations: [
            ...state.locations,
            {
              location,
              is_success: isSuccess,
              attempts: 1,
            },
          ],
        };
      }

      return {
        locations: state.locations.map((item) =>
          item.location === location
            ? {
                ...item,
                is_success: item.is_success || isSuccess,
                attempts: item.attempts + 1,
              }
            : item,
        ),
      };
    }),

  hydrateFromServer: (data) =>
    set({
      user: data.user ?? null,
      locations: Array.isArray(data.locations) ? data.locations : [],
      winners: Array.isArray(data.winners) ? data.winners : [],
      isHydrated: true,
      selectedAnswersByQuestion: {},
    }),

  setAnswer: (questionId, answerId) =>
    set((state) => ({
      selectedAnswersByQuestion: {
        ...state.selectedAnswersByQuestion,
        [questionId]: answerId,
      },
    })),

  resetTestProgress: () =>
    set({
      selectedAnswersByQuestion: {},
    }),

  reset: () => set(initialState),
}));
