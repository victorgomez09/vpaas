import { Redirect } from "@esmo/react-utils/router";
import { ACCESS_TOKEN } from "../constants/auth.constant";

type Props = {
  children: React.ReactNode;
};

export function PublicRoute({ children }: Props) {
  const token = localStorage.getItem(ACCESS_TOKEN);

  if (token) {
    return <Redirect href="/app" />;
  }

  return children;
}
