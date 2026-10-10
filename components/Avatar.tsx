import type { PersonaId } from "@/lib/personas";

type Props = {
  persona: PersonaId;
  size?: number;
  /** 返事をしている間は口を動かす */
  talking?: boolean;
};

const SKIN = "#fde3cf";
const LINE = "#4a3b34";
const stroke = { stroke: LINE, strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function Grandpa() {
  return (
    <>
      <circle cx="60" cy="60" r="58" fill="#e3efdc" />
      {/* 羽織 */}
      <path d="M14 120 Q16 92 44 86 L76 86 Q104 92 106 120 Z" fill="#6f9a6a" {...stroke} />
      <path d="M46 86 L60 108 L74 86" fill="#f7f3ea" {...stroke} />
      <rect x="52" y="74" width="16" height="14" fill={SKIN} {...stroke} />
      {/* 顔 */}
      <circle cx="31" cy="56" r="6" fill={SKIN} {...stroke} />
      <circle cx="89" cy="56" r="6" fill={SKIN} {...stroke} />
      <path d="M32 52 Q32 20 60 20 Q88 20 88 52 Q88 72 74 80 Q60 86 46 80 Q32 72 32 52 Z" fill={SKIN} {...stroke} />
      {/* 白髪 */}
      <path d="M31 58 Q22 44 32 32 L36 54 Z M89 58 Q98 44 88 32 L84 54 Z" fill="#fff" {...stroke} />
      {/* 眉・目（にこにこ） */}
      <path d="M40 42 Q46 37 53 41 M67 41 Q74 37 80 42" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
      <path d="M40 42 Q46 37 53 41 M67 41 Q74 37 80 42" fill="none" stroke="#b9b2aa" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M41 52 Q47 46 53 52 M67 52 Q73 46 79 52" fill="none" {...stroke} />
      <path d="M36 58 l4 2 M84 58 l-4 2" stroke="#d9a58c" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M60 54 Q57 61 61 63" fill="none" {...stroke} strokeWidth={1.8} />
      {/* ひげと口 */}
      <path className="mouth" d="M53 71 Q60 77 67 71" fill="#b5544b" {...stroke} strokeWidth={1.6} />
      <path d="M44 66 Q60 58 76 66 Q70 70 60 66 Q50 70 44 66 Z" fill="#fff" {...stroke} strokeWidth={1.8} />
      <path d="M48 76 Q60 96 72 76 Q66 82 60 82 Q54 82 48 76 Z" fill="#fff" {...stroke} strokeWidth={1.8} />
    </>
  );
}

function Sister() {
  return (
    <>
      <circle cx="60" cy="60" r="58" fill="#fde4e4" />
      {/* 後ろ髪 */}
      <path d="M24 92 Q14 20 60 16 Q106 20 96 92 Q90 100 82 96 L38 96 Q30 100 24 92 Z" fill="#8a5a44" {...stroke} />
      {/* 服 */}
      <path d="M16 120 Q18 94 44 88 L76 88 Q102 94 104 120 Z" fill="#f08a96" {...stroke} />
      <path d="M46 88 Q60 100 74 88" fill="#fff" {...stroke} />
      <rect x="53" y="76" width="14" height="13" fill={SKIN} {...stroke} />
      {/* 顔 */}
      <path d="M33 52 Q33 24 60 24 Q87 24 87 52 Q87 72 73 80 Q60 86 47 80 Q33 72 33 52 Z" fill={SKIN} {...stroke} />
      {/* 前髪 */}
      <path d="M31 54 Q28 24 60 20 Q92 24 89 54 Q84 38 70 32 Q54 44 36 40 Q32 46 31 54 Z" fill="#8a5a44" {...stroke} />
      {/* リボン */}
      <path d="M82 26 L94 20 L92 32 Z M82 26 L88 14 L78 18 Z" fill="#f08a96" {...stroke} strokeWidth={1.8} />
      {/* 目 */}
      <g className="eyes">
        <ellipse cx="47" cy="54" rx="4.2" ry="5.4" fill={LINE} />
        <ellipse cx="73" cy="54" rx="4.2" ry="5.4" fill={LINE} />
        <circle cx="48.5" cy="52" r="1.6" fill="#fff" />
        <circle cx="74.5" cy="52" r="1.6" fill="#fff" />
      </g>
      <path d="M41 49 Q46 45 52 48 M68 48 Q74 45 79 49" fill="none" {...stroke} strokeWidth={1.8} />
      <path d="M41 44 Q46 41 52 43 M68 43 Q74 41 79 44" fill="none" stroke="#8a5a44" strokeWidth="1.8" strokeLinecap="round" />
      {/* ほほ・口 */}
      <ellipse cx="40" cy="64" rx="5.5" ry="3.2" fill="#f7a8a8" opacity=".75" />
      <ellipse cx="80" cy="64" rx="5.5" ry="3.2" fill="#f7a8a8" opacity=".75" />
      <path className="mouth" d="M51 67 Q60 78 69 67 Z" fill="#e2636f" {...stroke} strokeWidth={1.8} />
    </>
  );
}

function Brother() {
  return (
    <>
      <circle cx="60" cy="60" r="58" fill="#dde8fb" />
      {/* 服 */}
      <path d="M14 120 Q16 92 44 86 L76 86 Q104 92 106 120 Z" fill="#2f4f8f" {...stroke} />
      <path d="M46 86 L60 106 L74 86 Z" fill="#fff" {...stroke} />
      <path d="M46 86 L38 100 L54 104 L60 106 M74 86 L82 100 L66 104 L60 106" fill="#2f4f8f" {...stroke} />
      <rect x="52" y="74" width="16" height="14" fill={SKIN} {...stroke} />
      {/* 顔 */}
      <circle cx="32" cy="56" r="5.5" fill={SKIN} {...stroke} />
      <circle cx="88" cy="56" r="5.5" fill={SKIN} {...stroke} />
      <path d="M33 52 Q33 24 60 24 Q87 24 87 52 Q87 70 74 79 Q60 86 46 79 Q33 70 33 52 Z" fill={SKIN} {...stroke} />
      {/* 髪 */}
      <path d="M31 54 Q26 18 58 16 L64 10 L68 17 Q96 20 89 54 Q86 40 76 34 L70 40 L62 32 L52 40 L44 34 Q34 40 31 54 Z" fill="#2c2a33" {...stroke} />
      {/* 眉・目 */}
      <path d="M40 45 L53 47 M80 45 L67 47" {...stroke} strokeWidth={2.8} />
      <g className="eyes">
        <ellipse cx="47" cy="54" rx="3.2" ry="3.8" fill={LINE} />
        <ellipse cx="73" cy="54" rx="3.2" ry="3.8" fill={LINE} />
      </g>
      {/* 眼鏡 */}
      <rect x="37" y="47" width="20" height="14" rx="3" fill="rgba(255,255,255,.35)" {...stroke} strokeWidth={2} />
      <rect x="63" y="47" width="20" height="14" rx="3" fill="rgba(255,255,255,.35)" {...stroke} strokeWidth={2} />
      <path d="M57 53 H63" {...stroke} strokeWidth={2} />
      <path d="M60 58 Q58 64 61 65" fill="none" {...stroke} strokeWidth={1.8} />
      <path className="mouth" d="M52 71 Q62 76 70 68" fill="none" {...stroke} />
    </>
  );
}

export default function Avatar({ persona, size = 56, talking = false }: Props) {
  return (
    <svg
      className={`avatar${talking ? " talking" : ""}`}
      viewBox="0 0 120 120"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <defs>
        <clipPath id={`clip-${persona}`}>
          <circle cx="60" cy="60" r="58" />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${persona})`}>
        {persona === "grandpa" && <Grandpa />}
        {persona === "sister" && <Sister />}
        {persona === "brother" && <Brother />}
      </g>
    </svg>
  );
}
