import Link from "next/link";
export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/landing.jpeg')",
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      {/* Nav */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="text-white text-2xl font-bold tracking-wide">
          GuitarFi
        </div>
        <Link
          href="/maintenance"
          className="
            rounded-full
            bg-white
            px-6 py-3
            text-sm
            font-semibold 
            text-black
            transition
            hover:scale-105
          "
        >
          Launch App
        </Link>
      </header>
      {/* Hero */}
      <section className="relative z-10 flex min-h-[85vh] items-center justify-center px-6">
        <div className="max-w-5xl text-center">
          <h1
            className="
              text-5xl
              md:text-7xl
              font-bold
              leading-none
              text-white
              drop-shadow-xl
            "
          >
            Play.
            <br />
            Earn.
            <br />
            Own.
          </h1>
          <p
            className="
              mt-8
              text-lg
              md:text-xl
              text-white/80
              max-w-2xl
              mx-auto 
            "
          >
            The SocialFi & GameFi Hub built on Base.
            Stake, play tunes, earn rewards and unlock
            exclusive utilities with Guitar Token.
          </p>
          <div className="mt-10 flex justify-center">
            <Link
              href="/maintenance"
              className="
  group
  relative
  isolate
  overflow-hidden 
  rounded-2xl
  border border-white/15
  px-6 py-3
  text-sm
  font-semibold 
  tracking-[0.18em]
  uppercase
  text-slate-300
  backdrop-blur-3xl
  bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04))]
  shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]
  transition-all 
  duration-500 
  hover:scale-[1.03] 
  hover:border-white/30
  hover:shadow-[0_15px_45px_rgba(0,0,0,0.55),0_0_25px_rgba(255,255,255,0.12)]
  before:absolute
  before:inset-0
  before:rounded-2xl 
  before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_45%)]
  after:absolute
  after:inset-0
  after:rounded-2xl
  after:bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.22)_50%,transparent_80%)]
  after:translate-x-[-160%]
  hover:after:translate-x-[160%]
  after:transition-transform
  after:duration-[1800ms]
  [&>span]:relative
  [&>span]:z-10
"
            >
              Launch App →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
