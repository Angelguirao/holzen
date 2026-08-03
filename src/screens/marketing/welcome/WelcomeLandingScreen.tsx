import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";
import { Info, CheckCircle, Activity, Clock, TrendingUp, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { PageMeta } from "@/app/components/PageMeta";
import svgPaths from "./welcome-svg-paths";
import iphoneImg from "./assets/how-it-works-phone.png";
import { pingLandingView, submitWaitlistEmail, waitlistConfigured } from "./waitlist-api";

function Logo() {
  return (
    <div className="flex gap-[5px] items-center justify-center">
      <svg height="16" viewBox="0 0 11.9231 18.8837" fill="none"><path d={svgPaths.p7c2a780} fill="#DBB366" /></svg>
      <svg height="16" viewBox="0 0 13.3008 19.3506" fill="none"><path d={svgPaths.p3f6bb3f2} fill="#DBB366" /></svg>
      <svg height="16" viewBox="0 0 11.3603 18.8761" fill="none"><path d={svgPaths.p330b3f40} fill="#DBB366" /></svg>
      <svg height="16" viewBox="0 0 13.6468 18.9003" fill="none"><path d={svgPaths.ped50bf2} fill="#DBB366" /></svg>
      <svg height="16" viewBox="0 0 11.6999 18.8884" fill="none"><path d={svgPaths.p29795572} fill="#DBB366" /></svg>
      <svg height="16" viewBox="0 0 11.9966 18.8831" fill="none"><path d={svgPaths.p3e6ced00} fill="#DBB366" /></svg>
    </div>
  );
}

// Timings (seconds)
const T = {
  card: 0,
  volatility: 0.55,
  btc: 0.85,
  circleAppear: 1.1,
  circleDraw: 1.35,   // stroke starts drawing
  circleDrawDur: 1.6,
  breatheText: 3.1,
  slowDown: 3.5,
  breathingLoop: 4.0, // continuous loop starts
};

function PhoneShowcase({ gradientId = "breatheGradFill", borderColor = "rgba(255,255,255,0.08)" }: { gradientId?: string; borderColor?: string }) {
  const canHover = useCanHover();
  const r = 68;
  const circumference = 2 * Math.PI * r;

  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Strip position: starts off-screen right (115). On enter, spring sweeps to mouse X.
  // On mouse move, spring follows → same diagonal form, just repositioned.
  const rawX = useMotionValue(115);
  const springX = useSpring(rawX, { stiffness: 110, damping: 22 });
  const stripLeft = useTransform(springX, v => `${v - 26}%`);

  const getMouseXPct = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return 50;
    const rect = cardRef.current.getBoundingClientRect();
    return ((e.clientX - rect.left) / rect.width) * 100;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    rawX.set(getMouseXPct(e)); // spring animates from 115 → mouse X (the sweep)
    setHovered(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    rawX.set(getMouseXPct(e)); // spring follows subtly
  };

  return (
    <motion.div
      ref={cardRef}
      className="rounded-2xl flex flex-col gap-5 p-6 w-full relative overflow-hidden cursor-default"
      style={{
        background: "rgba(10, 17, 30, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${borderColor}`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, borderColor: hovered ? "rgba(219,179,102,0.2)" : borderColor }}
      transition={{ duration: 0.8, ease: "easeOut", delay: T.card, borderColor: { duration: 0.35 } }}
      onMouseEnter={canHover ? handleMouseEnter : undefined}
      onMouseMove={canHover ? handleMouseMove : undefined}
      onMouseLeave={canHover ? () => { setHovered(false); rawX.set(115); } : undefined}
    >
      {/* Diagonal strip — spring sweeps in on enter, then follows mouse movement */}
      <motion.div
        className="absolute inset-y-0 w-[52%] pointer-events-none"
        style={{
          left: stripLeft,
          background: "linear-gradient(90deg, transparent, rgba(219,179,102,0.09) 50%, transparent)",
          skewX: "-14deg",
          transformOrigin: "center",
        }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ opacity: { duration: hovered ? 0.08 : 0.25 } }}
      />

      {/* Top-edge glow */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(219,179,102,0.38), transparent)" }}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
      {/* Volatility + BTC grouped tightly */}
      <div className="flex flex-col gap-2">
        <motion.div
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: T.volatility }}
        >
          <p className="font-['Inter',sans-serif] font-medium text-[#a66678] text-base">Volatility alert</p>
          <div className="flex items-center gap-2 border border-[rgba(240,243,247,0.12)] rounded-full px-3 py-1">
            <motion.div
              className="size-2.5 rounded-full bg-[#49A47C]"
              animate={{ opacity: [1, 0.4, 1], scale: [1, 1.45, 1] }}
              transition={{ duration: 3.5, times: [0, 0.15, 0.3], ease: "easeInOut", repeat: Infinity, delay: T.breathingLoop }}
            />
            <span className="font-['Inter',sans-serif] font-medium text-white text-xs">LIVE</span>
          </div>
        </motion.div>

        {/* BTC row */}
        <motion.div
          className="flex items-center gap-2.5"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: T.btc }}
      >
        <svg className="size-5 shrink-0" fill="none" viewBox="0 0 15.421 23.4814">
          <path d={svgPaths.p36ed1380} stroke="#F0F3F7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.0901" />
        </svg>
        <div className="flex gap-2.5 items-center font-['Inter',sans-serif] font-medium text-base">
          <span className="text-[#f0f3f7]">BTC</span>
          <span className="text-[#f0f3f7]">−6,2%</span>
          <span className="text-[#7b8a9e]">24h</span>
        </div>
        </motion.div>
      </div>

      {/* Breathe circle */}
      <motion.div
        className="relative flex justify-center items-center py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: T.circleAppear }}
      >
        <motion.div
          className="flex items-center justify-center"
          style={{ transformOrigin: "center" }}
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 4.8, ease: [0.45, 0, 0.55, 1], repeat: Infinity, delay: T.breathingLoop, repeatDelay: 0.6 }}
        >
          <svg width={r * 2 + 8} height={r * 2 + 8} viewBox={`0 0 ${r * 2 + 8} ${r * 2 + 8}`} fill="none">
            <defs>
              <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#D9D9D9" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#737373" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx={r + 4} cy={r + 4} r={r} fill={`url(#${gradientId})`} />
            <motion.circle
              cx={r + 4} cy={r + 4} r={r}
              stroke="#7B8A9E" strokeWidth="1.5" fill="none" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: T.circleDrawDur, delay: T.circleDraw, ease: "easeInOut" }}
              style={{ transformBox: "fill-box", transformOrigin: "center", rotate: "-90deg" }}
            />
          </svg>
        </motion.div>

        <motion.p
          className="absolute font-['Newsreader',serif] font-light italic text-[#f0f3f7] text-xl tracking-wide pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: T.breatheText }}
        >
          Breathe
        </motion.p>
      </motion.div>

      {/* "Slow down" footer */}
      <motion.p
        className="font-['Inter',sans-serif] font-medium text-[#f0f3f7] text-center text-sm"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: T.slowDown }}
      >
        Slow down before you decide
      </motion.p>
    </motion.div>
  );
}

