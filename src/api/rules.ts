import { useAppStore } from "../store/appStore";

const API_ORIGIN = "https://plenka.brandservicebot24.ru";
import { getTelegramAuthHeaders } from "./telegramAuth";

export type AcceptRulesResponse = {
  success: boolean;
  rule: boolean;
};

export const acceptRules = async (
  userId: number | string,
): Promise<AcceptRulesResponse> => {
  const response = await fetch(`${API_ORIGIN}/api/accept_rules/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getTelegramAuthHeaders(),
    },
    body: JSON.stringify({
      user_id: Number(userId),
    }),
  });

  if (!response.ok) {
    throw new Error(`POST /api/accept_rules/ → HTTP ${response.status}`);
  }

  const data: AcceptRulesResponse = await response.json();

  useAppStore.getState().setUserRule(data.rule);

  return data;
};