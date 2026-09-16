/**
 * Purely decorative full-page background: a handful of large, softly
 * blurred color blobs that slowly drift via CSS keyframe animation. Sits
 * behind the rest of the landing page content to give it an "aurora" glow;
 * marked `aria-hidden` since it carries no information.
 */
export default function Aurora() {
  return (
    <div className="tp-aurora" aria-hidden>
      <div
        className="tp-aurora-blob bg-indigo-600 animate-[tp-float_30s_ease-in-out_infinite]"
        style={{ top: "-10%", left: "-10%", width: "42rem", height: "42rem" }}
      />
      <div
        className="tp-aurora-blob bg-violet-700 animate-[tp-float_25s_ease-in-out_infinite_reverse]"
        style={{ top: "5%", right: "-12%", width: "34rem", height: "34rem" }}
      />
      <div
        className="tp-aurora-blob bg-purple-700 animate-[tp-float_34s_ease-in-out_infinite]"
        style={{ top: "38%", left: "20%", width: "38rem", height: "38rem" }}
      />
      <div
        className="tp-aurora-blob bg-blue-600 animate-[tp-float_28s_ease-in-out_infinite_reverse]"
        style={{ top: "62%", right: "-8%", width: "36rem", height: "36rem" }}
      />
      <div
        className="tp-aurora-blob bg-purple-800 animate-[tp-float_38s_ease-in-out_infinite]"
        style={{ top: "88%", left: "-8%", width: "40rem", height: "40rem" }}
      />
    </div>
  );
}