function MobileWaitlistCTA({ waitlistRef }: { waitlistRef: string | null }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const configured = waitlistConfigured();

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!isValidEmail(email)) { setError("That doesn't look like a valid email."); return; }
    if (!configured) { setError("Waitlist is temporarily unavailable."); return; }
    setError("");
    setSubmitting(true);
    const result = await submitWaitlistEmail(email.trim(), { source: "welcome", ref: waitlistRef });
    setSubmitting(false);
    if (result.ok === false) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  };

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* CTA button + helper */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-[#f0f3f7] text-[#0a0f1a] font-['Inter',sans-serif] font-medium text-base rounded-lg px-7 h-[48px] transition-all duration-200 hover:bg-[#dbb366] hover:shadow-[0_0_16px_rgba(219,179,102,0.35)] active:scale-[0.97]"
        >
          Reserve your Spot
        </button>
        <p className="font-['Inter',sans-serif] text-[#7b8a9e] text-sm text-center">
          First week free when we launch.
        </p>
      </div>

      {/* Bottom sheet modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
            />

            {/* Sheet */}
            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e1625] border-t border-[rgba(42,59,84,0.6)] rounded-t-2xl px-6 pt-4 pb-10 flex flex-col gap-5"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
            >
              {/* Drag handle */}
              <div className="flex justify-center mb-1">
                <div className="w-10 h-1 rounded-full bg-[#2a3b54]" />
              </div>

              {/* Header */}
              <div className="flex flex-col gap-1">
                <h3 className="font-['Newsreader',serif] font-light text-white text-2xl tracking-tight leading-snug">
                  Leave your email
                </h3>
                <p className="font-['Inter',sans-serif] text-[#7b8a9e] text-sm leading-relaxed">
                  We'll reach out when your spot opens — first week free.
                </p>
              </div>

              {/* Form */}
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    className="flex items-center gap-2 py-2"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <CheckCircle className="size-4 text-[#49A47C] shrink-0" />
                    <p className="font-['Inter',sans-serif] font-medium text-[#f0f3f7] text-sm">
                      You're on the list — we'll be in touch.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    noValidate
                    className="flex flex-col gap-4"
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex flex-col gap-4">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                        onBlur={() => {
                          if (email.trim() && !isValidEmail(email)) setError("That doesn't look like a valid email.");
                        }}
                        placeholder="you@example.com"
                        className="w-full bg-[#0f172a] rounded-lg border px-5 h-[48px] font-['Inter',sans-serif] text-[#f0f3f7] text-sm placeholder:text-[#7b8a9e] outline-none transition-all duration-200 focus:border-[#dbb366] focus:ring-1 focus:ring-[rgba(219,179,102,0.25)]"
                        style={{ borderColor: error ? "#a66678" : "#2a3b54" }}
                      />
                      {error && (
                        <motion.p
                          className="font-['Inter',sans-serif] text-[#a66678] text-xs"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {error}
                        </motion.p>
                      )}
                      <button
                        type="submit"
                        className="w-full bg-[#f0f3f7] text-[#0a0f1a] font-['Inter',sans-serif] font-medium text-sm rounded-lg px-5 h-[48px] whitespace-nowrap transition-all duration-200 hover:bg-[#dbb366] hover:shadow-[0_0_16px_rgba(219,179,102,0.35)] active:scale-[0.97] disabled:opacity-60"
                        disabled={submitting}
                      >
                        {submitting ? "Saving…" : "Get early access"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Info row */}
              <div className="flex items-start gap-1.5">
                <Info className="size-[14px] shrink-0 mt-0.5 text-[#c1cbd7]" />
                <p className="font-['Inter',sans-serif] font-medium text-[#c1cbd7] text-xs leading-4">
                  One email when your spot opens. Unsubscribe anytime.
                </p>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap gap-1.5">
                {["Science-backed ritual", "Your data stays yours", "Not financial advice"].map((label) => (
                  <span
                    key={label}
                    className="font-['Inter',sans-serif] font-medium text-[#dbb366] text-[13px] border border-[rgba(240,243,247,0.15)] rounded-md px-2 py-0.5 leading-4"
                  >
                    {label}
                  </span>
                ))}
              </div>

              <p className="font-['Inter',sans-serif] font-medium text-[#7b8a9e] text-xs">
                Private beta · small batches · no payment to join the waitlist
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function WaitlistForm({ waitlistRef }: { waitlistRef: string | null }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const configured = waitlistConfigured();

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("That doesn't look like a valid email.");
      return;
    }
    if (!configured) {
      setError("Waitlist is temporarily unavailable.");
      return;
    }
    setError("");
    setSubmitting(true);
    const result = await submitWaitlistEmail(email.trim(), { source: "welcome", ref: waitlistRef });
    setSubmitting(false);
    if (result.ok === false) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div className="sm:bg-[#1a2333] sm:rounded-lg sm:border sm:border-[#2a3b54] sm:p-4 flex flex-col gap-2.5">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            className="flex items-center gap-2 py-1"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CheckCircle className="size-4 text-[#49A47C] shrink-0" />
            <p className="font-['Inter',sans-serif] font-medium text-[#f0f3f7] text-sm">
              You're on the list — we'll be in touch.
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-2.5"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                onBlur={() => {
                  if (email.trim() && !isValidEmail(email)) {
                    setError("That doesn't look like a valid email.");
                  }
                }}
                placeholder="you@example.com"
                className="w-full sm:flex-1 bg-[#0f172a] rounded border px-5 sm:px-3 h-[40px] sm:h-[56px] font-['Inter',sans-serif] text-[#f0f3f7] text-sm placeholder:text-[#7b8a9e] outline-none transition-all duration-200 focus:border-[#dbb366] focus:ring-1 focus:ring-[rgba(219,179,102,0.25)]"
                style={{ borderColor: error ? "#a66678" : "#2a3b54" }}
              />
              <button
                type="submit"
                className="bg-[#f0f3f7] text-[#0a0f1a] font-['Inter',sans-serif] font-medium text-sm rounded px-7 sm:px-4 h-[40px] sm:h-[38px] whitespace-nowrap transition-all duration-200 hover:bg-[#dbb366] hover:shadow-[0_0_16px_rgba(219,179,102,0.35)] active:scale-[0.97] disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Get early access"}
              </button>
            </div>

            {error && (
              <motion.p
                className="font-['Inter',sans-serif] text-[#a66678] text-xs"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.p>
            )}
          </motion.form>
        )}
      </AnimatePresence>

      <div className="flex items-start gap-1.5">
        <Info className="size-[14px] shrink-0 mt-0.5 text-[#c1cbd7]" />
        <p className="font-['Inter',sans-serif] font-medium text-[#c1cbd7] text-xs leading-4">
          One email when your spot opens. Unsubscribe anytime.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-4">
        {["Science-backed ritual", "Your data stays yours", "Not financial advice"].map((label) => (
          <span
            key={label}
            className="font-['Inter',sans-serif] font-medium text-[#dbb366] text-[13px] sm:text-[11px] border border-[rgba(240,243,247,0.15)] rounded-md px-2 py-0.5 leading-4"
          >
            {label}
          </span>
        ))}
      </div>

      <p className="font-['Inter',sans-serif] font-medium text-[#7b8a9e] text-xs">
        Private beta · small batches · no payment to join the waitlist
      </p>
    </div>
  );
}

