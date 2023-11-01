import { API_URL } from "../constants/api.constant";
import { SignIn } from "../models/auth.model";

export const signin = async (data: SignIn) => {
  const response = await fetch(`${API_URL}/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return await response.json();
};
