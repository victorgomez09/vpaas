import { Redirect } from "@esmo/react-utils/router";

import { useAuth } from "../hooks/auth.hook";

type Props = {
  children: React.ReactNode;
};

export function PrivateRoute({ children }: Props) {
  const { user, token } = useAuth();

  return token && user.email !== "" ? children : <Redirect href="/signin" />;
}
