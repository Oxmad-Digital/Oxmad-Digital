"use client";

import { useState } from "react";
import LoginLinkForm from "./LoginLinkForm";
import PasswordLoginForm from "./PasswordLoginForm";

/** Password sign-in, or (forgotten password) the emailed link, in the same spot of the card. */
export default function LoginPanel() {
  const [mode, setMode] = useState<"password" | "link">("password");
  return mode === "password"
    ? <PasswordLoginForm onForgot={() => setMode("link")} />
    : <LoginLinkForm onBack={() => setMode("password")} />;
}
