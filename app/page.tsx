"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import { type Mode, opener, PERSONA_IDS, PERSONAS, type PersonaId } from "@/lib/personas";

type Message = { role: "user" | "assistant"; content: string; error?: boolean };
// 会話は「モード × 相談相手」ごとに別々に持つ
type Histories = Record<string, Message[]>;

const MAX_LENGTH = 2000;
const NONE: Message[] = [];

// 音声入力（Web Speech API）は型定義が標準に入っていないので、使う部分だけ宣言する
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
};

function createRecognition(): Recognition | null {
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as (new () => Recognition) | undefined;
  return Ctor ? new Ctor() : null;
}

export default function Page() {
  const [persona, setPersona] = useState<PersonaId>("grandpa");
  const [mode, setMode] = useState<Mode>("consult");
  const [histories, setHistories] = useState<Histories>({});
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [canListen, setCanListen] = useState(false);
  const [notice, setNotice] = useState("");
  const recognition = useRef<Recognition | null>(null);
  const baseText = useRef("");
  // 「別の話題にする」を押した回数（相談相手ごと）
  const skips = useRef<Partial<Record<PersonaId, number>>>({});
  const bottom = useRef<HTMLDivElement>(null);

  const current = PERSONAS[persona];
  const key = `${mode}:${persona}`;
  const messages = histories[key] ?? NONE;

  useEffect(() => {
    setCanListen(createRecognition() !== null);
  }, []);

  // 話しかけモードでは、まだ会話のない相手が最初の一言をかける
  useEffect(() => {
    if (mode !== "talk") return;
    setHistories((h) =>
      h[key]?.length
        ? h
        : { ...h, [key]: [{ role: "assistant", content: opener(PERSONAS[persona], new Date(), skips.current[persona] ?? 0) }] },
    );
  }, [mode, persona, key]);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [histories, key]);

  function patchLast(id: string, patch: (message: Message) => Message) {
    setHistories((h) => ({ ...h, [id]: h[id].map((m, i) => (i === h[id].length - 1 ? patch(m) : m)) }));
  }

  async function send(text: string) {
    const content = text.trim();
    if (content === "" || busy) return;
    stopListening();

    const id = key;
    // 失敗して終わった返事は、次に送る会話には含めない
    const history = [...messages.filter((m) => !m.error), { role: "user" as const, content }];
    setHistories((h) => ({ ...h, [id]: [...history, { role: "assistant", content: "" }] }));
    setInput("");
    setNotice("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona, mode, messages: history }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        // 送れなかった発言は入力欄に戻して、打ち直さずに済むようにする
        setHistories((h) => ({ ...h, [id]: h[id].slice(0, -2) }));
        setInput(content);
        setNotice(data.error ?? "うまく送れませんでした。もう一度お試しください。");
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        patchLast(id, (m) => ({ ...m, content: m.content + chunk }));
      }
    } catch {
      patchLast(id, (m) => ({
        ...m,
        error: true,
        content: m.content === "" ? "通信が途切れてしまいました。もう一度送ってみてください。" : `${m.content}\n\n（通信が途切れました）`,
      }));
    } finally {
      setBusy(false);
    }
  }

  function stopListening() {
    recognition.current?.stop();
  }

  function toggleListening() {
    if (listening) {
      stopListening();
      return;
    }
    const r = createRecognition();
    if (!r) return;
    r.lang = "ja-JP";
    r.interimResults = true;
    r.continuous = true;
    baseText.current = input;
    r.onresult = (event) => {
      let spoken = "";
      for (let i = 0; i < event.results.length; i++) spoken += event.results[i][0].transcript;
      setInput((baseText.current + spoken).slice(0, MAX_LENGTH));
    };
    r.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setNotice("マイクを使えませんでした。ブラウザでマイクの使用を許可してください。");
      }
    };
    r.onend = () => {
      setListening(false);
      recognition.current = null;
    };
    recognition.current = r;
    setNotice("");
    setListening(true);
    r.start();
  }

  function resetChat() {
    if (busy || messages.length === 0) return;
    // 話しかけられただけでまだ返事をしていないなら、確認なしで話題を替える
    const untouched = mode === "talk" && messages.length === 1;
    if (!untouched && !window.confirm(`${current.name}との会話を消して、最初からやり直しますか？`)) return;
    if (mode !== "talk") {
      setHistories((h) => ({ ...h, [key]: [] }));
      return;
    }
    // その日の話題から、次の話題へ一つ進める
    skips.current[persona] = (skips.current[persona] ?? 0) + 1;
    const next = opener(current, new Date(), skips.current[persona]);
    setHistories((h) => ({ ...h, [key]: [{ role: "assistant", content: next }] }));
  }

  return (
    <div className="app" data-persona={persona}>
      <header className="top">
        <div className="top-row">
          <h1>ことのは相談室</h1>
          <button type="button" className="link" onClick={resetChat} disabled={busy || messages.length === 0}>
            {mode === "talk" ? "別の話題にする" : "会話をやり直す"}
          </button>
        </div>
        <div className="modes" role="group" aria-label="モードを選ぶ">
          <button type="button" aria-pressed={mode === "consult"} disabled={busy} onClick={() => setMode("consult")}>
            自分から相談する
          </button>
          <button type="button" aria-pressed={mode === "talk"} disabled={busy} onClick={() => setMode("talk")}>
            話しかけてもらう
          </button>
        </div>
        <div className="personas" role="tablist" aria-label="相談相手を選ぶ">
          {PERSONA_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              className="persona"
              data-persona={id}
              aria-selected={id === persona}
              disabled={busy}
              onClick={() => setPersona(id)}
            >
              <Avatar persona={id} size={88} />
              <span className="persona-text">
                <strong>{PERSONAS[id].name}</strong>
                <small>{PERSONAS[id].role}</small>
              </span>
            </button>
          ))}
        </div>
      </header>

      <main className="chat" aria-live="polite">
        <p className="intro">{mode === "talk" ? `${current.name}のほうから話しかけます` : current.tagline}</p>

        {mode === "consult" && (
          <div className="row assistant">
            <Avatar persona={persona} size={56} />
            <div className="bubble">{current.greeting}</div>
          </div>
        )}

        {messages.map((message, i) => {
          const last = i === messages.length - 1;
          const waiting = busy && last && message.role === "assistant" && message.content === "";
          return message.role === "user" ? (
            <div className="row user" key={i}>
              <div className="bubble">{message.content}</div>
            </div>
          ) : (
            <div className="row assistant" key={i}>
              <Avatar persona={persona} size={56} talking={busy && last} />
              <div className={`bubble${message.error ? " failed" : ""}`}>
                {waiting ? (
                  <span className="dots" role="status" aria-label="返事を考えています">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  message.content
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </main>

      <footer className="bottom">
        {notice && (
          <p className="notice" role="alert">
            {notice}
          </p>
        )}
        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          {canListen && (
            <button
              type="button"
              className="mic"
              aria-pressed={listening}
              aria-label={listening ? "音声入力を止める" : "音声で入力する"}
              title={listening ? "音声入力を止める" : "音声で入力する"}
              disabled={busy}
              onClick={toggleListening}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
                <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
          <textarea
            value={input}
            rows={2}
            maxLength={MAX_LENGTH}
            placeholder={
              listening
                ? "聞いています… 話し終えたらマイクを押してください"
                : mode === "talk"
                  ? `${current.name}に返事をする…`
                  : current.placeholder
            }
            aria-label="相談内容"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // 変換中の Enter では送信しない
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <button type="submit" className="btn send" disabled={busy || input.trim() === ""}>
            送る
          </button>
        </form>
        <p className="fine">
          相談相手はAIです。医療・法律などの専門的な判断の代わりにはなりません。つらくて危険を感じるときは、よりそいホットライン（0120-279-338）や身近な人に相談してください。
        </p>
      </footer>
    </div>
  );
}
