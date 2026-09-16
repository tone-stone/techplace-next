"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";

type ServiceCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  linkHref: string;
  linkLabel: string;
};

/**
 * A single glassmorphic card in the "Servicios" grid, presenting one
 * TechPlace offering with an icon, title, description, and call-to-action
 * link. Tilts toward the cursor on mouse move for a subtle 3D hover effect.
 */
export default function ServiceCard({
  icon,
  title,
  description,
  linkHref,
  linkLabel,
}: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Tilts the card on its X/Y axes proportionally to cursor distance from center.
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateX = (y / rect.height) * 10;
    const rotateY = (x / rect.width) * -10;
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.045)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = "";
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="tp-glass tp-glass-hover group relative rounded-2xl p-10 overflow-hidden transition-transform duration-300 will-change-transform"
    >
      <div className="mb-6 flex justify-center relative">
        <div className="tp-icon-glow text-purple-300 transition-[color,transform] duration-300 group-hover:text-purple-400 group-hover:scale-[1.15] group-hover:-rotate-6">
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2 drop-shadow">{title}</h3>
      <p className="text-gray-300 mb-3 text-justify">{description}</p>
      <Link
        href={linkHref}
        className="-mx-2 -mb-3 mt-2 inline-block px-2 pt-1 pb-3 text-brand-blue font-bold underline underline-offset-4 hover:text-brand-blue transition duration-200"
      >
        {linkLabel} →
      </Link>
    </div>
  );
}
