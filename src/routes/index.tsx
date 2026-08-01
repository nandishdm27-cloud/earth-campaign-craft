import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, Leaf, Loader2, Sparkles, Wind } from "lucide-react";
import { AudioCard } from "@/components/AudioCard";
import { StepCard } from "@/components/StepCard";
import { INDIAN_STATES, LANGUAGES, SPEAKERS, type Language, type Speaker } from "@/lib/india";
import {
  CampaignError,
  generateCampaign,
  releaseCampaign,
  type CampaignResult,
} from "@/lib/campaign";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClimateAction Local — Localized Climate Campaigns for India" },
      {
        name: "description",
        content:
          "Generate voice-and-poster climate campaigns tailored to any Indian state, in Hindi or English, with a male or female narrator.",
      },
      { property: "og:title", content: "ClimateAction Local" },
      {
        property: "og:description",
        content:
          "State-specific climate campaigns with narrated audio and campaign posters, in Hindi or English.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const LOADING_MESSAGES = [
  "Reading regional climate signals…",
  "Drafting a campaign script in your language…",
  "Handing the script to your narrator…",
  "Rendering the campaign poster…",
  "Mixing the final audio…",
];

type Phase = "form" | "loading" | "error" | "results";

function Index() {
  const [state, setState] = useState("");
  const [language, setLanguage] = useState<Language | "">("");
  const [speaker, setSpeaker] = useState<Speaker | "">("");
  const [phase, setPhase] = useState<Phase>("form");
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [error, setError] = useState<{ message: string; isN8n: boolean } | null>(null);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [activeAudio, setActiveAudio] = useState<number | null>(null);
  const [imageBroken, setImageBroken] = useState(false);
  const resultRef = useRef<CampaignResult | null>(null);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  useEffect(() => () => releaseCampaign(resultRef.current), []);

  useEffect(() => {
    if (phase !== "loading") return;
    const id = window.setInterval(
      () => setLoadingIndex((i) => (i + 1) % LOADING_MESSAGES.length),
      2200,
    );
    return () => window.clearInterval(id);
  }, [phase]);

  const ready = state !== "" && language !== "" && speaker !== "";

  const submit = async () => {
    if (!ready) return;
    releaseCampaign(result);
    setResult(null);
    setError(null);
    setImageBroken(false);
    setActiveAudio(null);
    setLoadingIndex(0);
    setPhase("loading");
    try {
      const next = await generateCampaign({ state, language, speaker });
      setResult(next);
      setPhase("results");
    } catch (err) {
      const isN8n = err instanceof CampaignError && err.kind === "n8n-404";
      setError({
        message:
          err instanceof Error
            ? err.message
            : "Something went wrong while generating your campaign.",
        isN8n,
      });
      setPhase("error");
    }
  };

  const backToForm = () => {
    releaseCampaign(result);
    setResult(null);
    setActiveAudio(null);
    setImageBroken(false);
    setPhase("form");
  };

  const hasSomething = !!result && (result.audios.length > 0 || !!result.imageUrl);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-16">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-surface/60 px-3 py-1 text-xs font-medium tracking-wide text-primary uppercase">
          <Leaf className="size-3.5" aria-hidden="true" />
          Local voices, global stakes
        </span>
        <h1 className="mt-5 text-4xl leading-[1.05] font-semibold sm:text-6xl">
          Climate<span className="text-gradient-leaf">Action</span> Local
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground sm:text-base">
          Pick a state, a language and a narrator. We generate a ready-to-share climate campaign —
          narrated audio and a campaign poster — grounded in that region's realities.
        </p>
      </header>

      {phase === "form" && (
        <div className="glass-panel flex flex-col gap-4 rounded-3xl p-4 sm:p-6">
          <StepCard step={1} title="State" hint="Where should this campaign speak?" active done={state !== ""}>
            <label className="sr-only" htmlFor="state-select">
              Select an Indian state
            </label>
            <select
              id="state-select"
              value={state}
              onChange={(e) => {
                setState(e.target.value);
                setLanguage("");
                setSpeaker("");
              }}
              className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/50"
            >
              <option value="">Choose a state…</option>
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </StepCard>

          <StepCard
            step={2}
            title="Language"
            hint="Hindi or English"
            active={state !== ""}
            done={language !== ""}
          >
            <div role="radiogroup" aria-label="Language" className="grid grid-cols-2 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  role="radio"
                  aria-checked={language === lang}
                  disabled={state === ""}
                  onClick={() => {
                    setLanguage(lang);
                    setSpeaker("");
                  }}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    language === lang
                      ? "glow-ring border-primary bg-primary/15 text-primary"
                      : "border-border bg-background/40 text-foreground hover:border-primary/50"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </StepCard>

          {language !== "" && (
            <StepCard step={3} title="Speaker" hint="Choose the narrator's voice" active done={speaker !== ""}>
              <div role="radiogroup" aria-label="Speaker" className="grid grid-cols-2 gap-3">
                {SPEAKERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={speaker === s}
                    onClick={() => setSpeaker(s)}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                      speaker === s
                        ? "glow-ring border-primary bg-primary/15 text-primary"
                        : "border-border bg-background/40 text-foreground hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </StepCard>
          )}

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
            <Wind className="size-4 text-primary" aria-hidden="true" />
            <span>{state || "No state"}</span>
            <span aria-hidden="true">·</span>
            <span>{language || "No language"}</span>
            <span aria-hidden="true">·</span>
            <span>{speaker || "No speaker"}</span>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={!ready}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Generate campaign
          </button>
        </div>
      )}

      {phase === "loading" && (
        <div className="glass-panel flex flex-col items-center gap-4 rounded-3xl px-6 py-16 text-center">
          <Loader2 className="size-9 animate-spin text-primary" aria-hidden="true" />
          <p aria-live="polite" className="text-sm text-foreground">
            {LOADING_MESSAGES[loadingIndex]}
          </p>
          <p className="text-xs text-muted-foreground">
            {state} · {language} · {speaker}
          </p>
        </div>
      )}

      {phase === "error" && error && (
        <div className="glass-panel flex flex-col items-center gap-4 rounded-3xl px-6 py-12 text-center">
          <AlertTriangle className="size-8 text-ember" aria-hidden="true" />
          <h2 className="text-xl font-semibold">We couldn't build that campaign</h2>
          <p className="max-w-lg text-sm text-muted-foreground">{error.message}</p>
          {error.isN8n && (
            <ul className="max-w-lg list-disc space-y-1 text-left text-xs text-muted-foreground">
              <li>Test webhook: the workflow must be listening for a request right now.</li>
              <li>Live webhook: the workflow must be activated in n8n.</li>
            </ul>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={submit}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
            >
              Retry
            </button>
            <button
              type="button"
              onClick={backToForm}
              className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium hover:border-primary/50"
            >
              Change selections
            </button>
          </div>
        </div>
      )}

      {phase === "results" && result && (
        <div className="flex flex-col gap-5">
          <section className="glass-panel rounded-3xl p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold text-gradient-leaf">Campaign ready</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {state} · {language} · {speaker} narrator
                </p>
              </div>
              <button
                type="button"
                onClick={backToForm}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:border-primary/50"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                New campaign
              </button>
            </div>

            {result.imageUrl && !imageBroken && (
              <figure className="mt-5">
                <img
                  src={result.imageUrl}
                  alt={`Climate campaign poster for ${state}`}
                  onError={() => setImageBroken(true)}
                  className="w-full rounded-2xl border border-border object-cover"
                />
              </figure>
            )}
            {result.imageUrl && imageBroken && (
              <p className="mt-5 rounded-2xl border border-dashed border-border px-4 py-6 text-center text-xs text-muted-foreground">
                The campaign poster couldn't be loaded, but the rest of the campaign is ready below.
              </p>
            )}

            {result.message && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{result.message}</p>
            )}
          </section>

          {result.audios.length > 0 && (
            <div className="flex flex-col gap-3">
              {result.audios.map((item, i) => (
                <AudioCard
                  key={`${item.src.slice(0, 48)}-${i}`}
                  item={item}
                  index={i}
                  label={
                    result.audios.length > 1
                      ? `Campaign audio ${i + 1} — ${language}, ${speaker}`
                      : `Campaign audio — ${language}, ${speaker}`
                  }
                  activeId={activeAudio}
                  onPlay={setActiveAudio}
                />
              ))}
            </div>
          )}

          {!hasSomething && (
            <div className="glass-panel rounded-3xl px-6 py-10 text-center">
              <p className="text-sm text-foreground">
                The campaign service replied, but didn't include any audio or image we could show.
              </p>
              <button
                type="button"
                onClick={submit}
                className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}

      <footer className="mt-auto pt-6 text-center text-xs text-muted-foreground">
        Built for local climate organisers across India.
      </footer>
    </main>
  );
}
