import { useAppStore } from "../store/appStore";

const API_ORIGIN = "https://plenka.brandservicebot24.ru";
import { getTelegramAuthHeaders } from "./telegramAuth";

export type SaveGameResultPayload = {
  user_id: number;
  location: string;
  is_success: boolean;
};

export type SaveGameResultResponse = {
  success: boolean;
};

export const saveGameResult = async (
  payload: SaveGameResultPayload,
): Promise<SaveGameResultResponse> => {
  const response = await fetch(`${API_ORIGIN}/api/save_result/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTelegramAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`POST /api/save_result/ → HTTP ${response.status}`);
  }

  const data: SaveGameResultResponse = await response.json();

  useAppStore
    .getState()
    .upsertLocationProgress(payload.location, payload.is_success);

  return data;
};
