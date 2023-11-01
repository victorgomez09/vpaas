import { useEffect } from "react";
import { ACCESS_TOKEN } from "../constants/auth.constant";
import { useUserStore } from "../stores/user.store";
import { useMutation } from "@esmo/react-utils/state";
import { getMe } from "../services/user.service";
import { User } from "../models/user.model";

export const useAuth = () => {
  const token = localStorage.getItem(ACCESS_TOKEN);
  const { user, setUser } = useUserStore((state) => [
    state.user,
    state.setUser,
  ]);
  const { mutate, data, isMutating, isSuccess } = useMutation<undefined, User>(
    getMe
  );

  useEffect(() => {
    const fetchData = async () => {
      if (token && user.email === "") {
        try {
          mutate(undefined);

          if (isSuccess) {
            setUser(data!);
          }
        } catch (e) {
          console.log(e);
        }
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, isSuccess, isMutating, user]);

  return {
    token: token,
    isLoading: isMutating,
    user: user,
  };
};
