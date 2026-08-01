export type AudioItem = {
  /** Ready-to-use src for an <audio> element. */
  src: string;
  mimeType: string;
  /** true when src is an object URL that must be revoked on cleanup. */
  isObjectUrl: boolean;
};

export type CampaignResult = {
  audios: AudioItem[];
  /** Exact URL string as returned by the webhook — never transformed. */
  imageUrl?: string;
  message?: string;
  raw?: unknown;
};

export type CampaignRequest = {
  state: string;
  language: string;
  speaker: string;
};

const DEFAULT_MIME = "audio/mpeg";
const DEFAULT_WEBHOOK_URL =
  "https://n8n.local.test/webhook/climate-action-local";

export function getWebhookUrl(): string {
  const fromEnv = import.meta.env["VITE_N8N_WEBHOOK_URL"] as string | undefined;
  return fromEnv && fromEnv.trim() ? fromEnv.trim() : DEFAULT_WEBHOOK_URL;
}

export class CampaignError extends Error {
  kind: "network" | "http" | "n8n-404" | "parse";
  constructor(message: string, kind: CampaignError["kind"]) {
    super(message);
    this.name = "CampaignError";
    this.kind = kind;
  }
}

const AUDIO_KEYS = [
  "audio_base64",
  "audiobase64",
  "audio",
  "audio_content",
  "audiocontent",
  "base64",
  "data",
];
const AUDIO_URL_KEYS = ["audio_url", "audiourl", "audio_link", "url", "mp3_url"];
const MIME_KEYS = ["audio_myme_type", "audio_mime_type", "mime_type", "mimetype", "content_type"];
const IMAGE_KEYS = ["image_url", "imageurl", "image", "poster_url", "img_url"];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const looksLikeUrl = (v: string) => /^(https?:)?\/\//i.test(v.trim());
const looksLikeDataUri = (v: string) => /^data:/i.test(v.trim());
const looksLikeBase64 = (v: string) =>
  v.length > 256 && /^[A-Za-z0-9+/\s=]+$/.test(v.slice(0, 512));

export function buildAudioSrc(value: string, mimeType?: string): AudioItem {
  const trimmed = value.trim();
  if (looksLikeDataUri(trimmed)) {
    const detected = /^data:([^;,]+)/i.exec(trimmed)?.[1];
    return { src: trimmed, mimeType: detected || mimeType || DEFAULT_MIME, isObjectUrl: false };
  }
  if (looksLikeUrl(trimmed)) {
    // Direct audio URL — pass through untouched.
    return { src: value, mimeType: mimeType || DEFAULT_MIME, isObjectUrl: false };
  }
  const mime = mimeType || DEFAULT_MIME;
  return {
    src: `data:${mime};base64,${trimmed.replace(/\s+/g, "")}`,
    mimeType: mime,
    isObjectUrl: false,
  };
}

/** Recursively walk any JSON shape collecting audio + image fields. */
function walk(
  node: unknown,
  acc: { audios: AudioItem[]; imageUrl?: string; message?: string },
  depth = 0,
): void {
  if (depth > 8 || node == null) return;

  if (Array.isArray(node)) {
    for (const item of node) walk(item, acc, depth + 1);
    return;
  }

  if (!isRecord(node)) return;

  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) lower[k.toLowerCase()] = v;

  let mime: string | undefined;
  for (const key of MIME_KEYS) {
    const v = lower[key];
    if (typeof v === "string" && v.trim()) {
      mime = v.trim();
      break;
    }
  }

  if (!acc.imageUrl) {
    for (const key of IMAGE_KEYS) {
      const v = lower[key];
      // Assign the exact string as received: no encoding, decoding or rewriting.
      if (typeof v === "string" && v.trim()) {
        acc.imageUrl = v;
        break;
      }
    }
  }

  for (const key of AUDIO_KEYS) {
    const v = lower[key];
    if (typeof v === "string" && (looksLikeDataUri(v) || looksLikeBase64(v))) {
      acc.audios.push(buildAudioSrc(v, mime));
      break;
    }
  }

  for (const key of AUDIO_URL_KEYS) {
    const v = lower[key];
    if (typeof v === "string" && looksLikeUrl(v) && /\.(mp3|wav|ogg|m4a|aac|webm)(\?|$)/i.test(v)) {
      acc.audios.push(buildAudioSrc(v, mime));
      break;
    }
  }

  for (const key of ["message", "text", "script", "caption"]) {
    const v = lower[key];
    if (!acc.message && typeof v === "string" && v.trim() && v.length < 2000) {
      acc.message = v.trim();
    }
  }

  for (const value of Object.values(node)) {
    if (typeof value === "object") walk(value, acc, depth + 1);
  }
}

