"use client";
import * as React from "react";
import { useSettings } from "../../internal/provider";
import { VisuallyHidden } from "../VisuallyHidden/VisuallyHidden";
import { en as words } from "./labels";

/* What an external Link says after its text ("(opens in a new tab)"), in the provider's words. It's a client
   module of its own, so Link stays a Server Component. */
export function NewTabNote() {
  return <VisuallyHidden> {useSettings(words).labels.opensInNewTab}</VisuallyHidden>;
}
