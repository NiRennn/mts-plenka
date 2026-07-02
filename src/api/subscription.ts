import { useAppStore } from "../store/appStore";

const API_ORIGIN = "https://plenka.brandservicebot24.ru";

export type CheckSubscriptionResponse = {
  success: boolean;
  subs: boolean;
};

export const checkUserSubscription = async (
  userId: number | string,
): Promise<CheckSubscriptionResponse> => {
  const response = await fetch(`${API_ORIGIN}/api/check_subscription/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: Number(userId),
    }),
  });

  if (!response.ok) {
    throw new Error(`POST /api/check_subscription/ → HTTP ${response.status}`);
  }

  const data: CheckSubscriptionResponse = await response.json();

  useAppStore.getState().setUserSubs(data.subs);

  return data;
};