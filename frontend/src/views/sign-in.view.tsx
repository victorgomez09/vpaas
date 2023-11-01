import { ValidatorSetup, useForm } from "@esmo/react-utils/forms";
import { useIsomorphicLayoutEffect } from "@esmo/react-utils/hooks";
import { useNavigate } from "@esmo/react-utils/router";
import { useMutation } from "@esmo/react-utils/state";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Toast } from "primereact/toast";

import { useRef } from "react";
import { SignIn, SignInResponse } from "../models/auth.model";
import { signin } from "../services/auth.service";
import { ACCESS_TOKEN } from "../constants/auth.constant";
import { useUserStore } from "../stores/user.store";

const validatorSetup: ValidatorSetup<SignIn> = {
  email: {
    required: true,
    pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    errorMessages: {
      pattern: "Please enter a valid email address",
      required: "Email is required",
    },
  },
  password: {
    required: true,
    errorMessages: {
      required: "Password is required",
    },
  },
};

export function SingIn() {
  const toast = useRef<Toast>(null);
  const { mutate, data, isMutating, isError, isSuccess } = useMutation<
    SignIn,
    SignInResponse
  >(signin);
  const { isValid, values, handleBlur, handleChange, fields, setupComplete } =
    useForm<SignIn>(validatorSetup);
  const navigate = useNavigate("/app");
  const { setUser } = useUserStore((state) => [state.setUser]);

  const showError = () => {
    toast.current?.show({
      severity: "error",
      summary: "Error",
      detail: "Ops! Something goes wrong!",
      life: 6000,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    mutate(values);

    if (isSuccess && data) {
      localStorage.setItem(ACCESS_TOKEN, data.token);
      setUser(data.user);
      navigate();
    }
  };

  useIsomorphicLayoutEffect(() => {
    if (isError) {
      showError();
    }
  }, [isError]);

  return (
    <div className="flex flex-column flex-1 align-items-center justify-content-center">
      <Toast ref={toast} />

      <h2>Sign in</h2>

      {setupComplete && (
        <form onSubmit={handleSubmit}>
          <div className="flex flex-column gap-2">
            <label htmlFor="email">Email</label>
            <InputText
              placeholder="Email"
              name="email"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.email}
              className={`${fields.email.showError ? "p-invalid" : ""}`}
            />
            {fields.email.showError && (
              <small className="p-error">{fields.email.errors[0]}</small>
            )}
          </div>

          <div className="flex flex-column gap-2 mt-3">
            <label htmlFor="password">Password</label>
            <Password
              placeholder="Password"
              name="password"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.password}
              className={`${fields.password.showError ? "p-invalid" : ""}`}
              toggleMask
              feedback={false}
            />
            {fields.password.showError && (
              <small className="p-error">{fields.password.errors[0]}</small>
            )}
          </div>

          <div className="flex flex-1 mt-5">
            <Button
              label="Submit"
              type="submit"
              className="w-full"
              disabled={!isValid}
              loading={isMutating}
            />
          </div>
        </form>
      )}
    </div>
  );
}
