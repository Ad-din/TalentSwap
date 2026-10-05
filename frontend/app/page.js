import Link from 'next/link';

export default function LandingPage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-display text-5xl md:text-6xl leading-[1.05] tracking-tight">
              What you can teach.
              <br />
              What you want to learn.
            </h1>
            <p className="mt-6 text-lg text-ink/70 max-w-prose">
              TalentSwap pairs people around a simple exchange: you teach someone what you know,
              they teach you what you want to know. No tuition, no one-way favors — just two
              people trading skills.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/auth/signup"
                className="bg-teach text-paper px-6 py-3 rounded-full font-medium hover:bg-teach-dark transition-colors"
              >
                Find your first swap
              </Link>
              <Link href="#how-it-works" className="text-ink/70 hover:text-ink underline underline-offset-4">
                See how it works
              </Link>
            </div>
          </div>

          <ExchangeCardDemo />
        </div>
      </section>

      <section id="how-it-works" className="border-t border-line bg-white/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl mb-12">Three steps to your first swap</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <Step
              accent="teach"
              title="List what you teach and want to learn"
              body="Pick from a real skill taxonomy — React relates to Next.js, UI/UX relates to Figma — so matching understands what you mean, not just what you typed."
            />
            <Step
              accent="learn"
              title="Get explainable matches"
              body="Every match shows its score broken down: skill fit, availability overlap, distance, experience, and reputation — never a black box."
            />
            <Step
              accent="teach"
              title="Schedule, meet, and earn credits"
              body="Teach an hour, earn Skill Credits. Spend them to learn from someone else. The exchange keeps itself balanced."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="border border-line rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between gap-6 bg-white/60">
          <div>
            <h2 className="font-display text-2xl">Ready to trade skills?</h2>
            <p className="text-ink/60 mt-1">Free to join. Your first 50 Skill Credits are on us.</p>
          </div>
          <Link
            href="/auth/signup"
            className="bg-ink text-paper px-6 py-3 rounded-full font-medium hover:bg-teach transition-colors whitespace-nowrap"
          >
            Join TalentSwap
          </Link>
        </div>
      </section>
    </div>
  );
}

function Step({ accent, title, body }) {
  const dot = accent === 'teach' ? 'bg-teach' : 'bg-learn';
  return (
    <div>
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot} mb-4`} />
      <h3 className="font-medium text-lg mb-2">{title}</h3>
      <p className="text-ink/60 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

/**
 * The literal "teach <-> learn" motif from the brief, rendered as two
 * connected skill cards. This is the one bold visual element on the page.
 */
function ExchangeCardDemo() {
  return (
    <div className="relative">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="bg-teach-tint border border-teach/20 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-teach-dark/70 mb-1">Amara teaches</p>
          <p className="font-display text-xl text-teach-dark">UI/UX Design</p>
        </div>

        <div className="flex flex-col items-center text-ink/40">
          <span className="text-2xl leading-none">⇄</span>
        </div>

        <div className="bg-learn-tint border border-learn/20 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-learn-dark/70 mb-1">Amara wants</p>
          <p className="font-display text-xl text-learn-dark">Python</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 mt-4">
        <div className="bg-learn-tint border border-learn/20 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-learn-dark/70 mb-1">Rian wants</p>
          <p className="font-display text-xl text-learn-dark">UI/UX Design</p>
        </div>

        <div className="flex flex-col items-center text-ink/40">
          <span className="text-2xl leading-none">⇄</span>
        </div>

        <div className="bg-teach-tint border border-teach/20 rounded-2xl p-5">
          <p className="text-xs uppercase tracking-wide text-teach-dark/70 mb-1">Rian teaches</p>
          <p className="font-display text-xl text-teach-dark">Python</p>
        </div>
      </div>

      <p className="text-center text-sm text-ink/50 mt-5">A mutual match — a two-way exchange, ranked highest.</p>
    </div>
  );
}
