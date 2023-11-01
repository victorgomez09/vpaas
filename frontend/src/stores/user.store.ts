import { createStore } from "@esmo/react-utils/store";
import { User } from "../models/user.model";

type UserStore = {
  user: User;
  setUser: (user: User) => void;
};

export const useUserStore = createStore<UserStore>(({ set }) => ({
  user: {
    id: 0,
    name: "",
    email: "",
    createdAt: "",
    updatedAt: "",
  },
  setUser: (user: User) => set(() => ({ user: user })),
}));
