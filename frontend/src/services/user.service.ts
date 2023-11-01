import { API_URL } from "../constants/api.constant";

export const getMe = async () => {
  const res = await fetch(`${API_URL}/users/getMe`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("access_token")}`,
    },
  });

  return await res.json();
};