export function extractFromJson(payload: unknown): CampaignResult {
  const acc: { audios: AudioItem[]; imageUrl?: string; message?: string } = { audios: [] };
  walk(payload, acc);
  // Dedupe identical audio sources.
  const seen = new Set<string>();
  const audios = acc.audios.filter((a) => {
    if (seen.has(a.src)) return false;
    seen.add(a.src);
    return true;
  });
  return { audios, imageUrl: acc.imageUrl, message: acc.message, raw: payload };
}

export async function generateCampaign(
  request: CampaignRequest,
  signal?: AbortSignal,
): Promise<CampaignResult> {
  let response: Response;
  try {
    response = await fetch(getWebhookUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal,
    });
  } catch {
    throw new CampaignError(
      "Could not reach the campaign service. Check your connection and the webhook URL, then try again.",
      "network",
    );
  }

  if (response.status === 404) {
    throw new CampaignError(
      "The n8n webhook returned 404. If you are using the test webhook URL, open the workflow in n8n and click “Execute workflow” so it is listening for a request. If you are using the production URL, make sure the workflow is activated.",
      "n8n-404",
    );
  }

  if (!response.ok) {
    throw new CampaignError(
      `The campaign service responded with ${response.status} ${response.statusText || ""}`.trim(),
      "http",
    );
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();

  // Binary audio / octet-stream response.
  if (contentType.startsWith("audio/") || contentType.includes("octet-stream")) {
    const blob = await response.blob();
    if (!blob.size) return { audios: [] };
    const mimeType = contentType.startsWith("audio/") ? contentType.split(";")[0] : DEFAULT_MIME;
    const typed = blob.type ? blob : new Blob([blob], { type: mimeType });
    return {
      audios: [{ src: URL.createObjectURL(typed), mimeType, isObjectUrl: true }],
    };
  }

  if (contentType.startsWith("image/")) {
    const blob = await response.blob();
    return { audios: [], imageUrl: URL.createObjectURL(blob) };
  }

  const text = await response.text();
  if (!text.trim()) return { audios: [] };

  try {
    return extractFromJson(JSON.parse(text));
  } catch {
    // Plain text: data URI, direct URL or raw base64.
    const trimmed = text.trim();
    if (looksLikeDataUri(trimmed)) {
      if (/^data:image\//i.test(trimmed)) return { audios: [], imageUrl: trimmed };
      return { audios: [buildAudioSrc(trimmed)] };
    }
    if (looksLikeUrl(trimmed) && !/\s/.test(trimmed)) {
      if (/\.(png|jpe?g|webp|gif|svg)(\?|$)/i.test(trimmed)) {
        return { audios: [], imageUrl: trimmed };
      }
      return { audios: [buildAudioSrc(trimmed)] };
    }
    if (looksLikeBase64(trimmed)) return { audios: [buildAudioSrc(trimmed)] };
    return { audios: [], message: trimmed.slice(0, 500) };
  }
}

export function releaseCampaign(result: CampaignResult | null) {
  if (!result) return;
  for (const audio of result.audios) {
    if (audio.isObjectUrl) URL.revokeObjectURL(audio.src);
  }
  if (result.imageUrl?.startsWith("blob:")) URL.revokeObjectURL(result.imageUrl);
}