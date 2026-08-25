"use client";

import { useRef, type ReactNode } from "react";
import { motion } from "motion/react";

type ServiceCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  linkHref: string;
  linkLabel: string;
};

export default function ServiceCard({
  icon,
  title,
  description,
  linkHref,
  linkLabel,
}: ServiceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

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
        <motion.div
          whileHover={{ scale: 1.15, rotate: -6 }}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
          className="tp-icon-glow text-purple-300 group-hover:text-purple-400 transition-colors duration-300"
        >
          {icon}
        </motion.div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2 drop-shadow">{title}</h3>
      <p className="text-gray-300 mb-3">{description}</p>
      <a
        href={linkHref}
        className="inline-block mt-2 text-brand-blue font-bold underline underline-offset-4 hover:text-brand-blue transition duration-200"
      >
        {linkLabel}
      </a>
    </div>
  );
}
