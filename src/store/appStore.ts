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
};

export type AnswerDto = {
  id: number;
  text: string;
};

export type QuestionDto = {
  id: number;
  picture: string;
  picture_overlay: string;
  answers: AnswerDto[];
};

export type FinalResultDto = {
  id: number;
  picture: string;
  text: string;
  promocode_text: string;
  promocode: string | null;
  promocode_ended_text: string;
};

export type FinalResponseDto = {
  success: boolean;
  correct_answers: number;
  total_questions: number;
  result: FinalResultDto;
};

type AppState = {
  user: UserDto | null;
  locations: LocationProgressDto[];
  questions: QuestionDto[];
  isHydrated: boolean;

  selectedAnswersByQuestion: Record<number, number>;
  finalResponse: FinalResponseDto | null;

  setUser: (user: UserDto | null) => void;
  setUserSubs: (subs: boolean) => void;
  setUserRule: (rule: boolean) => void;

  setLocations: (locations: LocationProgressDto[]) => void;
  upsertLocationProgress: (location: string, isSuccess: boolean) => void;

  setQuestions: (questions: QuestionDto[]) => void;
  hydrateFromServer: (data: GetUserDataResponse) => void;

  setAnswer: (questionId: number, answerId: number) => void;
  resetTestProgress: () => void;

  setFinalResponse: (data: FinalResponseDto | null) => void;
  reset: () => void;
};

const initialState = {
  user: null,
  locations: [],
  questions: [],
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

  setQuestions: (questions) => set({ questions }),

  hydrateFromServer: (data) =>
    set({
      user: data.user ?? null,
      locations: Array.isArray(data.locations) ? data.locations : [],
      isHydrated: true,
      selectedAnswersByQuestion: {},
      finalResponse: null,
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
      finalResponse: null,
    }),

  setFinalResponse: (data) => set({ finalResponse: data }),

  reset: () => set(initialState),
}));