// Disable hover effects when viewport width is below the md breakpoint (768px).
function useCanHover() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (min-width: 768px)");
    const sync = () => setOk(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return ok;
}

// Approximate blended color of card bg (rgba(10,17,30,0.7)) over section bg (#080e1a)
const CARD_FILL = "#0b1320";

function ComparisonCard({
  title, items, dotColor, lineColor, borderColor, inView,
}: {
  title: string; items: string[]; dotColor: string; lineColor: string; borderColor: string; inView: boolean;
}) {
  const lineDuration = 2.0;
  const count = items.length;

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl p-5 sm:p-6"
      style={{ background: "rgba(10,17,30,0.7)", border: `1px solid ${borderColor}` }}
    >
      {/* Card header — no dot, larger type */}
      <div>
        <span className="font-['Inter',sans-serif] font-medium text-white text-xl">{title}</span>
      </div>

      {/* Animated list */}
      <div className="relative">
        {/* Vertical connecting line — draws top to bottom at linear speed */}
        <motion.div
          className="absolute w-[1.5px]"
          style={{
            left: "6px",
            top: "7px",
            bottom: "7px",
            background: lineColor,
            transformOrigin: "top",
          }}
          initial={{ scaleY: 0 }}
          animate={{ scaleY: inView ? 1 : 0 }}
          transition={{ duration: lineDuration, ease: "linear" }}
        />

        <ul className="flex flex-col gap-3">
          {items.map((item, i) => {
            // delay each item so it appears when the line reaches it
            const delay = (i / Math.max(count - 1, 1)) * lineDuration;
            return (
              <li key={item} className="flex items-center gap-3">
                {/* Circle fills from card bg color to accent as line arrives */}
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 relative z-10">
                  <motion.circle
                    cx="7" cy="7" r="6"
                    stroke={dotColor}
                    strokeWidth="1.5"
                    strokeOpacity={0.65}
                    initial={{ fill: CARD_FILL }}
                    animate={{ fill: inView ? dotColor : CARD_FILL }}
                    transition={{ duration: 0.22, ease: "easeOut", delay }}
                  />
                </svg>
                {/* Text fades in when dot fills */}
                <motion.span
                  className="font-['Inter',sans-serif] font-normal text-[#c1cbd7] text-base"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: inView ? 1 : 0 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay }}
                >
                  {item}
                </motion.span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function ImpulseVsIntention() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const [alreadyVisible, setAlreadyVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    if (rect.top < window.innerHeight) setAlreadyVisible(true);
  }, []);

  const visible = alreadyVisible || inView;

  return (
    <section
      ref={ref}
      className="relative z-10 bg-[#080e1a] py-16 sm:py-20 lg:py-24 border-t border-[rgba(42,59,84,0.4)]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10 sm:gap-12">

        {/* Section header */}
        <div className="flex flex-col gap-4">
          <motion.p
            className="font-['Inter',sans-serif] font-medium text-[#dbb366] text-xs tracking-[0.18em] uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
            transition={{ duration: 0.5 }}
          >
            Impulse vs. Intention
          </motion.p>
          <motion.h2
            className="font-['Newsreader',serif] font-light text-white text-3xl sm:text-3xl lg:text-4xl leading-snug tracking-tight max-w-2xl"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            The costliest moves often happen in the first few minutes. Holzen buys you that gap.
          </motion.h2>
        </div>

        {/* Comparison cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <ComparisonCard
            title="Without Holzen"
            items={["The market drops", "Panic sets in", "You sell impulsively", "You regret it later"]}
            dotColor="#a66678"
            lineColor="rgba(166,102,120,0.4)"
            borderColor="rgba(166,102,120,0.35)"
            inView={visible}
          />
          <ComparisonCard
            title="With Holzen"
            items={["The market drops", "You pause & feel", "You breathe", "You reflect", "You decide deliberately", "You grow over time"]}
            dotColor="#dbb366"
            lineColor="rgba(219,179,102,0.35)"
            borderColor="rgba(219,179,102,0.35)"
            inView={visible}
          />
        </div>

      </div>
    </section>
  );
}

const HOW_STEPS = [
  {
    number: "01",
    title: "The market moves",
    description: "Holzen monitors daily and 7-day cumulative volatility against your personal thresholds. Or request a pause anytime.",
  },
  {
    number: "02",
    title: "You pause",
    description: "You name how you feel, then slow breathing grounds your nervous system — from FOMO and greed to calm and detachment.",
  },
  {
    number: "03",
    title: "You reflect",
    description: "An AI-generated reflection encourages awareness, not action. Five companions offer context: a haiku, a signal, a grounding nudge, a zoom-out perspective, and a historical echo.",
  },
  {
    number: "04",
    title: "You decide",
    description: "Log what you chose — for your awareness, not our advice. The full pause guides you through feel, breathe, reflect, frame, a second breath, then a short settle before Decide — six beats in the ritual, so your choices come from clarity, not impulse.",
  },
];

function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      ref={ref}
      className="relative z-10 bg-[#0e1625] py-16 sm:py-20 lg:py-24 border-t border-[rgba(42,59,84,0.4)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10 sm:gap-12">

        {/* Section header */}
        <div className="flex flex-col gap-3">
          <motion.p
            className="font-['Inter',sans-serif] font-medium text-[#dbb366] text-xs tracking-[0.18em] uppercase text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 8 }}
            transition={{ duration: 0.5 }}
          >
            How it works
          </motion.p>
          <motion.h2
            className="font-['Newsreader',serif] font-light text-white text-3xl sm:text-3xl lg:text-4xl leading-snug tracking-tight text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 10 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Four beats from alert to deliberate choice.
          </motion.h2>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-stretch">

          {/* Left — step list */}
          <div className="flex flex-col">
            {HOW_STEPS.map((step, i) => (
              <motion.div
                key={step.number}
                className="flex flex-col gap-2 py-6 border-b border-[rgba(255,255,255,0.07)]"
                style={{ borderTop: i === 0 ? "1px solid rgba(255,255,255,0.07)" : undefined }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 14 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 + i * 0.14 }}
              >
                <span className="font-['Inter',sans-serif] font-medium text-[#dbb366] text-xs tracking-wider">
                  {step.number}
                </span>
                <p className="font-['Inter',sans-serif] font-medium text-white text-lg">
                  {step.title}
                </p>
                <p className="font-['Inter',sans-serif] font-normal text-[#7b8a9e] text-base leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Right — iPhone image, cropped to match steps height */}
          <motion.div
            className="relative overflow-hidden rounded-2xl w-full h-full min-h-[320px]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 16 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
          >
            <img
              src={iphoneImg}
              alt="Holzen app on iPhone"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </motion.div>

        </div>

      </div>
    </section>
  );
}

const WHY_FEATURES = [
  {
    icon: Activity,
    title: "Volatility-triggered pauses",
    description: "Alerts when Bitcoin crosses your thresholds — or start a pause yourself when you need one.",
  },
  {
    icon: Clock,
    title: "Structured ritual",
    description: "Feel, breathe, reflect, frame, breathe again, decide — sequenced from behavioral research.",
  },
  {
    icon: TrendingUp,
    title: "Pattern tracking",
    description: "Log moods and outcomes. Your archive shows how composure evolves across volatile weeks.",
  },
];

function WhyHolzen() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section
      ref={ref}
      className="relative z-10 bg-[#080e1a] py-16 sm:py-20 lg:py-24 border-t border-[rgba(42,59,84,0.4)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10 sm:gap-12">

        {/* Header — left aligned */}
        <div className="flex flex-col gap-4 max-w-2xl">
          <motion.p
            className="font-['Inter',sans-serif] font-medium text-[#dbb366] text-xs tracking-[0.18em] uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 8 }}
            transition={{ duration: 0.5 }}
          >
            Why Holzen
          </motion.p>
          <motion.h2
            className="font-['Newsreader',serif] font-light text-white text-3xl sm:text-3xl lg:text-4xl leading-snug tracking-tight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 10 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            One practice, three outcomes — less reactivity, more clarity over time.
          </motion.h2>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {WHY_FEATURES.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              className="flex flex-col gap-4 rounded-2xl p-5 sm:p-6"
              style={{
                background: "rgba(10,17,30,0.7)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 16 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0.2 + i * 0.12 }}
            >
              {/* Icon badge */}
              <div
                className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                style={{ background: "rgba(219,179,102,0.12)" }}
              >
                <Icon className="size-[18px] text-[#dbb366]" strokeWidth={1.75} />
              </div>

              <div className="flex flex-col gap-2">
                <p className="font-['Inter',sans-serif] font-medium text-white text-lg">
                  {title}
                </p>
                <p className="font-['Inter',sans-serif] font-normal text-[#7b8a9e] text-base leading-relaxed">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

function ResearchQuote() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section
      id="science"
      ref={ref}
      className="relative z-10 bg-[#0e1625] py-20 sm:py-24 lg:py-32 border-t border-[rgba(42,59,84,0.4)] overflow-hidden"
    >
      {/* Expanding circular waves */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            top: "50%",
            left: "50%",
            translateX: "-50%",
            translateY: "-50%",
            width: "40vw",
            height: "40vw",
            border: "1px solid rgba(219,179,102,0.12)",
          }}
          animate={{ scale: [0.4, 3.2], opacity: [0.5, 0] }}
          transition={{
            duration: 7,
            delay: i * 1.4,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        <motion.div
          className="w-full max-w-2xl flex flex-col gap-5 rounded-2xl p-7 sm:p-9"
          style={{
            background: "rgba(10,17,30,0.75)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 16 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h2 className="font-['Newsreader',serif] font-light italic text-white text-2xl sm:text-2xl lg:text-3xl leading-snug tracking-tight">
            Under volatility, feelings often decide before reflection gets a chance.
          </h2>

          <p className="font-['Inter',sans-serif] font-normal text-[#7b8a9e] text-base sm:text-base leading-relaxed">
            Research on affect and risk shows that fear in a drop or euphoria in a surge can steer choices before you've regulated. Naming what you feel and slowing down creates space for deliberate judgment — not a market call from us.
          </p>

          <a
            href="https://psycnet.apa.org/doiLanding?doi=10.1037%2F0033-2909.127.2.267"
            target="_blank"
            rel="noopener noreferrer"
            className="font-['Inter',sans-serif] font-medium text-[#dbb366] text-sm inline-flex items-center gap-1 hover:opacity-75 transition-opacity duration-200 w-fit"
          >
            Read the research
            <span aria-hidden>↗</span>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function EarlyAccessCTA({ waitlistRef }: { waitlistRef: string | null }) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const canHover = useCanHover();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const configured = waitlistConfigured();

  // Mouse-following light spot
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHovered, setCardHovered] = useState(false);
  const rawMX = useMotionValue(0);
  const rawMY = useMotionValue(0);
  const spotX = useSpring(rawMX, { stiffness: 130, damping: 22 });
  const spotY = useSpring(rawMY, { stiffness: 130, damping: 22 });
  // Offset by half the spot size so it centers on the cursor
  const spotLeft = useTransform(spotX, v => v - 150);
  const spotTop = useTransform(spotY, v => v - 150);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    rawMX.set(e.clientX - rect.left);
    rawMY.set(e.clientY - rect.top);
  };

  const isValidEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email."); return; }
    if (!isValidEmail(email)) { setError("That doesn't look like a valid email."); return; }
    if (!configured) { setError("Waitlist is temporarily unavailable."); return; }
    setError("");
    setSubmitting(true);
    const result = await submitWaitlistEmail(email.trim(), { source: "welcome-cta", ref: waitlistRef });
    setSubmitting(false);
    if (result.ok === false) {
      setError(result.error);
      return;
    }
    setSubmitted(true);
  };

  return (
    <section
      ref={ref}
      className="relative z-10 bg-[#080e1a] py-20 sm:py-24 lg:py-32 border-t border-[rgba(42,59,84,0.4)] overflow-hidden"
    >
      {/* Subtle ambient blobs — mobile feels alive without a card */}
      <motion.div className="absolute pointer-events-none rounded-full"
        style={{ width: "70vw", height: "70vw", top: "-20vw", left: "-20vw", background: "radial-gradient(ellipse, rgba(90,72,30,0.55) 0%, transparent 68%)", filter: "blur(60px)" }}
        animate={{ x: [0, "8vw", "-4vw", 0], y: [0, "5vw", "-3vw", 0] }}
        transition={{ duration: 18, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div className="absolute pointer-events-none rounded-full"
        style={{ width: "60vw", height: "60vw", bottom: "-15vw", right: "-15vw", background: "radial-gradient(ellipse, rgba(18,55,110,0.55) 0%, transparent 68%)", filter: "blur(60px)" }}
        animate={{ x: [0, "-6vw", "3vw", 0], y: [0, "-4vw", "4vw", 0] }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity, delay: 5 }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
        <motion.div
          ref={cardRef}
          className="w-full max-w-2xl flex flex-col gap-6 text-center relative overflow-hidden cursor-default sm:rounded-2xl sm:p-8 lg:p-10 sm:border sm:border-[rgba(255,255,255,0.08)] sm:bg-[rgba(10,17,30,0.75)]"
          style={{}}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 16 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          onMouseEnter={canHover ? (e) => { setCardHovered(true); handleCardMouseMove(e); } : undefined}
          onMouseMove={canHover ? handleCardMouseMove : undefined}
          onMouseLeave={canHover ? () => setCardHovered(false) : undefined}
        >
          {/* Diffuse light spot following mouse */}
          <motion.div
            className="absolute pointer-events-none"
            style={{
              left: spotLeft,
              top: spotTop,
              width: "300px",
              height: "300px",
              background: "radial-gradient(circle, rgba(219,179,102,0.07) 0%, transparent 65%)",
              borderRadius: "50%",
              filter: "blur(12px)",
            }}
            animate={{ opacity: cardHovered ? 1 : 0 }}
            transition={{ opacity: { duration: 0.25 } }}
          />
          <div className="flex flex-col gap-3">
            <h2 className="font-['Inter',sans-serif] font-medium text-white text-2xl sm:text-2xl">
              Get early access
            </h2>
            <p className="font-['Inter',sans-serif] font-normal text-[#7b8a9e] text-base sm:text-base leading-relaxed">
              We invite in small batches. Leave your email —<br className="hidden sm:block" /> one message when your spot opens.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                className="flex items-center justify-center gap-2 py-2"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <CheckCircle className="size-4 text-[#49A47C] shrink-0" />
                <p className="font-['Inter',sans-serif] font-medium text-[#f0f3f7] text-sm">
                  You're on the list — we'll be in touch.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-2"
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                    onBlur={() => {
                      if (email.trim() && !isValidEmail(email)) setError("That doesn't look like a valid email.");
                    }}
                    placeholder="you@example.com"
                    className="w-full sm:flex-1 bg-[#0f172a] rounded-lg border px-3 h-[40px] sm:h-[42px] font-['Inter',sans-serif] text-[#f0f3f7] text-sm placeholder:text-[#7b8a9e] outline-none transition-all duration-200 focus:border-[#dbb366] focus:ring-1 focus:ring-[rgba(219,179,102,0.25)]"
                    style={{ borderColor: error ? "#a66678" : "#2a3b54" }}
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-[#f0f3f7] text-[#0a0f1a] font-['Inter',sans-serif] font-medium text-sm rounded-lg px-5 h-[40px] sm:h-[42px] whitespace-nowrap transition-all duration-200 hover:bg-[#dbb366] hover:shadow-[0_0_16px_rgba(219,179,102,0.35)] active:scale-[0.97] disabled:opacity-60"
                  >
                    {submitting ? "Saving…" : "Get early access"}
                  </button>
                </div>
                {error && (
                  <motion.p
                    className="font-['Inter',sans-serif] text-[#a66678] text-xs text-left"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {error}
                  </motion.p>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          <p className="font-['Inter',sans-serif] font-normal text-[#7b8a9e] text-xs">
            One email when your spot opens. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  {
    question: "Who is Holzen for?",
    answer: "Anyone who invests and has felt the pull to act when markets move — whether that's selling during a drop, buying during a surge, or endlessly checking the chart. Holzen is for people who want to understand their emotional patterns and choose deliberately. It is not a signals or trading tool.",
  },
  {
    question: "Does Holzen tell me to buy, sell, or hold?",
    answer: "No. Holzen doesn't know your goals, timeline, or portfolio. It interrupts impulse and helps you notice what you're feeling so you decide — consciously. Outcomes you log during a pause are for your own awareness, not our recommendation.",
  },
  {
    question: "How do I get access?",
    answer: "Join above with your email. No payment or app signup required. We onboard in small batches and email you when it is your turn.",
  },
  {
    question: "Isn't this just another meditation app?",
    answer: "Meditation apps are general-purpose. Holzen is triggered by real market events — it meets you in the moment you're most likely to act on impulse. It combines breathing, AI reflections, behavioral science, curated intelligence, and long-term pattern tracking into one practice. Calm doesn't know when Bitcoin just dropped 8%.",
  },
];

function FAQ() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      ref={ref}
      className="relative z-10 bg-[#080e1a] py-16 sm:py-20 lg:py-24 border-t border-[rgba(42,59,84,0.4)]"
    >
      <div className="px-4 sm:px-6 lg:px-8 flex flex-col gap-8 sm:gap-10">

        <motion.p
          className="font-['Inter',sans-serif] font-medium text-[#dbb366] text-xs tracking-[0.18em] uppercase"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 8 }}
          transition={{ duration: 0.5 }}
        >
          Questions
        </motion.p>

        <div className="flex flex-col w-full">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={item.question}
                className="border-b border-[rgba(255,255,255,0.07)]"
                style={{ borderTop: i === 0 ? "1px solid rgba(255,255,255,0.07)" : undefined }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 12 }}
                transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 + i * 0.08 }}
              >
                <button
                  className="w-full flex items-center justify-between gap-4 py-5 text-left cursor-pointer"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                >
                  <span className="font-['Inter',sans-serif] font-medium text-white text-lg">
                    {item.question}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="shrink-0 text-[#7b8a9e]"
                  >
                    <ChevronDown className="size-4" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="font-['Inter',sans-serif] font-normal text-[#7b8a9e] text-base leading-relaxed pb-5">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-10 bg-[#0e1625] border-t border-[rgba(42,59,84,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col gap-8">
        <p className="font-['Inter',sans-serif] font-normal text-[#7b8a9e] text-base sm:text-lg leading-relaxed">
          Holzen is not a trading tool or financial advisor. We don't tell you what to buy, sell, or hold. We help you understand yourself — one volatile moment at a time.
        </p>

        <div className="flex flex-col gap-2">
          <span className="font-['Inter',sans-serif] font-medium text-[#4a5568] text-xs tracking-[0.18em] uppercase">Contact</span>
          <a
            href="mailto:hello@holzen.app"
            className="font-['Inter',sans-serif] font-normal text-[#7b8a9e] text-base hover:text-[#dbb366] transition-colors duration-200 w-fit"
          >
            hello@holzen.app
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/privacy"
            className="font-['Inter',sans-serif] font-normal text-[#dbb366] text-base hover:opacity-70 transition-opacity duration-200"
          >
            Privacy
          </Link>
          <span className="text-[#4a5568]">·</span>
          <Link
            to="/terms"
            className="font-['Inter',sans-serif] font-normal text-[#dbb366] text-base hover:opacity-70 transition-opacity duration-200"
          >
            Terms
          </Link>
          <span className="text-[#4a5568]">·</span>
          <Link
            to="/auth"
            className="font-['Inter',sans-serif] font-normal text-[#7b8a9e] text-base hover:text-[#dbb366] transition-colors duration-200"
          >
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function WelcomeLandingScreen() {
  const [searchParams] = useSearchParams();
  const waitlistRef = searchParams.get("ref");

  useEffect(() => {
    void pingLandingView("/welcome");
  }, []);

  return (
    <div className="min-h-screen bg-[#0e1625] relative overflow-hidden font-['Inter',sans-serif]">
      <PageMeta
        title="Holzen — Pause before you act when Bitcoin moves"
        description="Volatility-triggered pause practice for Bitcoin investors. Get early access to a science-backed ritual that creates space between impulse and action — not financial advice."
        path="/welcome"
      />

      {/* ── Animated background blobs ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "60vw", height: "30vw", background: "radial-gradient(ellipse, rgba(90,72,30,0.85) 0%, transparent 68%)", filter: "blur(70px)", top: "-10vw", left: "-15vw" }}
        animate={{ x: [0, "6vw", "-3vw", "5vw", 0], y: [0, "-3vw", "5vw", "-2vw", 0] }}
        transition={{ duration: 32, ease: "easeInOut", repeat: Infinity }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "55vw", height: "28vw", background: "radial-gradient(ellipse, rgba(18,55,110,0.85) 0%, transparent 68%)", filter: "blur(70px)", top: "-5vw", right: "-15vw" }}
        animate={{ x: [0, "-7vw", "3vw", "-4vw", 0], y: [0, "4vw", "-3vw", "3vw", 0] }}
        transition={{ duration: 26, ease: "easeInOut", repeat: Infinity, delay: 4 }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "50vw", height: "25vw", background: "radial-gradient(ellipse, rgba(18,55,110,0.75) 0%, transparent 68%)", filter: "blur(70px)", bottom: "-5vw", left: "20vw" }}
        animate={{ x: [0, "4vw", "-3vw", "2vw", 0], y: [0, "-4vw", "2vw", "-1vw", 0] }}
        transition={{ duration: 38, ease: "easeInOut", repeat: Infinity, delay: 10 }}
      />
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{ width: "45vw", height: "22vw", background: "radial-gradient(ellipse, rgba(80,55,14,0.7) 0%, transparent 68%)", filter: "blur(90px)", top: "30%", left: "30%" }}
        animate={{ x: [0, "-5vw", "4vw", "-2vw", 0], y: [0, "3vw", "-4vw", "2vw", 0], opacity: [0.6, 0.9, 0.65, 0.85, 0.6] }}
        transition={{ duration: 22, ease: "easeInOut", repeat: Infinity, delay: 7 }}
      />

      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-[rgba(15,23,42,0.9)] backdrop-blur-sm border-b border-[rgba(42,59,84,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 sm:h-14 flex items-center justify-center">
          <Logo />
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-14">
        <div className="py-12 sm:py-16 lg:py-20 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="flex flex-col gap-8 lg:gap-10 w-full">
            <div className="flex flex-col gap-4 sm:gap-5">
              <p className="font-['Newsreader',serif] font-light text-[#dbb366] text-xl sm:text-xl lg:text-2xl tracking-tight leading-snug">
                For Bitcoin investors
              </p>
              <h1 className="font-['Inter',sans-serif] font-bold text-white text-3xl sm:text-3xl lg:text-4xl xl:text-[40px] tracking-tight leading-tight">
                Pause before impulse trades the move
              </h1>
              <p className="font-['Inter',sans-serif] font-normal text-[#c1cbd7] text-base sm:text-base lg:text-lg leading-relaxed tracking-tight">
                Holzen detects volatility and walks you through a structured ritual — feel, breathe, reflect, decide. You stay in control of every trade.
              </p>
            </div>

            <div className="md:hidden w-full">
              <PhoneShowcase gradientId="breatheGradFillMobile" borderColor="rgba(255,255,255,0.22)" />
            </div>

            <div className="relative mt-6 pt-0 pb-0 mb-[-8px] md:mt-0 md:pt-0 md:pb-0 md:mb-0">
              <motion.div
                className="md:hidden absolute pointer-events-none rounded-full"
                style={{
                  width: "280px", height: "280px",
                  top: "-60px", right: "-80px",
                  background: "radial-gradient(ellipse, rgba(90,72,30,0.5) 0%, transparent 68%)",
                  filter: "blur(60px)",
                  zIndex: 0,
                }}
                animate={{ x: [0, "18px", "-10px", 0], y: [0, "14px", "-8px", 0] }}
                transition={{ duration: 16, ease: "easeInOut", repeat: Infinity }}
              />
              <motion.div
                className="md:hidden absolute pointer-events-none rounded-full"
                style={{
                  width: "240px", height: "240px",
                  bottom: "-50px", left: "-60px",
                  background: "radial-gradient(ellipse, rgba(18,55,110,0.45) 0%, transparent 68%)",
                  filter: "blur(55px)",
                  zIndex: 0,
                }}
                animate={{ x: [0, "-14px", "8px", 0], y: [0, "-10px", "12px", 0] }}
                transition={{ duration: 20, ease: "easeInOut", repeat: Infinity, delay: 4 }}
              />

              <div className="md:hidden relative z-10">
                <MobileWaitlistCTA waitlistRef={waitlistRef} />
              </div>

              <div className="hidden md:block relative z-10">
                <WaitlistForm waitlistRef={waitlistRef} />
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col items-center justify-center w-full">
            <div className="w-[75%]">
              <PhoneShowcase gradientId="breatheGradFillDesktop" />
            </div>
          </div>
        </div>
      </main>

      <ImpulseVsIntention />
      <HowItWorks />
      <WhyHolzen />
      <ResearchQuote />
      <EarlyAccessCTA waitlistRef={waitlistRef} />
      <FAQ />
      <Footer />
    </div>
  );
}
