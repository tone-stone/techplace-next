import type { IconType } from "react-icons";
import { FaAws, FaMicrosoft } from "react-icons/fa6";
import { TbBrandAzure, TbBrandOpenai, TbBrandVscode } from "react-icons/tb";
import {
  SiAndroid,
  SiApple,
  SiArduino,
  SiClaude,
  SiCss,
  SiDebian,
  SiDocker,
  SiExpress,
  SiGit,
  SiHtml5,
  SiIos,
  SiJavascript,
  SiKalilinux,
  SiLinux,
  SiMongodb,
  SiMysql,
  SiNextcloud,
  SiNextdotjs,
  SiNodedotjs,
  SiOpenjdk,
  SiPhp,
  SiPostgresql,
  SiPython,
  SiReact,
  SiSharp,
  SiTypescript,
  SiUbuntu,
  SiVuedotjs,
} from "react-icons/si";

const TECHS: { name: string; Icon: IconType }[] = [
  { name: "TypeScript", Icon: SiTypescript },
  { name: "JavaScript", Icon: SiJavascript },
  { name: "HTML5", Icon: SiHtml5 },
  { name: "CSS", Icon: SiCss },
  { name: "Python", Icon: SiPython },
  { name: "PHP", Icon: SiPhp },
  { name: "Java", Icon: SiOpenjdk },
  { name: "C#", Icon: SiSharp },
  { name: "React", Icon: SiReact },
  { name: "React Native", Icon: SiReact },
  { name: "Next.js", Icon: SiNextdotjs },
  { name: "Vue", Icon: SiVuedotjs },
  { name: "Node.js", Icon: SiNodedotjs },
  { name: "Express", Icon: SiExpress },
  { name: "PostgreSQL", Icon: SiPostgresql },
  { name: "MySQL", Icon: SiMysql },
  { name: "MongoDB", Icon: SiMongodb },
  { name: "Git", Icon: SiGit },
  { name: "Docker", Icon: SiDocker },
  { name: "Linux", Icon: SiLinux },
  { name: "Ubuntu", Icon: SiUbuntu },
  { name: "Debian", Icon: SiDebian },
  { name: "Kali Linux", Icon: SiKalilinux },
  { name: "Arduino", Icon: SiArduino },
  { name: "Android", Icon: SiAndroid },
  { name: "iOS", Icon: SiIos },
  { name: "Apple", Icon: SiApple },
  { name: "AWS", Icon: FaAws },
  { name: "Azure", Icon: TbBrandAzure },
  { name: "Microsoft", Icon: FaMicrosoft },
  { name: "Nextcloud", Icon: SiNextcloud },
  { name: "VS Code", Icon: TbBrandVscode },
  { name: "Claude", Icon: SiClaude },
  { name: "OpenAI", Icon: TbBrandOpenai },
  { name: "ChatGPT", Icon: TbBrandOpenai },
];

// The list is rendered twice back-to-back; the CSS animation translates the
// track by -50% so the second copy lands exactly where the first began,
// giving a seamless infinite loop with zero JavaScript.
export default function TechStack() {
  return (
    <section
      aria-label="Tecnologías que utilizamos"
      className="relative py-12 border-t border-white/5"
    >
      <p className="text-center text-xs uppercase tracking-[0.22em] text-gray-500 mb-7">
        Tecnologías que dominamos
      </p>
      <div className="tp-marquee">
        <ul className="tp-marquee-track">
          {[...TECHS, ...TECHS].map((tech, i) => (
            <li
              key={i}
              className="tp-marquee-item"
              aria-hidden={i >= TECHS.length}
            >
              <tech.Icon className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">{tech.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
