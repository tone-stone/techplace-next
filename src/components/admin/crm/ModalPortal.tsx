"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

// CRM section cards use `.tp-dark-card-crm`, which sets `backdrop-filter` —
// that creates a new containing block for `position: fixed` descendants per
// the CSS spec. A modal mounted inline inside one of those cards (as these
// all are, via `{show && <Modal />}` in the section component) ends up
// sized and clipped to the card's own box instead of the viewport, instead
// of covering the screen. Portaling to `document.body` escapes any
// ancestor's containing-block-creating properties for good, regardless of
// which card the modal happens to be triggered from.
//
// No mount-check needed: every modal here is only rendered in response to a
// client-side click (`{show && <Modal />}` with `show` starting false/null),
// so this never runs during SSR — `document` is always available.
export default function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
