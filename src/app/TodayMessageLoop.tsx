import { useEffect, useState } from "react";
type Props = {
  isDarkMode: boolean;
  account: string | null;
};
export default function TodayMessageLoop({ isDarkMode, account }: Props) { 
  const slides = [
    {
      duration: 4000,
      first: (
        <>
          Hello{account ? "," : ""}{" "}
          <span
            className={`font-medium ${isDarkMode ? "text-sky-200" : "text-slate-900"
              }`}
          >
            {account ? "guitarist" : "friend"}
          </span>{" "}
        </>
      ),
      second: "Turn activity into GTR⚡Unlock NFTs. Grow your legend.", 
      hero: true,
    },
    {
      duration: 5000,
      first: "Every play unlocks a special guitar NFT",
      second: "Spin the tune, collect the legend.",
      hero: false,
    },
    {
      duration: 5000, 
      first: "Your next melody is waiting 🎶",
      second: "Play Tune and discover a random soundtrack.",
      hero: false,
    },
    {
      duration: 5000, 
      first: "Consistency unlocks rare guitars 🎸",
      second: "Every daily Gm brings a new collectible.",
    },
    {
      duration: 5000,
      first: "31 unique Guitar NFTs await",
      second: "Can you complete the entire collection?",
    },
    {
      duration: 5000,
      first: "Your collection tells your story ✨",
      second: "Every NFT marks a moment in your journey.",
    },
    {
      duration: 5000,
      first: "Put your BASE to work",
      second: "Deposit, withdraw and stay liquid anytime.",
    },
    {
      duration: 5000,
      first: "Support the creator behind GuitarFi ❤️",
      second: "Every contribution keeps the music alive.",
    }

  ];
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const current = slides[index];
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % slides.length);
        setVisible(true);
      }, 300);
    }, current.duration);
    return () => clearTimeout(timer);
  }, [index, slides]);
  const slide = slides[index];
  return (
    <div className="relative h-[38px] overflow-hidden">
      <div
        className={`transition-all duration-300 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"
          }`}
      >
        {slide.hero ? (
          <>

            <p
              className={`text-sm leading-tight ${isDarkMode ? "text-slate-200" : "text-slate-900" 
                }`}
            >
              {slide.first}
            </p>
            <p
              className={`text-[11px] truncate ${isDarkMode ? "text-slate-400" : "text-slate-900"
                }`}
            >
              {slide.second}
            </p>
          </>
        ) : (
          <>
            <p
              className={`text-[11px] leading-tight ${isDarkMode ? "text-slate-400" : "text-slate-900" 
                }`}
            >
              {slide.first}
            </p>
            <p
              className={`text-[11px] truncate ${isDarkMode ? "text-slate-400" : "text-slate-900"
                }`}
            >
              {slide.second}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
