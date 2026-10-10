import Anthropic from "@anthropic-ai/sdk";
import { type Mode, PERSONA_IDS, type PersonaId } from "@/lib/personas";
import { systemPrompt, TALK_START } from "@/lib/prompts";

export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 2000;
// 長い会話は直近だけを送り、1回あたりの費用が膨らまないようにする
const MAX_HISTORY = 30;

type ChatMessage = { role: "user" | "assistant"; content: string };

function json(body: unknown, status: number) {
  return Response.json(body, { status });
}

function parseMessages(value: unknown, mode: Mode): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > 200) return null;
  const messages: ChatMessage[] = [];
  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;
    const { role, content } = item as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || content.trim() === "" || content.length > MAX_MESSAGE_LENGTH) return null;
    messages.push({ role, content });
  }
  if (messages[messages.length - 1].role !== "user") return null;
  const recent = messages.slice(-MAX_HISTORY);
  // API に送る会話は相談者の発言から始める必要がある。相談相手から話しかけた会話は、
  // 先頭に目印の発言を置いて、最初の話しかけを会話の流れとして残す
  if (mode === "talk" && recent[0].role === "assistant") {
    recent.unshift({ role: "user", content: TALK_START });
  }
  while (recent[0].role !== "user") recent.shift();
  return recent;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: "相談機能はまだ設定されていません（ANTHROPIC_API_KEY が未設定です）。" }, 503);
  }

  let body: { persona?: unknown; mode?: unknown; messages?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "リクエストの形式が正しくありません。" }, 400);
  }
  const persona = body.persona as PersonaId;
  if (!PERSONA_IDS.includes(persona)) {
    return json({ error: "相談相手が選ばれていません。" }, 400);
  }
  const mode: Mode = body.mode === "talk" ? "talk" : "consult";
  const messages = parseMessages(body.messages, mode);
  if (!messages) {
    return json({ error: `メッセージを読み取れませんでした（1通は${MAX_MESSAGE_LENGTH}文字までです）。` }, 400);
  }

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    system: systemPrompt(persona, mode),
    messages,
    output_config: { effort: "low" },
  });

  const encoder = new TextEncoder();
  const iterator = stream[Symbol.asyncIterator]();

  // 最初のイベントを待ってから応答を返す。認証エラーなどはここで分かるので、適切なステータスで返せる
  let first: IteratorResult<Anthropic.MessageStreamEvent>;
  try {
    first = await iterator.next();
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return json({ error: "APIキーが正しくありません。設定を確認してください。" }, 500);
    }
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: "ただいま混み合っています。少し待ってからお試しください。" }, 429);
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return json({ error: "接続できませんでした。もう一度お試しください。" }, 502);
    }
    if (error instanceof Anthropic.APIError) {
      console.error("chat failed", error.status, error.message);
      return json({ error: "うまく返事ができませんでした。もう一度お試しください。" }, 502);
    }
    throw error;
  }

  const text = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sent = false;
      try {
        for (let result = first; !result.done; result = await iterator.next()) {
          const event = result.value;
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
            sent = true;
          }
        }
        const message = await stream.finalMessage();
        if (!sent || message.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode(
              `${sent ? "\n\n" : ""}ごめんなさい、この内容にはうまくお答えできません。別の言い方で話してもらえますか。`,
            ),
          );
        }
        controller.close();
      } catch (error) {
        console.error("chat stream failed", error);
        controller.error(error);
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
