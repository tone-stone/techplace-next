"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/** One collapsible row of the accordion: a title/icon header plus its expandable body content. */
export type AccordionItem = {
  id: string;
  title: string;
  icon?: ReactNode;
  body: ReactNode;
};

/**
 * Mobile-only (`sm:hidden` from the caller). On phones the card grids collapse
 * to a single column, which turns each section into a long vertical scroll;
 * this shows the same content as a one-open-at-a-time accordion instead.
 * Desktop keeps rendering the original grid (`hidden sm:grid`).
 *
 * @param items - The accordion rows to render, in order.
 */
export default function MobileAccordion({
  items,
  className = "",
}: {
  items: AccordionItem[];
  className?: string;
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className={`flex flex-col gap-3 text-left ${className}`}>
      {items.map((item) => {
        const open = openId === item.id;
        return (
          <div key={item.id} className="tp-glass overflow-hidden rounded-2xl">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : item.id)}
              aria-expanded={open}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              {item.icon && (
                <span className="shrink-0 text-purple-300 [&_svg]:h-7 [&_svg]:w-7">
                  {item.icon}
                </span>
              )}
              <span className="flex-1 font-heading text-base font-bold text-white">
                {item.title}
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 text-purple-300 transition-transform duration-300 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="overflow-hidden">
                <div className="border-t border-white/10 px-5 pb-5 pt-4 text-sm text-gray-300">
                  {item.body}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
