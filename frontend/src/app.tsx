import { BrowserRouter, Route, Routes } from "@esmo/react-utils/router";
import { PrimeReactProvider } from "primereact/api";

import { PrivateRoute } from "./routes/private.route";
import { PublicRoute } from "./routes/public.route";
import Dashboard from "./views/dashboard.view";
import { SingIn } from "./views/sign-in.view";
import SingUp from "./views/sign-up.view";

export default function App() {
  return (
    <>
      <PrimeReactProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/app"
              children={<PrivateRoute children={<Dashboard />} />}
            />
            <Route
              path="/signin"
              children={<PublicRoute children={<SingIn />} />}
            />
            <Route
              path="/signup"
              children={<PublicRoute children={<SingUp />} />}
            />
          </Routes>
        </BrowserRouter>
      </PrimeReactProvider>
    </>
  );
}
