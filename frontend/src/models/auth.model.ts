import { User } from "./user.model";

export interface SignIn {
  email: string;
  password: string;
}

export interface SignInResponse {
  token: string;
  user: User;
}
