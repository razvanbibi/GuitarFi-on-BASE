"use client";
import { useEffect, useState } from "react";
import {
  getEthereum,
  getContractWithSigner,
  getReadOnlyContract,
  formatToken,
  getTokenContractWithSigner,
  getVaultContractWithSigner,
  getVaultReadOnlyContract,
  GUITARFI_SMART_CONTRACT,
  getIdentityContractWithSigner,
  getIdentityReadOnlyContract,
  CELODAILY_VAULT_CONTRACT,
  GUITARFI_BADGES_CONTRACT,
  GUITARFI_BADGES_ABI,
} from "@/lib/contract";
import Image from "next/image";
import {
  ethers, BrowserProvider, Contract,
} from "ethers";
import TodayMessageLoop from "../TodayMessageLoop";
import { Gift } from "lucide-react";
import { useRef } from "react";

type Status = string | null;
type Toast =
  | { type: "checkin"; message: string }
  | { type: "claim"; message: string }
  | { type: "donation"; message: string }
  | null;
type Supporter = {
  address: string;
  total: number;
  name?: string;
  avatar?: string;
};


const USDM_TOKEN_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

function AvatarBubbleStream({ avatar }: { avatar: string }) {
  const [bubbles, setBubbles] = useState<
    { id: number; left: number; size: number }[]
  >([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles((prev) => [
        ...prev,
        {
          id: Date.now(),
          left: Math.random() * 30 - 15,
          size: 14 + Math.random() * 10,
        },
      ]);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {bubbles.map((b) => (
        <img
          key={b.id}
          src={avatar}
          className="absolute rounded-full animate-avatar-float"
          style={{
            left: `calc(50% + ${b.left}px)`,
            bottom: "0px",
            width: b.size,
            height: b.size,
            animationDuration: "3.8s",
          }}
          onAnimationEnd={() =>
            setBubbles((prev) => prev.filter((x) => x.id !== b.id))
          }
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [streak, setStreak] = useState<bigint | null>(null);
  const [highestStreak, setHighestStreak] = useState<bigint | null>(null);
  const [pendingRewards, setPendingRewards] = useState("0");
  const [pendingTokens, setPendingTokens] = useState<bigint | null>(null);
  const [paused, setPaused] = useState<boolean | null>(null);
  const [totalEarned, setTotalEarned] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [vaultAction, setVaultAction] = useState<
    "deposit" | "withdraw" | null
  >(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  const [recentlyClaimed, setRecentlyClaimed] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const [pendingNFT1, setpendingNFT1] = useState<bigint | null>(null);
  const [pendingNFT2, setpendingNFT2] = useState<bigint | null>(null);
  const [pendingNFT3, setpendingNFT3] = useState<bigint | null>(null);
  const [pendingNFT31, setpendingNFT31] = useState<bigint | null>(null);
  const [nftBalances, setNftBalances] =
    useState<Record<number, number>>({});
  const [loadingNFTs, setLoadingNFTs] =
    useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [showTradeMenu, setShowTradeMenu] = useState(false);
  const [showExploreMenu, setShowExploreMenu] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showCeloVault, setShowCeloVault] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showCollectionsModal, setShowCollectionsModal] = useState(false);
  const [vaultAmount, setVaultAmount] = useState("1");
  const [vaultBalance, setVaultBalance] = useState("0");
  const [userVaultBalance, setUserVaultBalance] = useState("0");
  const [celoVaultBalance, setCeloVaultBalance] =
    useState("0");
  const [globalToast, setGlobalToast] =
    useState<string | null>(null);
  const [userCeloVaultBalance, setUserCeloVaultBalance] =
    useState("0");
  const [donationAmount, setDonationAmount] = useState<string>("1");
  const [profileName, setProfileName] = useState<string>("");
  const [profileAvatar, setProfileAvatar] = useState<string>("/avatar.png");
  const [ethReady, setEthReady] = useState(false);
  const [topSupporters, setTopSupporters] = useState<Supporter[]>([]);
  const [taglineAnim, setTaglineAnim] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showBadgeInfo, setShowBadgeInfo] = useState(false);
  const [flashGlow, setFlashGlow] = useState(false);
  const [showRewardsTip, setShowRewardsTip] = useState(false);
  const [showBadgesTip, setShowBadgesTip] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<
    { address: string; highestStreak: number; name?: string | null; avatar?: string | null }[]
  >([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [showMintIdentity, setShowMintIdentity] = useState(false);
  const IDENTITY_NFT_ADDRESS = "0xa2bd91092C7b0817C8D7fC0C5a6a6059248193Df";
  const DEV_PASSWORD = "1245";
  const [hasIdentityNFT, setHasIdentityNFT] = useState<boolean | null>(null);
  const [identityTokenId, setIdentityTokenId] = useState<number | null>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [devPasswordInput, setDevPasswordInput] = useState("");
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [devRunning, setDevRunning] = useState(false);
  const [devMintAddress, setDevMintAddress] = useState("");
  const [devMintAmount, setDevMintAmount] = useState("");
  const [devBurnAmount, setDevBurnAmount] = useState("");
  const [devBurnCount, setDevBurnCount] = useState("500");
  const [devClaimAddress, setDevClaimAddress] = useState("");
  const [devClaimAmount, setDevClaimAmount] = useState("");
  const [devReverseToken, setDevReverseToken] = useState(""); 
  const [devReverseAmount, setDevReverseAmount] = useState("");
  const [devMultiAddresses, setDevMultiAddresses] = useState("");
  const [devMultiAmounts, setDevMultiAmounts] = useState("");
  const [isMiniPay, setIsMiniPay] = useState(false);
  const [showBadgeTooltip, setShowBadgeTooltip] = useState(false);
  const [currentTune, setCurrentTune] = useState("");
  const [tunePlaying, setTunePlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [convertToken, setConvertToken] =
    useState("USDm");
  const [convertAmount, setConvertAmount] =
    useState("1");
  const [hasIdentity, setHasIdentity] =
    useState(false);
  const [identityURI, setIdentityURI] =
    useState("");
  const [identityImage, setIdentityImage] =
    useState("");
  const [identityMetadata, setIdentityMetadata] =
    useState<any>(null);
  const [showIdentityRequired, setShowIdentityRequired] = useState(false);
  const [devWithdrawUSDM, setDevWithdrawUSDM] = useState("");
  const [devWithdrawCELO, setDevWithdrawCELO] = useState("");
  const [expandedCollection, setExpandedCollection] =
    useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("celodaily_onboarding_v1");
    if (!seen) {
      setShowOnboarding(true);
      window.localStorage.setItem("celodaily_onboarding_v1", "1");
    }
  }, []);

  const closeOnboarding = () => {
    setShowOnboarding(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("celodaily_theme");
    if (stored === "dark") {
      setIsDarkMode(true);
    } else if (stored === "light") {
      setIsDarkMode(false);
    }
  }, []);


  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      "celodaily_theme",
      isDarkMode ? "dark" : "light"
    );
  }, [isDarkMode]);


  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      setEthReady(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (eth?.isMiniPay) {
      setIsMiniPay(true);
      console.log("✅ MiniPay detected");
    }
  }, []);

  useEffect(() => {
    if (
      account &&
      hasIdentityNFT
    ) {
      loadIdentity();

    }
  }, [
    account,
    hasIdentityNFT
  ]);

  function getTodayId() {
    const d = new Date();
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
  }
  function getTimeUntilTomorrowUTC() {
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0, 0, 0
      )
    );
    const diff = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(diff / 36e5);
    const minutes = Math.floor((diff % 36e5) / 6e4);
    return `${hours}h ${minutes}m`;
  }
  function getStorageKey(acc: string) {
    return `celodaily:checkin:${acc.toLowerCase()}`;
  }

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) {
      showGlobalToast("Please install MetaMask or a compatible wallet.");
      return;
    }
    const handleAccountsChanged = (accs: string[]) => {
      setAccount(accs[0] ?? null);
    };
    const handleChainChanged = () => {
      window.location.reload();
    };
    eth.request({ method: "eth_accounts" }).then((accs: string[]) => {
      if (accs.length > 0) setAccount(accs[0]);
    });
    eth.on("accountsChanged", handleAccountsChanged);
    eth.on("chainChanged", handleChainChanged);
    return () => {
      if (!eth.removeListener) return;
      eth.removeListener("accountsChanged", handleAccountsChanged); 
      eth.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (!account || !ethReady) return;
    void refreshData();
    try {
      const key = getStorageKey(account);
      const stored = window.localStorage.getItem(key);
      setHasCheckedInToday(stored === getTodayId());
    } catch {
    }
  }, [account, ethReady]);

  useEffect(() => {
    if (!account) return;
    loadVaultData();
  }, [account]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineAnim(false);
      // re-trigger animation
      setTimeout(() => {
        setTaglineAnim(true);
      }, 50);
    }, 11000); // 11 sec
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    void loadDonationLeaderboard();
  }, []);

  useEffect(() => {
    if (!showLeaderboard) return;
    const close = () => setShowLeaderboard(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showLeaderboard]);

  const IDENTITY_NFT_ABI = [
    "function mint() external",
  ];

  async function handleMintIdentity() {
    try {
      if (!account) {
        showGlobalToast("Connect wallet first");
        return;
      }
      setLoading(true);
      setStatus("Confirm mint in wallet...");
      await ensureCeloNetwork();
      const eth = getEthereum();
      if (!eth) throw new Error("Wallet not found");
      const provider = new ethers.BrowserProvider(eth as any);
      const signer = await provider.getSigner();
      const nft = new ethers.Contract(
        IDENTITY_NFT_ADDRESS,
        ["function mint()"],
        signer
      );
      const tx = await nft.mint();
      await tx.wait();
      setHasIdentityNFT(true);
      await loadIdentity();
      showGlobalToast(
        "Identity NFT minted 🎉"
      );
      setShowMintIdentity(false);
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.info?.error?.message ??
        err?.shortMessage ??
        err?.message ??
        "Mint failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function getUSDmContractWithSigner() {
    const eth = getEthereum();
    if (!eth) throw new Error("Wallet not found");
    const provider = new ethers.BrowserProvider(eth as any);
    const signer = await provider.getSigner();
    const usdcAbi = [
      "function transfer(address to, uint256 amount) returns (bool)",
      "function allowance(address owner, address spender) view returns (uint256)",
      "function approve(address spender, uint256 amount) returns (bool)",
    ];
    const usdc = new ethers.Contract(USDM_TOKEN_ADDRESS, usdcAbi, signer);
    return { provider, signer, usdc };
  }

  useEffect(() => {
    if (!account || !ethReady) return;

    async function checkIdentityNFT() {
      try {
        const eth = getEthereum();
        if (!eth) return;
        const provider = new ethers.BrowserProvider(eth as any);
        const nft = new ethers.Contract(
          IDENTITY_NFT_ADDRESS,
          ["function balanceOf(address owner) view returns (uint256)"],
          provider
        );
        const balance = Number(await nft.balanceOf(account));
        setHasIdentityNFT(balance > 0);
      } catch (err) {
        console.error("Identity NFT check failed", err);
      }
    }
    checkIdentityNFT();
  }, [account, ethReady]);

  useEffect(() => {
    if (!account) return;
    const saved = localStorage.getItem(`profile:${account}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfileName(parsed.name || "");
        setProfileAvatar(parsed.avatar || "/avatar.png");
      } catch { }
    }
  }, [account]);

  async function saveProfile(name: string, avatar: string) {
    if (!account) return;
    setProfileName(name);
    setProfileAvatar(avatar);
    localStorage.setItem(
      `profile:${account}`,
      JSON.stringify({ name, avatar })
    );
    try {
      const res = await fetch("/api/profile/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: account,
          name,
          avatar,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        console.error("Profile sync failed");
      }
    } catch (err) {
      console.error("Profile upload failed", err);
    }
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      saveProfile(profileName, base64);
    };
    reader.readAsDataURL(file);
  }

  async function ensureCeloNetwork() {
    const eth = getEthereum();
    if (!eth) throw new Error("Wallet not found");
    if ((window as any).ethereum?.isMiniPay) {
      return;
    }
    const chainId = await eth.request({ method: "eth_chainId" });
    if (chainId !== "0xa4ec") {
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xa4ec" }],
        });
      } catch (err: any) {
        if (err.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xa4ec",
                chainName: "Celo",
                rpcUrls: ["https://forno.celo.org"],
                nativeCurrency: {
                  name: "CELO",
                  symbol: "CELO",
                  decimals: 18,
                },
                blockExplorerUrls: ["https://celoscan.io"],
              },
            ],
          });
        } else {
          throw err;
        }
      }
    }
  }


  async function handleConvert() {
    try {
      if (!account) {
        showGlobalToast("Connect wallet first");
        return;
      }
      setLoading(true);
      setActiveAction("convert");
      const amount =
        convertToken === "USDm"
          ? ethers.parseUnits(convertAmount, 18)
          : ethers.parseEther(convertAmount);
      if (convertToken === "USDm") {
        showGlobalToast("Approve USDm...");
        const { usdc } =
          await getUSDmContractWithSigner();
        const approveTx =
          await usdc.approve(
            GUITARFI_SMART_CONTRACT,
            amount
          );
        await approveTx.wait();
        showGlobalToast("Converting USDm to GTR...");
        const { contract } =
          await getContractWithSigner();
        const tx =
          await contract.convertUSDMToGTR(
            amount
          );
        await tx.wait();
      }
      else {
        showGlobalToast("Converting CELO to GTR...");
        const { contract } =
          await getContractWithSigner();
        const tx =
          await contract.convertCELOToGTR({
            value: amount,
          });
        await tx.wait();
      }
      showGlobalToast(
        `Successfully converted ${convertAmount} ${convertToken} to GTR 🎸`
      );
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.shortMessage ??
        err?.message ??
        "Conversion failed"
      );
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }


  async function connectWallet() {
    try {
      setStatus(null);
      const eth = getEthereum();
      if (!eth) {
        showGlobalToast("Please install MetaMask.");
        return;
      }
      if ((window as any).ethereum?.isMiniPay) {
        console.log("Connecting via MiniPay...");
      }
      const accounts: string[] = await eth.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length === 0) {
        showGlobalToast("No account selected.");
        return;
      }
      setAccount(accounts[0]);
      await ensureCeloNetwork();
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showGlobalToast(err.message ?? "Failed to connect wallet.");
    }
  }

  async function refreshData(): Promise<{ pending: bigint | null } | void> {
    if (!account) return;
    try {
      setLoading(true);
      setStatus(null);
      await ensureCeloNetwork();
      const { contract } = await getReadOnlyContract();
      const [
        st,
        hs,
        pt,
        isPaused,
        tEarned,
        nft1,
        nft2,
        nft3,
        nft4,
        nft5,
        nft31,
      ] = await Promise.all([
        contract.streak(account),
        contract.highestStreak(account),
        contract.pendingTokens(account),
        contract.paused(),
        contract.totalEarnedTokens(account),
        contract.pendingNFTs(account, 1),
        contract.pendingNFTs(account, 2),
        contract.pendingNFTs(account, 3),
        contract.pendingNFTs(account, 4),
        contract.pendingNFTs(account, 5),
        contract.pendingNFTs(account, 31),
      ]);
      setStreak(st);
      setHighestStreak(hs);
      setPendingTokens(pt);
      setPendingRewards(formatToken(pt));
      setPaused(isPaused);
      setpendingNFT1(nft1);
      setpendingNFT2(nft2);
      setpendingNFT3(nft3);
      setpendingNFT31(nft31);
      setTotalEarned(tEarned);
      return { pending: pt };
    } catch (err: any) {
      console.error(err);
      showGlobalToast(err.message ?? "Failed to load data.");
    } finally {
      setLoading(false);
    }
  }

  async function loadNFTBalances() {
    if (!account) return;
    try {
      setLoadingNFTs(true);
      const eth = getEthereum();
      if (!eth) return;
      const provider =
        new ethers.BrowserProvider(eth);
      const nftContract =
        new ethers.Contract(
          GUITARFI_BADGES_CONTRACT,
          GUITARFI_BADGES_ABI,
          provider
        );
      const balances: Record<number, number> = {};
      for (let id = 1; id <= 31; id++) {
        const bal =
          await nftContract.balanceOf(
            account,
            id
          );
        balances[id] = Number(bal);
      }
      setNftBalances(balances);
    } catch (err) {
      console.error(
        "NFT load failed",
        err
      );
    }
    finally {
      setLoadingNFTs(false);
    }
  }

  const tunes = [
    {
      name: "Midnight Between US",
      file: "/music/tune-1.mp3",
    },
    {
      name: "Your Name In The Rain",
      file: "/music/tune-2.mp3",
    },
    {
      name: "Coffee Cups",
      file: "/music/tune-3.mp3",
    },
    {
      name: "Satellites & Slow Dancing Lights",
      file: "/music/tune-4.mp3",
    },
    {
      name: "The Side Of The Bed You Left Cold",
      file: "/music/tune-5.mp3",
    },
    {
      name: "Between Your Heart & Mine",
      file: "/music/tune-6.mp3",
    },
    {
      name: "When The World Gets Quiet",
      file: "/music/tune-7.mp3",
    },
    {
      name: "I Loved You In The Smallest Things",
      file: "/music/tune-8.mp3",
    },
    {
      name: "We Were Almost Forever",
      file: "/music/tune-9.mp3",
    },
    {
      name: "Seen At 2:17 AM",
      file: "/music/tune-10.mp3",
    },
    {
      name: "You Make Ordinary Days Feel Golden",
      file: "/music/tune-11.mp3",
    },
    {
      name: "Stealing Sunsets With You",
      file: "/music/tune-12.mp3",
    },
    {
      name: "You Turn My Heart Into Summer",
      file: "/music/tune-13.mp3",
    },
    {
      name: "We Don’t Talk Anymore",
      file: "/music/tune-14.mp3",
    },
  ];

  async function handlePlayTune() {
    try {

      if (!account) {
        showGlobalToast("Connect wallet first");
        return;
      }
      if (!hasIdentityNFT) {
        setShowIdentityRequired(true);
        return;
      }
      setLoading(true);
      const { contract } =
        await getContractWithSigner();
      const { contract: tokenContract } =
        await getTokenContractWithSigner();
      const tuneCost =
        ethers.parseUnits("50", 18);
      const allowance =
        await tokenContract.allowance(
          account,
          GUITARFI_SMART_CONTRACT
        );
      if (allowance < tuneCost) {
        showGlobalToast(
          "Approve GTR..."
        );
        const approveTx =
          await tokenContract.approve(
            GUITARFI_SMART_CONTRACT,
            ethers.MaxUint256
          );
        await approveTx.wait();
      }
      showGlobalToast(
        "Playing tune onchain..."
      );
      const tx =
        await contract.playTune();
      await tx.wait();
      const random =
        tunes[Math.floor(
          Math.random() * tunes.length
        )];
      setCurrentTune(random.name);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = new Audio(random.file);
      audioRef.current.onended = () => {
        setTunePlaying(false);
        setCurrentTune("");
      };
      await audioRef.current.play();
      setTunePlaying(true);
      await refreshData();
      showGlobalToast(
        "Tune played & NFT unlocked"
      );
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.info?.error?.message ??
        err?.shortMessage ??
        err?.message ??
        "";
      if (msg.includes("Mint Identity First")) {
        setShowIdentityRequired(true);
        return;
      }
      showGlobalToast(msg || "Play failed.");
      setTunePlaying(false);
    }
    finally {
      setLoading(false);

    }
  }
 
  async function handleCheckIn() {
    try {
      if (!account) {
        showGlobalToast("Connect your wallet first.");
        return;
      }
      setLoading(true);
      setActiveAction("gm");
      showGlobalToast("Sending Gm transaction...");
      const prevPending = pendingTokens ?? BigInt(0);
      await ensureCeloNetwork();
      const { contract } = await getContractWithSigner();
      const tx = await contract.checkIn();
      await tx.wait();
      showGlobalToast("Gm confirmed");
      const result = await refreshData();
      const newPending =
        result?.pending ?? pendingTokens ?? BigInt(0);
      setPendingTokens(newPending);
      const key = getStorageKey(account);
      try {
        window.localStorage.setItem(key, getTodayId());
      } catch {
      }
      setHasCheckedInToday(true);
      await new Promise((r) => setTimeout(r, 300));
      const diff = newPending - prevPending;
      if (diff > BigInt(0)) {
       
      } else {
        
      }
      triggerAvatarRun(badgeProgress);
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.info?.error?.message ??
        err?.shortMessage ??
        err?.message ??
        "";
      if (msg.includes("Mint Identity First")) {
        setShowIdentityRequired(true);
        return;
      }
      showGlobalToast(msg || "Gm failed.");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  async function handleTap() {
    try {
      if (!account) {
        showGlobalToast("Connect wallet first");
        return;
      }
      setLoading(true);
      setActiveAction("tap");
      const { contract } =
        await getContractWithSigner();
      setStatus("Confirm tap...");
      const tx = await contract.tap();
      await tx.wait();
      showGlobalToast(
        "Tap successful 🎸 +0.01 GTR"
      );
      await refreshData();
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.info?.error?.message ??
        err?.shortMessage ??
        err?.message ??
        "";
      if (msg.includes("Mint Identity First")) {
        setShowIdentityRequired(true);
        return;
      }
      showGlobalToast(msg || "Tap failed.");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  function triggerAvatarRun(badgeProgress: number) {
    const runner = document.getElementById("avatar-runner");
    if (!runner) return;
    runner.style.setProperty("--target-x", `${badgeProgress * 100}%`);
    runner.classList.remove("hidden");
    runner.style.animation = "avatar-run 1s ease-out forwards";
    const originals = document.querySelectorAll("[data-avatar-main]");
    originals.forEach((el) => {
      (el as HTMLElement).style.opacity = "0";
    });
  }

  async function handleClaimAll() {
    try {
      if (!account) {
        showGlobalToast("Connect your wallet first.");
        return;
      }
      const hasTokens =
        (pendingTokens ?? BigInt(0)) > BigInt(0);
      const hasBadges =
        (pendingNFT1 ?? BigInt(0)) > BigInt(0) ||
        (pendingNFT2 ?? BigInt(0)) > BigInt(0) ||
        (pendingNFT3 ?? BigInt(0)) > BigInt(0) ||
        (pendingNFT31 ?? BigInt(0)) > BigInt(0);
      if (!hasTokens && !hasBadges) {
        showGlobalToast("Nothing to claim right now.");
        return;
      }
      setLoading(true);
      setActiveAction("claim");
      setStatus("Sending claim transaction...");
      const claimAmount = pendingTokens;
      await ensureCeloNetwork();
      const { contract } = await getContractWithSigner();
      let tx;
      if (hasTokens && hasBadges) {
        tx = await contract.claimAll();
      }
      else if (hasTokens) {
        tx = await contract.claimTokens();
      }
      else if (hasBadges) {
        tx = await contract.claimAllNFTs();
      }
      await tx.wait();
      setPendingTokens(BigInt(0));
      setpendingNFT1(BigInt(0));
      setpendingNFT2(BigInt(0));
      setpendingNFT3(BigInt(0));
      setpendingNFT31(BigInt(0));
      showGlobalToast("Claim successful 🎉");
      setRecentlyClaimed(true);
      await refreshData();
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.info?.error?.message ??
        err?.shortMessage ??
        err?.message ??
        "Claim failed."
      );
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  async function loadIdentity() {
    try {
      if (!account) return;
      const { contract } =
        await getIdentityReadOnlyContract();
      const tokenId =
        await contract.mintedToken(account);
      if (
        !tokenId ||
        tokenId === BigInt(0)
      ) {
        setHasIdentity(false);
        return;
      }
      setIdentityTokenId(
        Number(tokenId)
      );
      setHasIdentity(true);
      const uri =
        await contract.tokenURI(tokenId);
      setIdentityURI(uri);
      const res =
        await fetch(uri);
      const metadata =
        await res.json();
      setIdentityMetadata(metadata);
      if (metadata.image) {
        setIdentityImage(metadata.image);
      }
    } catch (err) {
      console.error(
        "Identity load failed",
        err
      );
    }
  }
  const rewardTier = getRewardTier(pendingTokens);

  function getRewardTier(amount: bigint | null) {
    if (!amount || amount === BigInt(0)) return "none";

    // thresholds (tune later)
    const small = BigInt(5) * BigInt(1e18);
    const big = BigInt(50) * BigInt(1e18);

    if (amount < small) return "low";
    if (amount < big) return "mid";
    return "big";
  }
  function handleSelectDonation(amount: number) {
    setDonationAmount(amount.toString());
  }

  async function handleDonateClick() {
    try {
      if (!account) {
        showGlobalToast("Connect your wallet first.");
        return;
      }
      const raw = donationAmount.trim();
      const amountNumber = Number(raw);
      if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
        showGlobalToast("Enter a valid donation amount.");
        return;
      }
      const amountScaled = ethers.parseUnits(raw, 18);
      setLoading(true);
      await ensureCeloNetwork();
      showGlobalToast("Approve USDm in wallet...");
      const { usdc } = await getUSDmContractWithSigner();
      const approveTx = await usdc.approve(
        amountScaled
      );
      await approveTx.wait();
      setStatus("Confirm donation in wallet...");
      const eth = getEthereum();
      if (!eth) throw new Error("Wallet not found");
      const provider = new ethers.BrowserProvider(eth as any);
      const signer = await provider.getSigner();
      const donationContract = new ethers.Contract(
        "0x33FAF6C82003cCEA6a3F4A1d1e9ab9CB7DC40FD4",
        ["function donate(uint256 amount)"],
        signer
      );
      const donateTx = await donationContract.donate(amountScaled);
      await donateTx.wait();
      showGlobalToast("Donation successful 💙");
      await loadDonationLeaderboard();
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.info?.error?.message ??
        err?.shortMessage ??
        err?.message ??
        "Donation failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVaultDeposit() {
    try {
      if (!account) {
        showGlobalToast("Connect wallet first");
        return;
      }
      const amountScaled = ethers.parseUnits(vaultAmount, 18);
      setVaultAction("deposit");
      setLoading(true);
      const { usdc } = await getUSDmContractWithSigner();
      showGlobalToast("Approve USDm...");
      const approveTx = await usdc.approve(
        "0x33FAF6C82003cCEA6a3F4A1d1e9ab9CB7DC40FD4",
        amountScaled
      );
      await approveTx.wait();
      setStatus("Deposit confirmation...");
      const { contract } = await getVaultContractWithSigner();
      const tx = await contract.deposit(amountScaled);
      await tx.wait();
      showGlobalToast("Vault deposit successful 💎");
      await loadVaultData();
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.shortMessage ??
        err?.message ??
        "Deposit failed"
      );
    } finally {
      setLoading(false);
    }
  }

  function showGlobalToast(message: string) {
    setGlobalToast(message);
    setTimeout(() => {
      setGlobalToast(null);
    }, 2500);

  }

  async function handleCeloVaultDeposit() {
    try {
      if (!account) {
        showGlobalToast("Connect wallet first");
        return;
      }
      setVaultAction("deposit");
      setLoading(true);
      const amount =
        ethers.parseEther(
          vaultAmount
        );
      const { contract } =
        await getVaultContractWithSigner();
      const tx =
        await contract.depositCelo({
          value: amount,
        });
      await tx.wait();
      setGlobalToast(
        "CELO deposited successfully"
      );
      await loadVaultData();
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.shortMessage ??
        err?.message ??
        "Deposit failed"
      );
    } finally {
      setLoading(false);
      setVaultAction(null);

    }
  }

  async function handleCeloVaultWithdraw() {
    try {
      if (!account) {
        showGlobalToast("Connect wallet first");
        return;
      }
      setVaultAction("withdraw");
      setLoading(true);
      const amount =
        ethers.parseEther(
          vaultAmount
        );
      const { contract } =
        await getVaultContractWithSigner();
      const tx =
        await contract.withdrawCelo(
          amount
        );
      await tx.wait();
      setGlobalToast(
        "CELO withdrawn successfully"
      );
      await loadVaultData();
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.shortMessage ??
        err?.message ??
        "Withdraw failed"
      );
    } finally {
      setLoading(false);
      setVaultAction(null);
    }
  }

  async function handleVaultWithdraw() {
    try {
      if (!account) {
        showGlobalToast("Connect wallet first");
        return;
      }
      const amountScaled = ethers.parseUnits(vaultAmount, 18);
      setVaultAction("withdraw");
      setLoading(true);
      const { contract } = await getVaultContractWithSigner();
      const tx = await contract.withdraw(amountScaled);
      await tx.wait();
      showGlobalToast("Withdraw successful 💸");
      await loadVaultData();
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.shortMessage ??
        err?.message ??
        "Withdraw failed"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleShare() {
    const APP_URL = "https://guitarfi.vercel.app/";
    const text =
      "GuitarFi\n\n" +
      "Building a daily habit on Celo. Onchain music, trade assets, earning GTR.\n\n" +
      "Join the journey 👇";
    try {
      if (navigator.share) {
        await navigator.share({
          title: "GuitarFi",
          text,
          url: APP_URL,
        });
      } else {
        await navigator.clipboard.writeText(
          text + "\n" + APP_URL
        );
        alert("Link copied! Share it anywhere 🚀");
      }
    } catch (err) {
      console.error("Share failed", err);
    }
  }

  async function handleDevMint() {
    try {
      setDevRunning(true);
      const { contract } = await getTokenContractWithSigner();
      const tx = await contract.mint(
        devMintAddress,
        ethers.parseUnits(devMintAmount, 18)
      );
      await tx.wait();
      showGlobalToast("Mint successful ✅");
    } catch (err: any) {
      console.error(err);
      showGlobalToast(err.message ?? "Mint failed");
    } finally {
      setDevRunning(false);
    }
  }

  async function handleDevBurn() {
    try {
      setDevRunning(true);
      const burnAmount = ethers.parseUnits(
        devBurnAmount,
        18
      );
      const burnCount = Number(devBurnCount);
      showGlobalToast(
        `Starting ${burnCount} burns...`
      );
      const res = await fetch(
        "/api/dev-burn-flood",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: burnAmount.toString(),
            count: burnCount,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error || "Burn failed"
        );
      }
      showGlobalToast(
        `Success: ${data.total} burns`
      );
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.message || "Burn failed"
      );
    } finally {
      setDevRunning(false);
    }
  }


  async function handleDevClaim() {
    try {
      setDevRunning(true);
      const { contract } = await getTokenContractWithSigner();
      const tx = await contract.claim(
        devClaimAddress,
        ethers.parseUnits(devClaimAmount, 18)
      );
      await tx.wait();
      showGlobalToast("Claim successful ✅");
    } catch (err: any) {
      console.error(err);
      showGlobalToast(err.message ?? "Claim failed");
    } finally {
      setDevRunning(false);
    }
  }

  async function handleDevReverse() {
    try {
      setDevRunning(true);
      const { contract } = await getContractWithSigner();
      const tx = await contract.reverse(
        devReverseToken,
        ethers.parseUnits(devReverseAmount, 18)
      );
      await tx.wait();
      showGlobalToast("Reverse successful ✅");
    } catch (err: any) {
      console.error(err);
      showGlobalToast(err.message ?? "Reverse failed");
    } finally {
      setDevRunning(false);
    }
  }

  async function handleDevMultiSend() {
    try {
      setDevRunning(true);
      const recipients = devMultiAddresses
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean);
      const amounts = devMultiAmounts
        .split("\n")
        .map((x) => ethers.parseUnits(x.trim(), 18));
      if (recipients.length !== amounts.length) {
        throw new Error("Address & amount count mismatch");
      }
      const { contract } = await getTokenContractWithSigner();
      const tx = await contract.multiSend(
        recipients,
        amounts
      );
      await tx.wait();
      showGlobalToast("MultiSend successful ✅");
    } catch (err: any) {
      console.error(err);
      showGlobalToast(err.message ?? "MultiSend failed");
    } finally {
      setDevRunning(false);
    }
  }

  async function handleDevWithdrawUSDM() {
    try {
      setDevRunning(true);
      const { contract } =
        await getContractWithSigner();
      const tx =
        await contract.withdrawUSDM(
          ethers.parseUnits(
            devWithdrawUSDM,
            18
          )
        );
      await tx.wait();
      showGlobalToast(
        "USDm withdrawn successfully ✅"
      );
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.message ??
        "USDm withdraw failed"
      );
    } finally {
      setDevRunning(false);
    }
  }

  async function handleDevWithdrawCELO() {
    try {
      setDevRunning(true);
      const { contract } =
        await getContractWithSigner();
      const tx =
        await contract.withdrawCELO(
          ethers.parseEther(
            devWithdrawCELO
          )
        );
      await tx.wait();
      showGlobalToast(
        "CELO withdrawn successfully ✅"
      );
    } catch (err: any) {
      console.error(err);
      showGlobalToast(
        err?.message ??
        "CELO withdraw failed"
      );
    } finally {
      setDevRunning(false);
    }
  }

  async function loadVaultData() {
    try {
      if (!account) return;
      const { contract } = await getVaultReadOnlyContract();
      const [
        vaultBal,
        userBal,
        userCeloBal
      ] = await Promise.all([
        contract.getVaultBalance(),
        contract.getUserBalance(account),
        contract.getUserCeloBalance(account),
      ]);
      const provider =
        new ethers.JsonRpcProvider(
          "https://forno.celo.org"
        );
      const contractCeloBalance =
        await provider.getBalance(
          CELODAILY_VAULT_CONTRACT
        );
      setCeloVaultBalance(
        ethers.formatEther(
          contractCeloBalance
        )
      );
      setUserCeloVaultBalance(
        ethers.formatEther(
          userCeloBal
        )
      );
      setVaultBalance(
        ethers.formatUnits(vaultBal, 18)
      );
      setUserVaultBalance(
        ethers.formatUnits(userBal, 18)
      );
    } catch (err) {
      console.error("Vault load failed", err);
    }
  }

  async function loadDonationLeaderboard() {
    try {
      const provider = new ethers.JsonRpcProvider(
        "https://forno.celo.org"
      );
      const iface = new ethers.Interface([
        "event Donation(address indexed donor, uint256 amount, uint256 timestamp)"
      ]);
      const donationTopic = ethers.id("Donation(address,uint256,uint256)");
      const logs = await provider.getLogs({
        topics: [donationTopic],
        fromBlock: BigInt(0),
        toBlock: "latest",
      });
      const totals: Record<string, number> = {};
      for (const log of logs) {
        const parsed = iface.decodeEventLog("Donation", log.data, log.topics);
        const donor = (parsed.donor as string).toLowerCase();
        const amount = Number(
          ethers.formatUnits(parsed.amount as bigint, 18)
        );
        totals[donor] = (totals[donor] ?? 0) + amount;
      }
      const entries = Object.entries(totals)
        .map(([address, total]) => ({ address, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
      setTopSupporters(entries);
    } catch (err) {
      console.error("Failed to load on-chain leaderboard", err);
    }
  }

  const unclaimedReadable =
    pendingTokens !== null ? formatToken(pendingTokens) : null;
  const streakNumber = streak ? Number(streak) : 0;
  const highestNumber = highestStreak ? Number(highestStreak) : 0;
  const pendingNFT1Count = pendingNFT1 ? Number(pendingNFT1) : 0;
  const pendingNFT2Count = pendingNFT2 ? Number(pendingNFT2) : 0;
  const pendingNFT3Count = pendingNFT3 ? Number(pendingNFT3) : 0;
  const pendingNFT31Count = pendingNFT31 ? Number(pendingNFT31) : 0;
  const hasUnclaimedBadges =
    pendingNFT1Count > 0 ||
    pendingNFT2Count > 0 ||
    pendingNFT3Count > 0 ||
    pendingNFT31Count > 0;
  const baseEarned =
    totalEarned ? Number(formatToken(totalEarned)) : 0;
  const bonusEarned = 0;
  const correctedTotalEarned =
    baseEarned + bonusEarned;
  const totalEarnedReadable =
    correctedTotalEarned.toLocaleString();
  const glassCard =
    "rounded-3xl bg-white/10 dark:bg-slate-900/25 backdrop-blur-[0.5px] "
  "border border-white/15 dark:border-white/10 " +
    "shadow-[0_20px_50px_rgba(0,0,0,0.45)]";
  function getBadgeProgress(streak: number) {
    if (streak <= 0) return 0.05;
    const silver = 7;
    const gold = 15;
    const diamond = 30;
    const legendary = 100;
    const pStart = 0.05;
    const pSilver = 0.28;
    const pGold = 0.52;
    const pDiamond = 0.74;
    const pLegendary = 0.92;
    // 0 → 7 (fast + visible)
    if (streak < silver) {
      return (
        pStart +
        (streak / silver) * (pSilver - pStart)
      );
    }
    if (streak < gold) {
      return (
        pSilver +
        ((streak - silver) / (gold - silver)) * (pGold - pSilver)
      );
    }
    if (streak < diamond) {
      return (
        pGold +
        ((streak - gold) / (diamond - gold)) * (pDiamond - pGold)
      );
    }
    if (streak < legendary) {
      return (
        pDiamond +
        ((streak - diamond) / (legendary - diamond)) *
        (pLegendary - pDiamond)
      );
    }
    return pLegendary;
  }
  const badgeProgress = getBadgeProgress(streakNumber);
  const estimatedGTR =
    convertToken === "USDm"
      ? (Number(convertAmount || 0) * 1000)
      : (Number(convertAmount || 0) * 100);
  const additionalNFTs = [
    {
      id: 3,
      name: "Crimson Flame Guitar",
      image: "/nfts/crimson-flame-guitar.jpeg",
    },
    {
      id: 4,
      name: "Midnight Shadow Guitar",
      image: "/nfts/midnight-shadow-guitar.jpeg",
    },
    {
      id: 5,
      name: "Sapphire Wave Guitar",
      image: "/nfts/sapphire-wave-guitar.jpeg",
    },
    {
      id: 6,
      name: "Emerald Echo Guitar",
      image: "/nfts/emerald-echo-guitar.jpeg",
    },
    {
      id: 7,
      name: "Frostbite Guitar",
      image: "/nfts/frostbite-guitar.jpeg",
    },
    {
      id: 8,
      name: "Thunderstrike Guitar",
      image: "/nfts/thunderstrike-guitar.jpeg",
    },
    {
      id: 9,
      name: "Solar Blaze Guitar",
      image: "/nfts/solar-blaze-guitar.jpeg",
    },
    {
      id: 10,
      name: "Lunar Melody Guitar",
      image: "/nfts/lunar-melody-guitar.jpeg",
    },
    {
      id: 11,
      name: "Crystal Harmony Guitar",
      image: "/nfts/crystal-harmony-guitar.jpeg",
    },
    {
      id: 12,
      name: "Neon Pulse Guitar",
      image: "/nfts/neon-pulse-guitar.jpeg",
    },
    {
      id: 13,
      name: "Obsidian Rift Guitar",
      image: "/nfts/obsidian-rift-guitar.jpeg",
    },
    {
      id: 14,
      name: "Ivory Dream Guitar",
      image: "/nfts/ivory-dream-guitar.jpeg",
    },
    {
      id: 15,
      name: "Mystic Resonance Guitar",
      image: "/nfts/mystic-resonance-guitar.jpeg",
    },
    {
      id: 16,
      name: "Phoenix String Guitar",
      image: "/nfts/phoenix-string-guitar.jpeg",
    },
    {
      id: 17,
      name: "Golden Guitar",
      image: "/nfts/golden.jpeg",
    },
    {
      id: 18,
      name: "Stormbreaker Guitar",
      image: "/nfts/stormbreaker-guitar.jpeg",
    },
    {
      id: 19,
      name: "Velvet Tone Guitar",
      image: "/nfts/velvet-tone-guitar.jpeg",
    },
    {
      id: 20,
      name: "Cosmic Voyager Guitar",
      image: "/nfts/cosmic-voyager-guitar.jpeg",
    },
    {
      id: 21,
      name: "Inferno Riff Guitar",
      image: "/nfts/inferno-riff-guitar.jpeg",
    },
    {
      id: 22,
      name: "Arctic Whisper Guitar",
      image: "/nfts/arctic-whisper-guitar.jpeg",
    },
    {
      id: 23,
      name: "Royal Sapphire Guitar",
      image: "/nfts/royal-sapphire-guitar.jpeg",
    },
    {
      id: 24,
      name: "Celestial Harmony Guitar",
      image: "/nfts/celestial-harmony-guitar.jpeg",
    },
    {
      id: 25,
      name: "Dragonfire Guitar",
      image: "/nfts/dragonfire-guitar.jpeg",
    },
    {
      id: 26,
      name: "Ocean Spirit Guitar",
      image: "/nfts/ocean-spirit-guitar.jpeg",
    },
    {
      id: 27,
      name: "Starlight Symphony Guitar",
      image: "/nfts/starlight-symphony-guitar.jpeg",
    },
    {
      id: 28,
      name: "Shadowcaster Guitar",
      image: "/nfts/shadowcaster-guitar.jpeg",
    },
    {
      id: 29,
      name: "Eternal Echo Guitar",
      image: "/nfts/eternal-echo-guitar.jpeg",
    },
    {
      id: 30,
      name: "Galaxy Resonance Guitar",
      image: "/nfts/galaxy-resonance-guitar.jpeg",
    },
  ];
  return (
    <main
      className={`min-h-screen flex flex-col relative overflow-hidden ${isDarkMode ? "text-slate-50" : "text-slate-900"
        }`}
    >
      {isDarkMode ? (
        <div className="starfield-bg absolute inset-0 -z-10">
          <div id="stars" />
          <div id="stars2" />
          <div id="stars3" />
        </div>
      ) : (
        <div className="basedaily-day-bg absolute inset-0 -z-10" />
      )}
      <div
        className={`absolute inset-0 pointer-events-none ${isDarkMode ? "bg-slate-950/65" : "bg-white/65"
          }`}
      />
      {/* content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-10 pt-6 flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full overflow-hidden flex items-center justify-center">
              <img
                src={isDarkMode ? "/logo-0x.jpg" : "/logo-0x-day.jpg"}
                alt="0x logo"
                className="h-full w-full object-contain transition-opacity duration-200"
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span
                className={`text-base font-semibold tracking-tight ${isDarkMode ? "text-sky-100" : "text-slate-900"
                  }`}
              >
                GuitarFi
              </span>
              <span
                className={`text-[11px] ${isDarkMode ? "text-slate-300" : "text-slate-700"
                  } ${taglineAnim ? "animate-[fade-up_0.6s_ease-out]" : ""}`}
              >
                Building a daily habit on Celo
              </span>
            </div>
          </div>
          <div className="shrink-0 ml-auto mr-4">
            {account ? (
              <div className="flex flex-col items-end gap-1 pr-2">
                {/* Wallet + Celo */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500">Wallet</span>
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {isMiniPay ? "MiniPay" : "Celo"}
                  </span>
                </div>
                {/* address */}
                <span className="text-[11px] px-2 py-1 rounded-full bg-slate-950/70 text-slate-100 mt-0.5">
                  {account.slice(0, 4)}…{account.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="
        px-3 py-1.5
        rounded-full
        text-[11px] font-semibold
        bg-sky-500/90
        text-slate-950
        shadow-md
        hover:bg-sky-400
        active:scale-95
        transition
      "
              >
                Connect
              </button>
            )}
          </div>
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className="toggle"
          >
            <div
              id="bar1"
              className={`bars ${drawerOpen ? "bar1-open" : ""}`}
            />
            <div
              id="bar2"
              className={`bars ${drawerOpen ? "bar2-open" : ""}`}
            />
            <div
              id="bar3"
              className={`bars ${drawerOpen ? "bar3-open" : ""}`}
            />
          </button>
        </header>
        <div
          className="
    grid
    grid-cols-1
    lg:grid-cols-3
    gap-6
    mt-6
    items-start
  "
        >
          {/* Welcome / wallet card */}
          <section
            className={`
    
              p-4 space-y-3
    ${isDarkMode ? glassCard : ""}
  `}
          >
            {/* top row */}
            <div className="flex items-start justify-between gap-3">
              {/* left text */}
              <div className="flex-1">
                <TodayMessageLoop
                  isDarkMode={isDarkMode}
                  account={account}
                />
              </div>
            </div>
            <div className="mt-4 relative min-h-[70px]">
              <button
                onClick={() => {
                  setShowTradeMenu(!showTradeMenu);
                  setShowExploreMenu(false);
                }}
                className={`
inline-flex
items-center
gap-3
rounded-2xl
px-5 py-3
transition-all
duration-300
${showTradeMenu
                    ? `
      bg-gradient-to-r
      from-sky-500/20
      to-indigo-500/20
      border border-sky-400/40
      text-sky-300
      shadow-[0_0_20px_rgba(56,189,248,0.25)]
    `
                    : `
      bg-slate-900/80
      border border-white/10
      text-slate-100
      hover:bg-slate-800
    `
                  }
`}
              >
                <span className="font-semibold">
                  Trade
                </span>
                <span>
                  {showTradeMenu ? "−" : "+"}
                </span>
              </button>
              {showTradeMenu && (
                <div
                  className="
      absolute
      left-[180px]
      top-0
      z-50
      flex flex-col gap-2
      animate-[fade-up_0.25s_ease-out]
    "
                >
                  <button
                    onClick={() => {
                      setShowConvertModal(true);
                      setShowTradeMenu(false);
                    }}
                    className="
  rounded-xl
  px-4 py-2
  min-w-[120px]
  text-[13px]
  text-left
  bg-slate-900/60
  border border-white/5
  hover:bg-slate-800/80
  hover:translate-x-1
  transition-all
  duration-200
"
                  >
                    Convert to GTR
                  </button>
                  <button
                    onClick={() => {
                      setShowVault(true);
                      setShowExploreMenu(false);
                    }}
                    className="
  rounded-xl
  px-4 py-2
  min-w-[120x]
  text-[13px]
  text-left
  bg-slate-900/60
  border border-white/5
  hover:bg-slate-800/80
  hover:translate-x-1
  transition-all
  duration-200
"
                  >
                    Deposit USDm
                  </button>
                  <button
                    onClick={() => {
                      setShowCeloVault(true);
                      setShowTradeMenu(false);
                    }}
                    className="
  rounded-xl
  px-4 py-2
  min-w-[120px]
  text-[13px]
  text-left
  bg-slate-900/60
  border border-white/5
  hover:bg-slate-800/80
  hover:translate-x-1
  transition-all
  duration-200
"
                  >
                    Deposit Celo
                  </button>
                </div>
              )}
            </div>
            <div className="mt-4 relative">
              <button
                onClick={() => {
                  setShowExploreMenu(!showExploreMenu);
                  setShowTradeMenu(false);
                }}
                className={`
inline-flex
items-center
gap-3
rounded-2xl
px-5 py-3
transition-all
duration-300
${showExploreMenu
                    ? `
      bg-gradient-to-r
      from-violet-500/20
      to-fuchsia-500/20
      border border-violet-400/40
      text-violet-300
      shadow-[0_0_20px_rgba(168,85,247,0.25)]
    `
                    : `
      bg-slate-900/80
      border border-white/10
      text-slate-100
      hover:bg-slate-800
    `
                  }
`}
              >
                <span className="font-semibold">
                  Explore
                </span>
                <span>
                  {showExploreMenu ? "−" : "+"}
                </span>
              </button>
              {showExploreMenu && (
                <div
                  className="
      absolute
      left-[180px]
      -top-[65px]
      z-50
      flex flex-col gap-2
      animate-[fade-up_0.25s_ease-out]
    "
                >

                  <button
                    onClick={() => {
                      setExpandedCollection(true);
                      setShowCollectionsModal(true);
                      setShowExploreMenu(false);
                      loadNFTBalances();
                    }}
                    className="
  rounded-xl
  px-4 py-2
  min-w-[120px]
  text-[13px]
  text-left
  bg-slate-900/60
  border border-white/5
  hover:bg-slate-800/80
  hover:translate-x-1
  transition-all
  duration-200
"
                  >
                    Collections
                  </button>
                  <button
                    onClick={() => {
                      setShowMintIdentity(true);
                      setShowExploreMenu(false);
                    }}
                    className="
  rounded-xl
  px-4 py-2
  min-w-[120px]
  text-[13px]
  text-left
  bg-slate-900/60
  border border-white/5
  hover:bg-slate-800/80
  hover:translate-x-1
  transition-all
  duration-200
"
                  >
                    Identity
                  </button>
                  <button
                    onClick={() => {
                      setShowDonate(true);
                      setShowExploreMenu(false);
                    }}
                    className="
  rounded-xl
  px-4 py-2
  min-w-[120px]
  text-[13px]
  text-left
  bg-slate-900/60
  border border-white/5
  hover:bg-slate-800/80
  hover:translate-x-1
  transition-all
  duration-200
"
                  >
                    Donate
                  </button>
                </div>
              )}
            </div>
            <div className="pointer-events-none absolute inset-0 overflow-visible">
              <div className="absolute right-10 bottom-8 text-5xl opacity-10">
                🎸
              </div>
              <span className="music-note note-1">♪</span>
              <span className="music-note note-2">♫</span>
              <span className="music-note note-3">♬</span>
              <span className="music-note note-4">♪</span>
            </div>
          </section>

          <section
            className={`
    tune-zone-card
    relative
    overflow-hidden
    p-4
    ${isDarkMode ? glassCard : ""}
  `}
          >
            <div className="tune-zone-border-spin" />
            <div className="absolute inset-[1px] rounded-[inherit] bg-slate-950 z-[1]" />
            {/* glow */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-sky-500/10 blur-3xl" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <h2
                  className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                >
                  Tune zone
                </h2>
                <span
                  className="
    px-2 py-1
    rounded-full
    text-[10px]
    bg-cyan-500/10
    text-cyan-300
    border border-cyan-400/10
  "
                >
                  ONCHAIN MUSIC
                </span>
              </div>
              <p
                className={`mt-2 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-700"
                  }`}
              >
                Keep your streak alive and let the music grow.
              </p>
              {/* quote */}
              <div
                className="
    mt-4
    rounded-2xl 
    border border-sky-500/20
    bg-slate-950/40
    p-4
    flex flex-col items-center
    gap-3
  "
              >
                <button
                  onClick={handlePlayTune}
                  disabled={loading}
                  className="
  group
  relative
  overflow-hidden
  h-16
  w-full
  rounded-[22px]
  border border-cyan-400/20
  bg-[linear-gradient(135deg,
  rgba(6,182,212,0.12),
  rgba(59,130,246,0.10),
  rgba(15,23,42,0.95))]
  backdrop-blur-xl
  transition-all
  duration-500
  hover:border-cyan-400/40
  hover:shadow-[0_0_40px_rgba(34,211,238,0.18)]
  active:scale-[0.98]
"
                >
                  {/* Glow */}
                  <div
                    className="
    absolute
    inset-0
    opacity-0
    group-hover:opacity-100
    transition
    bg-[radial-gradient(circle_at_center,
    rgba(34,211,238,0.18),
    transparent_65%)]
  "
                  />
                  {/* Moving Shine */}
                  <div
                    className="
    absolute
    inset-0
    -translate-x-[150%]
    group-hover:translate-x-[150%]
    transition-transform
    duration-[1800ms]
    bg-[linear-gradient(
    120deg,
    transparent,
    rgba(255,255,255,0.12),
    transparent)]
  "
                  />
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    <div
                      className="
                      -ml-4.5
      flex
      h-10 w-10
      items-center justify-center
      rounded-full
      bg-cyan-400/10
      border border-cyan-300/20
      text-cyan-300
    "
                    >
                      {tunePlaying ? (
                        <div className="guitarfi-equalizer">
                          <span className="eq-bar"></span>
                          <span className="eq-bar"></span>
                          <span className="eq-bar"></span>
                          <span className="eq-bar"></span>
                        </div>
                      ) : (
                        "▶"
                      )}
                    </div>
                    <div className="play-frame">
                      <span className="left-arrow" />
                      <div className="play-clip">
                        <div className="corner left-top" />
                        <div className="corner right-top" />
                        <div className="corner left-bottom" />
                        <div className="corner right-bottom" />
                        <div className="play-text flex flex-col items-center leading-none">
                          <span>P L A Y</span>
                          <span className="text-[8px] font-medium tracking-normal opacity-70 mt-[6px]">
                            Cost 50 GTR per play
                          </span>
                        </div>
                      </div>
                      <span className="right-arrow" />
                    </div>
                  </div>
                </button>
                <p className="text-xs text-slate-400">
                  Unlock a fresh melody on every play.
                </p>
              </div>
              {/* animated notes */}
              <div className="mt-4 flex items-center gap-3 text-xl">
                <span className="animate-bounce">♪</span>
                <span className="animate-bounce delay-100">♫</span>
                <span className="animate-bounce delay-200">♬</span>
                {currentTune && (
                  <div className="text-xs text-sky-300">
                    Now playing: {currentTune}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Today card */}
          <section
            className={`
    p-4 space-y-3
    ${isDarkMode ? glassCard : ""}
  `}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <CeloBlockLogo
                  checkedIn={hasCheckedInToday}
                  isDark={isDarkMode}
                />
              </h2>
              {/* RIGHT: stats */}
              <div className="flex gap-6 text-center">
                <div>
                  <div
                    className={`text-xl font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"
                      }`}
                  >
                    {streakNumber}
                  </div>
                  <div
                    className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-900"
                      }`}
                  >
                    Current
                  </div>
                </div>
                <div className="relative">
                  <div
                    className={`text-xl font-semibold ${isDarkMode ? "text-sky-300" : "text-sky-500"
                      }`}
                  >
                    {highestNumber}
                  </div>
                  <AvatarBubbleStream
                    avatar={
                      profileAvatar && profileAvatar.startsWith("data:image")
                        ? profileAvatar
                        : "/raihan-avatar.jpg"
                    }
                  />
                  <div
                    className={`text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-900"
                      }`}
                  >
                    Highest
                  </div>
                  {showLeaderboard && (
                    <div
                      className={`
      absolute
      right-3
      top-[58px]
      w-[180px]
      max-h-[120px]
      rounded-xl
      p-2
      text-xs
      overflow-y-auto overflow-visible
      z-20
      ${isDarkMode
                          ? "bg-slate-950/90 text-slate-200"
                          : "bg-white text-slate-900 border border-slate-200 shadow-lg"
                        }
    `}
                    >
                      {leaderboardLoading && <p className="text-slate-400">Loading…</p>}
                      {!leaderboardLoading && leaderboard.length === 0 && (
                        <p className="text-slate-400">No data yet</p>
                      )}
                      <ul className="space-y-2">
                        {leaderboard.map((u, i) => (
                          <li
                            key={u.address}
                            className={`relative flex items-center justify-between ${u.address.toLowerCase() === account?.toLowerCase()
                              ? "you-row-highlight"
                              : ""
                              }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={
                                  u.address.toLowerCase() === account?.toLowerCase()
                                    ? profileAvatar || "/avatar.png"
                                    : u.avatar || "/avatar.png"
                                }
                                className="h-6 w-6 rounded-full object-cover ring-1 ring-sky-400/30"
                              />
                              <span>
                                #{i + 1}{" "}
                                {u.name
                                  ? u.name
                                  : `${u.address.slice(0, 6)}…${u.address.slice(-4)}`}
                              </span>
                            </div>
                            <span
                              className={`
    font-semibold
    ${isDarkMode ? "text-slate-200" : "text-sky-500"}
  `}
                            >
                              {u.highestStreak}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p
              className={`text-xs -mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-900"
                }`}
            >
              {account
                ? hasCheckedInToday
                  ? "You've already checked in today. Come back tomorrow!"
                  : "Tap Gm to unlock today’s GTR reward."
                : "Connect your wallet to start your daily Gm streak."}
            </p>
            {account && (
              <div className="flex justify-center gap-4 mt-2">
                {hasCheckedInToday ? (
                  <div className="flex flex-col items-center gap-1">
                    <button
                      disabled
                      className="
    group
    relative
    overflow-hidden
    w-[132px]
    h-12
    rounded-2xl
    border border-sky-400/25
bg-gradient-to-r
from-sky-500/10
via-cyan-400/10
to-sky-500/10
    backdrop-blur-xl
    transition-all
    duration-500
  shadow-[0_0_20px_rgba(56,189,248,0.15)]
    cursor-not-allowed
  "
                    >
                      <div
                        className="
      absolute inset-0
      -translate-x-full
      group-hover:translate-x-full
      transition-transform
      duration-[1800ms]
      bg-gradient-to-r
      from-transparent
      via-white/20
      to-transparent
    "
                      />
                      <div
                        className="
      absolute inset-0
      opacity-0
      group-hover:opacity-100
      transition-opacity
      duration-500
      bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),transparent_70%)]
    "
                      />
                      <div className="relative z-10 flex items-center justify-center h-full">
                        <span className="font-semibold text-sky-200 tracking-wide">
                          Guitarist
                        </span>
                      </div>
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Next Gm in {getTimeUntilTomorrowUTC()}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={loading || paused === true}
                    className="
    group
    relative
    overflow-hidden
    w-[92px]
    h-12
    rounded-2xl
    border border-sky-400/25
    bg-gradient-to-r
    from-sky-500/10
    via-cyan-400/10
    to-sky-500/10
    backdrop-blur-xl
    transition-all
    duration-500
    hover:border-sky-300/60
    hover:shadow-[0_0_30px_rgba(56,189,248,0.25)]
    active:scale-[0.98]
  "
                  >
                    <div
                      className="
      absolute inset-0
      -translate-x-full
      group-hover:translate-x-full
      transition-transform
      duration-[1800ms]
      bg-gradient-to-r
      from-transparent
      via-white/20
      to-transparent
    "
                    />
                    <div
                      className="
      absolute inset-0
      opacity-0
      group-hover:opacity-100
      transition-opacity
      duration-500
      bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),transparent_70%)]
    "
                    />
                    <div className="relative z-10 flex items-center justify-center h-full">
                      <span className="font-semibold text-slate-100 tracking-wide">
                        {activeAction === "gm"
                          ? "Processing"
                          : "Gm"}
                      </span>
                    </div>
                  </button>
                )}
                <div className="flex flex-col items-center gap-1">
                  <button
                    onClick={handleTap}
                    disabled={loading}
                    className={`
guitarfi-tap-btn
group
relative
border border-white/10
hover:border-sky-400/40
hover:shadow-[0_0_25px_rgba(56,189,248,0.25)]
active:scale-95
${activeAction === "tap" ? "tap-processing-state" : ""}
`}
                  >
                    {activeAction === "tap" ? (
                      <span className="tap-processing">
                        Processing...
                      </span>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 36 36"
                          width="36px"
                          height="36px"
                        >
                          <rect width="36" height="36" x="0" y="0" fill="#38BDF8"></rect>
                          <path
                            fill="#e53935"
                            d="M38.67,42H11.52C11.27,40.62,11,38.57,11,36c0-5,0-11,0-11s1.44-7.39,3.22-9.59 c1.67-2.06,2.76-3.48,6.78-4.41c3-0.7,7.13-0.23,9,1c2.15,1.42,3.37,6.67,3.81,11.29c1.49-0.3,5.21,0.2,5.5,1.28 C40.89,30.29,39.48,38.31,38.67,42z"
                          ></path>
                          <path
                            fill="#b71c1c"
                            d="M39.02,42H11.99c-0.22-2.67-0.48-7.05-0.49-12.72c0.83,4.18,1.63,9.59,6.98,9.79 c3.48,0.12,8.27,0.55,9.83-2.45c1.57-3,3.72-8.95,3.51-15.62c-0.19-5.84-1.75-8.2-2.13-8.7c0.59,0.66,3.74,4.49,4.01,11.7 c0.03,0.83,0.06,1.72,0.08,2.66c4.21-0.15,5.93,1.5,6.07,2.35C40.68,33.85,39.8,38.9,39.02,42z"
                          ></path>
                          <path
                            fill="#212121"
                            d="M35,27.17c0,3.67-0.28,11.2-0.42,14.83h-2C32.72,38.42,33,30.83,33,27.17 c0-5.54-1.46-12.65-3.55-14.02c-1.65-1.08-5.49-1.48-8.23-0.85c-3.62,0.83-4.57,1.99-6.14,3.92L15,16.32 c-1.31,1.6-2.59,6.92-3,8.96v10.8c0,2.58,0.28,4.61,0.54,5.92H10.5c-0.25-1.41-0.5-3.42-0.5-5.92l0.02-11.09 c0.15-0.77,1.55-7.63,3.43-9.94l0.08-0.09c1.65-2.03,2.96-3.63,7.25-4.61c3.28-0.76,7.67-0.25,9.77,1.13 C33.79,13.6,35,22.23,35,27.17z"
                          ></path>
                          <path
                            fill="#01579b"
                            d="M17.165,17.283c5.217-0.055,9.391,0.283,9,6.011c-0.391,5.728-8.478,5.533-9.391,5.337 c-0.913-0.196-7.826-0.043-7.696-5.337C9.209,18,13.645,17.32,17.165,17.283z"
                          ></path>
                          <path
                            fill="#212121"
                            d="M40.739,37.38c-0.28,1.99-0.69,3.53-1.22,4.62h-2.43c0.25-0.19,1.13-1.11,1.67-4.9 c0.57-4-0.23-11.79-0.93-12.78c-0.4-0.4-2.63-0.8-4.37-0.89l0.1-1.99c1.04,0.05,4.53,0.31,5.71,1.49 C40.689,24.36,41.289,33.53,40.739,37.38z"
                          ></path>
                          <path
                            fill="#81d4fa"
                            d="M10.154,20.201c0.261,2.059-0.196,3.351,2.543,3.546s8.076,1.022,9.402-0.554 c1.326-1.576,1.75-4.365-0.891-5.267C19.336,17.287,12.959,16.251,10.154,20.201z"
                          ></path>
                          <path
                            fill="#212121"
                            d="M17.615,29.677c-0.502,0-0.873-0.03-1.052-0.069c-0.086-0.019-0.236-0.035-0.434-0.06 c-5.344-0.679-8.053-2.784-8.052-6.255c0.001-2.698,1.17-7.238,8.986-7.32l0.181-0.002c3.444-0.038,6.414-0.068,8.272,1.818 c1.173,1.191,1.712,3,1.647,5.53c-0.044,1.688-0.785,3.147-2.144,4.217C22.785,29.296,19.388,29.677,17.615,29.677z M17.086,17.973 c-7.006,0.074-7.008,4.023-7.008,5.321c-0.001,3.109,3.598,3.926,6.305,4.27c0.273,0.035,0.48,0.063,0.601,0.089 c0.563,0.101,4.68,0.035,6.855-1.732c0.865-0.702,1.299-1.57,1.326-2.653c0.051-1.958-0.301-3.291-1.073-4.075 c-1.262-1.281-3.834-1.255-6.825-1.222L17.086,17.973z"
                          ></path>
                          <path
                            fill="#e1f5fe"
                            d="M15.078,19.043c1.957-0.326,5.122-0.529,4.435,1.304c-0.489,1.304-7.185,2.185-7.185,0.652 C12.328,19.467,15.078,19.043,15.078,19.043z"
                          ></path>
                        </svg>
                        <span className="now">now!</span>
                        <span className="tap">tap</span>
                      </>
                    )}
                  </button>
                  <span className="text-[11px] text-slate-400">
                    Tap to earn GTR
                  </span>
                </div>
              </div>
            )}
            {paused && (
              <p className="text-[11px] text-amber-300 mt-1">
                The contract is currently paused. Please try again later.
              </p>
            )}
            <div className="relative group inline-flex">
              <div className="relative inline-flex">
                <button
                  className={`text-sm font-semibold flex items-center gap-2 select-none ${isDarkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                  onClick={() => {
                    setShowBadgesTip(true);
                    setTimeout(() => setShowBadgesTip(false), 2000);
                  }}
                >
                  <span className="text-lg"></span> GuitarPath
                </button>
              </div>
            </div>
            {/* progress path */}
            <div className="relative mt-1 mb-2"
              onClick={() => {
                const runner = document.getElementById("avatar-runner");
                if (!runner) return;
                runner.style.setProperty(
                  "--target-x",
                  `${badgeProgress * 100}%`
                );
                runner.classList.remove("hidden");
                runner.style.animation = "avatar-run 1s ease-out forwards";
                // hide original avatar briefly
                const originals = document.querySelectorAll("[data-avatar-main]");
                originals.forEach(el => {
                  (el as HTMLElement).style.opacity = "0";
                });
              }}
            >
              {/* base line */}
              <div className="relative h-[2px] w-full rounded-full bg-slate-700/70 overflow-hidden">
                {/* progress fill */}
                <div
                  className="
      absolute left-0 top-0 h-full
      bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500
      transition-all duration-700 ease-out
               "
                  style={{
                    width: `${badgeProgress * 100}%`,
                  }}
                />
              </div>
              {/* badge icons – SKETCH BASED POSITIONS */}
              <div className="absolute inset-0 -top-3 text-lg">
                <span className="absolute left-[28%] -translate-x-1/2"></span>
                <span className="absolute left-[52%] -translate-x-1/2"></span>
                <span className="absolute left-[74%] -translate-x-1/2"></span>
                <span className="absolute left-[92%] -translate-x-1/2"></span>
              </div>
              {/* avatar progress */}
              <div
                data-avatar-main
                className="absolute -top-5 h-7 w-7 rounded-full ring-2 ring-sky-400 bg-slate-900 overflow-hidden shadow-lg shadow-sky-900 transition-all"
                style={{
                  left: `${badgeProgress * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                <img
                  src={
                    profileAvatar &&
                      profileAvatar.startsWith("data:image")
                      ? profileAvatar
                      : "/raihan-avatar.jpg"
                  }
                  alt="User avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* RUN ANIMATION OVERLAY (visual only) */}
              <div
                id="avatar-runner"
                onAnimationEnd={() => {
                  const runner = document.getElementById("avatar-runner");
                  if (!runner) return;
                  runner.classList.add("hidden");
                  runner.style.animation = "none";
                  const originals = document.querySelectorAll("[data-avatar-main]");
                  originals.forEach(el => {
                    (el as HTMLElement).style.opacity = "1";
                  });
                }}
                className="pointer-events-none absolute -top-8 hidden"
                style={{ left: "5%", transform: "translateX(-50%)" }}
              >
                {/* avatar bubble */}
                <div className="relative h-7 w-7 rounded-full overflow-hidden ring-2 ring-sky-400 bg-slate-900 z-10">
                  <img
                    src={
                      profileAvatar &&
                        profileAvatar.startsWith("data:image")
                        ? profileAvatar
                        : "/raihan-avatar.jpg"
                    }
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* legs — OUTSIDE avatar */}
                <div className="absolute top-[28px] left-1/2 -translate-x-1/2 flex gap-[4px]">
                  <span className="leg leg-left" />
                  <span className="leg leg-right" />
                </div>
              </div>
            </div>
          </section>

          {/* Rewards card */}
          <section
            className={`
    p-4 space-y-3
    ${isDarkMode ? glassCard : ""}
    ${flashGlow ? "ring-2 ring-sky-400 animate-pulse" : ""}
  `}
          >
            <div className="relative group inline-flex">
              <div className="relative inline-flex">
                <button
                  className={`text-sm font-semibold flex items-center gap-2 select-none ${isDarkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                  onClick={() => {
                    setShowRewardsTip(true);
                    setTimeout(() => setShowRewardsTip(false), 2000);
                  }}
                >
                  <span className="text-lg"></span> Rewards
                </button>
                {showRewardsTip && (
                  <div className="absolute z-50 top-full mt-2 w-64 rounded-2xl
                    bg-slate-950/95 backdrop-blur-xl
                    border border-white/10 shadow-2xl
                    px-3 py-2 text-[11px] text-slate-200">
                    <p className="font-semibold text-sky-300 mb-1">How rewards work</p>
                    <ul className="list-disc pl-4 space-y-1 relative">
                      <li>GM once per day</li>
                      <li>Each streak day increases reward (n×1)</li>
                      <li
                        className="relative cursor-pointer text-cyan-300"
                        onClick={() => setShowBadgeTooltip(!showBadgeTooltip)}
                      >
                        Badge milestones unlock collectible Guitar NFTs
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div
                className={`
    flex w-full items-start justify-between
    py-3
    transition-all duration-500
  `}
              >
                {/* LEFT: GTR hero */}
                <div
                  className={`
      flex flex-col
      transition-all duration-500
      ${hasUnclaimedBadges ? "items-start" : "items-center w-full"}
    `}
                >
                  <span
                    className={`
    text-[12px]
    uppercase
    tracking-wide
    flex items-center gap-1
    ${isDarkMode ? "text-slate-400" : "text-slate-900"}
  `}
                  >
                    Unclaimed
                    <span
                      className={`
      font-extrabold
      tracking-tight
      bg-gradient-to-r from-sky-400 to-blue-500
      bg-clip-text text-transparent
      drop-shadow-[0_0_6px_rgba(56,189,248,0.45)]
    `}
                    >
                      GTR
                    </span>
                  </span>
                  <span
                    className={`text-3xl font-bold tracking-tight ${isDarkMode ? "text-sky-200" : "text-sky-500"
                      }`}
                  >
                    {unclaimedReadable ?? "0"}
                  </span>
                </div>
                {/* RIGHT: Unclaimed badges */}
                <div className="flex flex-col items-end gap-1">

                  {/* Badge label + icons ONLY */}
                  <div
                    className={`
      flex flex-col items-end gap-1
      transition-all duration-500
      ${hasUnclaimedBadges ? "" : "opacity-40 grayscale"}
    `}
                  >
                    <span
                      className={`
        text-[12px] uppercase tracking-wide
        transition-all duration-300
        ${hasUnclaimedBadges
                          ? isDarkMode
                            ? "text-slate-400"
                            : "text-slate-900"
                          : isDarkMode
                            ? "text-slate-500"
                            : "text-slate-700"
                        }
      `}
                    >
                      Unclaimed badges
                    </span>
                    <div className="flex items-center gap-2 transition-all duration-500">
                      {pendingNFT1Count > 0
                        ? <BadgeGlow icon="🎸" count={pendingNFT1Count} />
                        : <BadgeGhost icon="🎸" />
                      }
                      {pendingNFT2Count > 0
                        ? <BadgeGlow icon="⚡" count={pendingNFT2Count} />
                        : <BadgeGhost icon="⚡" />
                      }
                      {pendingNFT3Count > 0
                        ? <BadgeGlow icon="🎵" count={pendingNFT3Count} />
                        : <BadgeGhost icon="🎵" />
                      }
                      {pendingNFT31Count > 0
                        ? <BadgeGlow icon="🌌" count={pendingNFT31Count} />
                        : <BadgeGhost icon="🌌" />
                      }
                    </div>
                  </div>
                  {/* ✅ Identity button — ALWAYS LIVE */}
                  <button
                    onClick={() => setShowMintIdentity(true)}
                    className={`
  group
  relative
  isolate
  overflow-hidden
  rounded-2xl
  border
  px-3 py-1.5
  text-[11px]
  font-semibold
  tracking-[0.18em]
  uppercase
  backdrop-blur-3xl
  transition-all
  duration-500
  hover:scale-[1.03]
  ${isDarkMode
                        ? `
        border-white/15
        bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04))]
        text-slate-400
        shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]
        hover:border-white/30
        hover:shadow-[0_15px_45px_rgba(0,0,0,0.55),0_0_25px_rgba(255,255,255,0.12)]
      `
                        : `
        border-sky-300/40
        bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(230,240,255,0.72))]
        text-slate-800
        shadow-[0_10px_30px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.9)]
        hover:border-sky-400/60
        hover:shadow-[0_15px_45px_rgba(56,189,248,0.28)]
      `
                      }
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
`}
                  >
                    {hasIdentityNFT ? "View Identity" : "Mint Identity"}
                  </button>
                  <button
                    onClick={() => setShowVault(true)}
                    className="
    flex h-10 w-10 items-center justify-center
    overflow-hidden
    rounded-2xl
    transition-all
    hover:scale-105
  "
                  >
                    <Image
                      src="/vault.png"
                      alt="Vault"
                      width={55}
                      height={55}
                      className="object-contain"
                    />
                  </button>
                </div>
              </div>
            </div>
            {account && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={handleClaimAll}
                  disabled={
                    !!(
                      loading ||
                      paused ||
                      (
                        (pendingTokens ?? BigInt(0)) === BigInt(0) &&
                        !hasUnclaimedBadges
                      )
                    )
                  }
                  className={`claimButton ${isDarkMode ? "claimButtonDark" : "claimButtonLight"
                    }`}
                >
                  <div className="claimIcon">
                    <Gift
                      size={20}
                      color={isDarkMode ? "white" : "black"}
                    />
                  </div>
                  <span className="claimText">
                    {activeAction === "claim"
                      ? "Processing..."
                      : (
                        (pendingTokens ?? BigInt(0)) > BigInt(0) ||
                        hasUnclaimedBadges
                      )
                        ? "Claim All"
                        : "Claimed"}
                  </span>
                  {/* Shimmer */}
                  {!loading &&
                    (pendingTokens ?? BigInt(0)) > BigInt(0 && (
                      <span
                        className="
          absolute inset-y-0 -left-20 w-16
          bg-white/20 blur-md
          rotate-12
          animate-[shimmer_2.5s_linear_infinite]
        "
                      />
                    ))}
                </button>
              </div>
            )}
          </section>


          <section
            className={`
    p-4 space-y-4
    ${isDarkMode ? glassCard : ""}
  `}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                >
                  CELO Vault
                </h2>
                <p
                  className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  Deposit or withdraw your CELO instantly
                </p>
              </div>
            </div>
            {/* Balance */}
            <div
              className="
    rounded-2xl
    border border-white/10
    bg-slate-950/30
    p-4
  "
            >
              <div className="flex items-center justify-between">
                {/* User Balance */}
                <div className="flex-1 text-center">
                  <p className="text-[11px] text-slate-400">
                    Your Balance
                  </p>
                  <p className="text-lg font-bold text-white mt-1">
                    {userCeloVaultBalance}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    CELO
                  </p>
                </div>
                {/* Divider */}
                <div
                  className="
        h-12
        w-px
        mx-3
        bg-gradient-to-b
        from-transparent
        via-sky-400/40
        to-transparent
      "
                />
                {/* Total Vault */}
                <div className="flex-1 text-center">
                  <p className="text-[11px] text-slate-400">
                    Vault TVL
                  </p>
                  <p className="text-lg font-bold text-sky-300 mt-1">
                    {celoVaultBalance}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    CELO
                  </p>
                </div>
              </div>
            </div>
            {/* Amount */}
            <div>
              <input
                type="number"
                min="0"
                value={vaultAmount}
                onChange={(e) => setVaultAmount(e.target.value)}
                placeholder="Enter amount"
                className="
        w-full
        rounded-2xl
        border border-white/10
        bg-slate-950/40
        px-4 py-3
        text-white
        outline-none
        focus:border-sky-400
      "
              />
            </div>
            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCeloVaultDeposit}
                disabled={loading}
                className="
  group
  relative
  overflow-hidden
  rounded-[20px]
  border border-emerald-400/20
  bg-[linear-gradient(135deg,
  rgba(16,185,129,0.18),
  rgba(5,150,105,0.08),
  rgba(15,23,42,0.95))]
  py-3.5
  transition-all
  duration-500
  hover:border-emerald-400/50
  hover:shadow-[0_0_35px_rgba(16,185,129,0.20)]
  active:scale-[0.97]
"
              >
                <div
                  className="
    absolute inset-0
    opacity-0
    group-hover:opacity-100
    transition
    bg-[radial-gradient(circle_at_center,
    rgba(16,185,129,0.20),
    transparent_70%)]
  "
                />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading && vaultAction === "deposit" ? (
                    <svg
                      className="h-5 w-5 animate-spin text-emerald-300"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      className="
    stroke-emerald-300
    fill-none
    transition-all
    duration-300
    group-hover:rotate-90
    group-hover:fill-emerald-500/20
  "
                    >
                      <path
                        d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M8 12H16"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M12 16V8"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                  <span className="font-semibold text-white">
                    {loading && vaultAction === "deposit"
                      ? "Depositing..."
                      : "Deposit"}
                  </span>
                </div>
              </button>
              <button
                onClick={handleCeloVaultWithdraw}
                disabled={loading}
                className="
  group
  relative
  overflow-hidden
  rounded-[20px]
  border border-amber-400/20
  bg-[linear-gradient(135deg,
  rgba(251,191,36,0.18),
  rgba(245,158,11,0.08),
  rgba(15,23,42,0.95))]
  py-3.5
  transition-all
  duration-500
  hover:border-amber-400/50
  hover:shadow-[0_0_35px_rgba(251,191,36,0.18)]
  active:scale-[0.97]
"
              >
                <div
                  className="
    absolute inset-0
    opacity-0
    group-hover:opacity-100
    transition
    bg-[radial-gradient(circle_at_center,
    rgba(251,191,36,0.20),
    transparent_70%)]
  "
                />

                <div className="relative z-10 flex items-center justify-center gap-2">

                  {loading && vaultAction === "withdraw" ? (
                    <svg
                      className="h-5 w-5 animate-spin text-amber-300"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                  ) : (
                    <div
                      className="
      flex h-8 w-8
      items-center justify-center
      rounded-full
      bg-amber-400/10
      border border-amber-300/20
      text-amber-300
      text-sm
    "
                    >
                      ↑
                    </div>
                  )}
                  <span className="font-semibold text-white">
                    {loading && vaultAction === "withdraw"
                      ? "Withdrawing..."
                      : "Withdraw"}
                  </span>
                </div>
              </button>
            </div>
          </section>

          {/* GTR Converter */}
          <section
            className={`
    p-4 space-y-4
    ${isDarkMode ? glassCard : ""}
  `}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                >
                  Convert to GTR
                </h2>
                <p
                  className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  Swap CELO or USDm for GTR
                </p>
              </div>
              <div
                className="
  px-3 py-1
  rounded-full
  border border-sky-400/20
  bg-sky-500/10
  text-sky-300
  text-[10px]
  font-medium
  backdrop-blur-xl
"
              >
                SWAP
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">
                From
              </label>
              <div
                className="
        flex items-center gap-3
        rounded-2xl
        border border-white/10
        bg-slate-950/40
        p-3
      "
              >
                <select
                  value={convertToken}
                  onChange={(e) =>
                    setConvertToken(e.target.value)
                  }
                  className="
          bg-transparent
          outline-none
          text-white
        "
                >
                  <option value="CELO">
                    CELO
                  </option>
                  <option value="USDm">
                    USDm
                  </option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={convertAmount}
                  onChange={(e) =>
                    setConvertAmount(e.target.value)
                  }
                  placeholder="0.00"
                  className="
          flex-1
          bg-transparent
          outline-none
          text-right
          text-white
        "
                />
              </div>
            </div>
            <div
              className="
      rounded-2xl
      border border-sky-500/20
      bg-sky-500/5
      p-3
    "
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  You Receive
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-sky-200">
                    {estimatedGTR.toLocaleString()}
                  </span>
                  <span className="text-xs text-sky-300">
                    GTR
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {convertToken === "USDm"
                    ? "1 USDm = 1000 GTR"
                    : "1 CELO = 100 GTR"}
                </div>
              </div>
            </div>
            <button
              onClick={handleConvert}
              disabled={loading}
              className="
  group
  relative
  w-full
  h-16
  overflow-hidden
  rounded-[22px]
  border border-sky-400/20
  bg-[linear-gradient(135deg,
  rgba(14,165,233,0.18),
  rgba(59,130,246,0.12),
  rgba(15,23,42,0.95))]
  backdrop-blur-xl
  transition-all
  duration-500
  hover:border-sky-400/50
  hover:shadow-[0_0_40px_rgba(56,189,248,0.20)]
  active:scale-[0.98]
  disabled:opacity-50
"
            >
              {/* Glow */}
              <div
                className="
    absolute
    inset-0
    opacity-0
    group-hover:opacity-100
    transition
    bg-[radial-gradient(circle_at_center,
    rgba(56,189,248,0.22),
    transparent_70%)]
  "
              />
              {/* Moving shine */}
              <div
                className="
    absolute
    inset-0
    -translate-x-[160%]
    group-hover:translate-x-[160%]
    transition-transform
    duration-[1800ms]
    bg-[linear-gradient(
      120deg,
      transparent,
      rgba(255,255,255,0.10),
      transparent
    )]
  "
              />
              <div className="relative z-10 flex items-center justify-center gap-3">
                <div
                  className="
      flex
      h-9
      w-9
      items-center
      justify-center
      rounded-full
      bg-sky-400/10
      border border-sky-300/20
      text-sky-300
    "
                >
                  ⇄
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-white">
                    {activeAction === "convert"
                      ? "Converting..."
                      : "Convert to GTR"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Instant swap
                  </span>
                </div>
              </div>
            </button>
          </section>

          {/* Badge progress + badge list */}
          <section
            className={`
    p-4 space-y-3
    ${isDarkMode ? glassCard : ""}
  `}
          >
            <div
              className="
    rounded-3xl
    border border-violet-500/10
    bg-[#050816]/90
    backdrop-blur-xl
    p-4
    shadow-[0_0_40px_rgba(80,0,255,0.08)]
  "
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">
                  My Guitar NFTs
                </h2>
              </div>
              {/* NFT Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Acoustic */}
                <div
                  className="
        rounded-2xl
        border border-white/5
        bg-gradient-to-b
        from-violet-950/40
        to-slate-950/90
        p-2
        transition
        hover:scale-[1.03]
      "
                >
                  <img
                    src="/nfts/acoustic.jpeg"
                    alt="Acoustic"
                    className="w-full h-20 object-contain"
                  />
                  <h3 className="mt-2 text-xs text-white">
                    Acoustic
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    NFT
                  </p>
                </div>
                {/* Electric */}
                <div
                  className="
        rounded-2xl
        border border-violet-500/20
        bg-gradient-to-b
        from-violet-900/30
        to-slate-950/90
        p-2
        transition
        hover:scale-[1.03]
      "
                >
                  <img
                    src="/nfts/electric.jpeg"
                    alt="Electric"
                    className="w-full h-20 object-contain"
                  />
                  <h3 className="mt-2 text-xs text-white">
                    Electric
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    NFT
                  </p>
                </div>
                <div
                  className="
        rounded-2xl
        border border-amber-400/40
        bg-gradient-to-b
        from-amber-500/10
        to-slate-950/90
        p-2
        transition
        hover:scale-[1.03]
        shadow-[0_0_18px_rgba(251,191,36,0.25)]
      "
                >
                  <img
                    src="/nfts/aurora-chord-guitar.jpeg"
                    alt="Aurora Chord Guitar"
                    className="w-full h-20 object-contain"
                  />
                  <h3 className="mt-2 text-xs text-white">
                    Aurora Chord Guitar
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    NFT
                  </p>
                </div>
              </div>
              {/* CTA */}
              <button
                onClick={() => {
                  setExpandedCollection(true);
                  setShowCollectionsModal(true);
                  setShowExploreMenu(false);
                  loadNFTBalances();
                }}
                className="
  group
  relative
  w-full
  overflow-hidden
  rounded-[28px]
  border border-white/10
  bg-[linear-gradient(
    135deg,
    rgba(30,41,59,0.95),
    rgba(88,28,135,0.55),
    rgba(15,23,42,0.95)
  )]
  p-[1px]
  transition-all
  duration-500
  hover:scale-[1.015]
  hover:shadow-[0_0_60px_rgba(168,85,247,0.25)]
  active:scale-[0.985]
"
              >
                {/* Animated border */}
                <div
                  className="
    absolute inset-0
    opacity-0
    group-hover:opacity-100
    transition-opacity
    duration-500
    bg-[conic-gradient(
      from_180deg,
      transparent,
      rgba(168,85,247,0.7),
      transparent,
      rgba(59,130,246,0.7),
      transparent
    )]
    animate-[spin_6s_linear_infinite]
  "
                />
                <div
                  className="
    relative
    flex items-center
    justify-between
    rounded-[27px]
    bg-[#050816]/95
    px-5
    py-4
  "
                >
                  {/* Left */}
                  <div className="flex items-center gap-4">

                    <div
                      className="
        relative
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-2xl
        bg-gradient-to-br
        from-violet-500/20
        to-sky-500/20
        border border-white/10
      "
                    >
                      <div
                        className="
          absolute inset-0
          rounded-2xl
          bg-violet-500/20
          blur-xl
        "
                      />
                      <span className="relative text-xl">
                        🎸
                      </span>
                    </div>
                    <div className="text-left">
                      <div
                        className="
          text-sm
          font-bold
          bg-gradient-to-r
          from-white
          via-violet-200
          to-sky-300
          bg-clip-text
          text-transparent
        "
                      >
                        Guitar Collection
                      </div>
                      <div className="text-[11px] text-slate-400">
                        View your premium NFTs
                      </div>
                    </div>
                  </div>
                  {/* Right */}
                  <div
                    className="
      flex
      h-10
      w-10
      items-center
      justify-center
      rounded-full
      bg-white/5
      border border-white/10
      text-violet-300
      transition-all
      duration-300
      group-hover:translate-x-1
      group-hover:bg-violet-500/15
    "
                  >
                    →
                  </div>
                </div>
              </button>
            </div>
          </section>

          {/* Donation */}
          <section
            className={`
    p-4 space-y-3
    transition-all duration-500

    ${isDarkMode ? glassCard : ""}

    ${showDonate ? "donate-card-glow border border-sky-400/30" : ""}
  `}
          >
            <button
              type="button"
              onClick={() => setShowDonate((v) => !v)}
              className="w-full flex items-center justify-between text-sm font-semibold text-slate-100 active:scale-[0.98] transition-transform
            "
            >
              <span
                className={`flex items-center gap-2 font-medium ${isDarkMode ? "text-slate-400" : "text-slate-900"
                  }`}
              >
                <span className="text-lg"></span> Community support
              </span>
              <span
                className={`text-[11px] ${isDarkMode ? "text-slate-500" : "text-slate-900"
                  }`}
              >
                {showDonate ? "Hide" : "Tip in USDm on Celo"}
              </span>
            </button>
            {showDonate && (
              <div className="mt-3 space-y-3 text-xs bg-slate-950/80 rounded-2xl p-3 shadow-inner shadow-slate-950">
                <p className="text-slate-300">Tip in USDm on Celo</p>
                <div className="flex flex-wrap gap-2">
                  {[1, 5, 10, 100].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleSelectDonation(v)}
                      className={`px-3 py-1.5 rounded-full border text-xs active:scale-[0.98] transition-transform
                        ${donationAmount === v.toString()
                          ? "border-sky-400 bg-sky-500/10 text-sky-200"
                          : "border-slate-700 bg-slate-900 text-slate-300"
                        }`}
                    >
                      {v} USDm
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className={`flex-1 rounded-xl px-3 py-2 text-xs outline-none focus:border-sky-400 ${isDarkMode
                      ? "bg-slate-900 border border-slate-700 text-slate-100"
                      : "bg-white border border-slate-300 text-slate-900"
                      }`}
                    placeholder="Custom amount"
                  />
                  <button
                    type="button"
                    onClick={handleDonateClick}
                    className="
    group
    relative
    overflow-hidden
    w-full
    h-12
    rounded-2xl
    border border-sky-400/25
    bg-gradient-to-r
    from-sky-500/10
    via-cyan-400/10
    to-sky-500/10
    backdrop-blur-xl
    transition-all
    duration-500
    hover:border-sky-300/60
    hover:shadow-[0_0_30px_rgba(56,189,248,0.25)]
    active:scale-[0.98]
  "
                  >
                    {/* moving light */}
                    <div
                      className="
      absolute inset-0
      -translate-x-full
      group-hover:translate-x-full
      transition-transform
      duration-[1800ms]
      bg-gradient-to-r
      from-transparent
      via-white/20
      to-transparent
    "
                    />
                    {/* pulse glow */}
                    <div
                      className="
      absolute inset-0
      opacity-0
      group-hover:opacity-100
      transition-opacity
      duration-500
      bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.18),transparent_70%)]
    "
                    />
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      <span
                        className="
        text-sky-300
        transition-transform
        duration-500
        group-hover:translate-x-1
      "
                      >
                        →
                      </span>
                      <span
                        className="
        font-semibold
        text-slate-100
        tracking-wide
      "
                      >
                        Donate
                      </span>
                    </div>
                  </button>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-500">Top supporters</p>
                  {topSupporters.length === 0 ? (
                    <p className="text-[11px] text-slate-500">No supporters yet.</p>
                  ) : (
                    <ul className="text-[11px] text-slate-400 space-y-1">
                      {topSupporters.map((s, i) => (
                        <li
                          key={s.address}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {s.avatar ? (
                              <img
                                src={s.avatar}
                                alt={s.name || s.address}
                                className="h-5 w-5 rounded-full"
                              />
                            ) : (
                              <div className="h-5 w-5 rounded-full bg-slate-700" />
                            )}
                            <span className="text-[11px]">
                              #{i + 1}{" "}
                              {s.name ||
                                `${s.address.slice(0, 6)}…${s.address.slice(-4)}`}
                            </span>
                          </div>
                          <span className="text-[11px]">
                            {s.total.toFixed(2)} USDm
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Status */}
          {status && (
            <div className="mt-2 text-[11px] text-amber-200 bg-amber-950/40 rounded-2xl p-2.5 whitespace-pre-wrap shadow-inner shadow-amber-900/60">
              {status}
            </div>
          )}
        </div>
        {/* Footer */}
        <footer
          className={`mt-auto pt-3 pb-3 flex items-center justify-between text-[11px] ${isDarkMode ? "text-slate-400" : "text-slate-700"
            }`}
        >
          <span className={isDarkMode ? "" : "text-slate-900"}>
            Built on Celo
          </span>
          <a
            href="https://celoscan.io/token/0x4C9Bf9f99F638E102dac7D54558A28007c2c7aB8"
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-2 transition ${isDarkMode
              ? "hover:text-sky-300"
              : "hover:text-sky-700 text-slate-900"
              }`}
          >
            <span>Powered by</span>
            <span className="flex items-center gap-1">
              <img
                src="/celo-logo.jpg"
                alt="0xtxn logo"
                className="h-5 w-5 rounded-sm object-contain"
              />
              <span className="font-medium">GTR</span>
            </span>
          </a>
        </footer>
      </div>

      {showVault && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          {/* Backdrop */}
          <div
            className="
        absolute inset-0
        bg-black/70
        backdrop-blur-md
      "
            onClick={() => setShowVault(false)}
          />
          {/* Modal */}
          <div
            className="
        relative
        w-full
        max-w-[380px]
        rounded-[32px]
        border
        border-cyan-400/20
        bg-[#050816]
        p-4
        shadow-[0_0_60px_rgba(0,255,255,0.12)]
      "
          >
            {/* Top Header */}
            <div className="mb-4 flex items-center justify-between">

              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className="
    flex h-12 w-12 items-center justify-center
    overflow-hidden
    rounded-2xl
    transition-all
    hover:scale-105
  "
                >
                  <Image
                    src="/vault.png"
                    alt="Vault"
                    width={56}
                    height={56}
                    className="object-contain"
                  />

                </div>
                {/* Title */}
                <div>
                  <h2
                    className="
                text-[28px]
                font-black
                tracking-tight
                text-yellow-300
              "
                  >
                    Vault
                  </h2>
                  <p className="text-xs text-slate-400">
                    Store your USDm securely
                  </p>
                </div>
              </div>
              {/* Close */}
              <button
                onClick={() => setShowVault(false)}
                className="
            flex h-11 w-11 items-center justify-center
            rounded-full
            border border-white/10
            bg-white/5
            text-slate-300
            transition
            hover:bg-white/10
            hover:text-white
          "
              >
                ✕
              </button>
            </div>

            {/* Total Vault Balance Card */}
            <div
              className="
          relative
          overflow-hidden
          rounded-[24px]
          border border-yellow-500/15
          bg-[#11141d]
          px-5
          py-5
          shadow-[0_0_50px_rgba(255,180,0,0.08)]
        "
            >
              {/* Glow */}
              <div
                className="
            absolute inset-0
            bg-[radial-gradient(circle_at_top_left,rgba(255,180,0,0.22),transparent_45%)]
            pointer-events-none
          "
              />
              {/* Bottom Beam */}
              <div
                className="
            absolute bottom-0 left-0 right-0
            h-[1px]
            bg-gradient-to-r
            from-transparent
            via-yellow-400/50
            to-transparent
          "
              />
              <div className="relative flex items-center justify-between">
                {/* Left */}
                <div>
                  <p className="text-[13px] font-medium text-yellow-100/70">
                    Total Vault Balance
                  </p>
                  <h2
                    className="
                mt-1
                text-[30px]
                font-black
                tracking-tight
                text-yellow-300
                drop-shadow-[0_0_10px_rgba(255,210,0,0.25)]
              "
                  >
                    {vaultBalance} USDm
                  </h2>
                </div>
                {/* Right */}
                <div className="relative flex items-center">

                  {/* Graph */}
                  <svg
                    width="90"
                    height="40"
                    viewBox="0 0 90 40"
                    fill="none"
                    className="absolute right-7 opacity-80"
                  >
                    <path
                      d="
                  M0 28
                  C15 10, 25 10, 40 28
                  S65 38, 90 12
                "
                      stroke="url(#gold)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient
                        id="gold"
                        x1="0"
                        y1="0"
                        x2="90"
                        y2="0"
                      >
                        <stop stopColor="#facc15" />
                        <stop offset="1" stopColor="#fde68a" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* Coin */}
                  <div className="relative z-10 text-[52px]">
                    🪙
                  </div>
                </div>
              </div>
            </div>
            {/* User Balance */}
            <div
              className="
  mt-5
  rounded-[24px]
  border border-white/5
  bg-white/[0.03]
  backdrop-blur-xl
  px-5
  py-4
  text-center
"
            >
              <div
                className="
    text-[11px]
    uppercase
    tracking-[0.22em]
    text-slate-500
  "
              >
                YOUR VAULT BALANCE
              </div>
              <div
                className="
    mt-2
    flex
    items-end
    justify-center
    gap-2
  "
              >
                <span
                  className="
      text-[34px]
      font-black
      leading-none
      bg-gradient-to-r
      from-white
      via-yellow-100
      to-yellow-300
      bg-clip-text
      text-transparent
    "
                >
                  {Number(userVaultBalance).toFixed(2)}
                </span>
                <span
                  className="
      mb-1
      text-sm
      font-semibold
      text-yellow-300
    "
                >
                  USDm
                </span>
              </div>
            </div>
            {/* Input */}
            <div className="mt-5">
              <div
                className="
      flex items-center
      rounded-[22px]
      border border-white/10
      bg-[#0b1225]
      px-5
      py-4
    "
              >
                <input
                  type="number"
                  min="0"
                  value={vaultAmount}
                  onChange={(e) => setVaultAmount(e.target.value)}
                  placeholder="0"
                  className="
        w-full
        bg-transparent
        text-[24px]
        font-bold
        text-white
        outline-none
        placeholder:text-slate-500
      "
                />
                <div
                  className="
        ml-3
        flex items-center gap-1
        text-sm
        font-semibold
        text-slate-300
      "
                >
                  USDm
                  <span className="text-slate-500">
                    ▼
                  </span>
                </div>
              </div>
            </div>
            {/* Buttons */}
            <div className="mt-6">
              <div className="grid grid-cols-2 gap-3">
                {/* Deposit */}
                <button
                  onClick={handleVaultDeposit}
                  className="
  group
  relative
  overflow-hidden
  rounded-[24px]
  border
  border-emerald-400/20
  bg-[linear-gradient(
    135deg,
    rgba(16,185,129,0.25),
    rgba(5,150,105,0.08)
  )]
  py-4
  transition-all
  duration-500
  hover:scale-[1.03]
  hover:border-emerald-300/40
  hover:shadow-[0_0_40px_rgba(16,185,129,0.25)]
  active:scale-[0.97]
"
                >
                  <div
                    className="
    absolute inset-0
    bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_50%)]
    opacity-70
  "
                  />
                  <div className="relative flex flex-col items-center gap-1">
                    {loading && vaultAction === "deposit" ? (
                      <svg
                        className="h-10 w-10 animate-spin text-emerald-300"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          opacity="0.25"
                        />
                        <path
                          d="M22 12a10 10 0 0 1-10 10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                    ) : (
                      <div
                        className="
      h-12 w-12
      rounded-2xl
      flex items-center justify-center
      bg-emerald-400/10
      border border-emerald-300/20
      text-2xl
    "
                      >
                        ↓
                      </div>
                    )}
                    <span className="text-sm font-bold text-emerald-300">
                      {loading && vaultAction === "deposit"
                        ? "Depositing..."
                        : "Deposit"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Add USDm
                    </span>
                  </div>
                </button>
                {/* Withdraw */}
                <button
                  onClick={handleVaultWithdraw}
                  className="
  group
  relative
  overflow-hidden
  rounded-[24px]
  border
  border-amber-400/20
  bg-[linear-gradient(
    135deg,
    rgba(251,191,36,0.22),
    rgba(245,158,11,0.08)
  )]
  py-4
  transition-all
  duration-500
  hover:scale-[1.03]
  hover:border-amber-300/40
  hover:shadow-[0_0_40px_rgba(251,191,36,0.25)]
  active:scale-[0.97]
"
                >
                  <div
                    className="
    absolute inset-0
    bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.2),transparent_50%)]
    opacity-70
  "
                  />
                  <div className="relative flex flex-col items-center gap-1">

                    {loading && vaultAction === "withdraw" ? (
                      <svg
                        className="h-10 w-10 animate-spin text-amber-300"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          opacity="0.25"
                        />
                        <path
                          d="M22 12a10 10 0 0 1-10 10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                    ) : (
                      <div
                        className="
      h-12 w-12
      rounded-2xl
      flex items-center justify-center
      bg-amber-400/10
      border border-amber-300/20
      text-2xl
    "
                      >
                        ↑
                      </div>
                    )}
                    <span className="text-sm font-bold text-amber-300">
                      {loading && vaultAction === "withdraw"
                        ? "Withdrawing..."
                        : "Withdraw"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Redeem USDm
                    </span>
                  </div>
                </button>
              </div>
              {/* Bottom Text */}
              <div
                className="
    mt-4
    flex items-center justify-center gap-2
    text-sm
    text-slate-400
  "
              >
                {/* Shield Icon */}
                <div
                  className="
      flex h-5 w-5 items-center justify-center
      rounded-full
      bg-[#0b1733]
      border border-blue-500/20
      shadow-[0_0_12px_rgba(59,130,246,0.18)]
    "
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    className="h-3 w-3 text-blue-400"
                  >
                    <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <span className="font-medium">
                  Your assets. Your control.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCeloVault && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">

          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowCeloVault(false)}
          />

          <div
            className="
      relative
      w-full
      max-w-[420px]
      rounded-[32px]
      border border-emerald-400/20
      bg-[#050816]
      p-4
      shadow-[0_0_60px_rgba(16,185,129,0.15)]
      "
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                >
                  CELO Vault
                </h2>
                <p
                  className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  Deposit or withdraw your CELO instantly
                </p>
              </div>
            </div>
            {/* Balance */}
            <div
              className="
    rounded-2xl
    border border-white/10
    bg-slate-950/30
    p-4
  "
            >
              <div className="flex items-center justify-between">

                {/* User Balance */}
                <div className="flex-1 text-center">
                  <p className="text-[11px] text-slate-400">
                    Your Balance
                  </p>
                  <p className="text-lg font-bold text-white mt-1">
                    {userCeloVaultBalance}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    CELO
                  </p>
                </div>
                {/* Divider */}
                <div
                  className="
        h-12
        w-px
        mx-3
        bg-gradient-to-b
        from-transparent
        via-sky-400/40
        to-transparent
      "
                />
                {/* Total Vault */}
                <div className="flex-1 text-center">
                  <p className="text-[11px] text-slate-400">
                    Vault TVL
                  </p>
                  <p className="text-lg font-bold text-sky-300 mt-1">
                    {celoVaultBalance}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    CELO
                  </p>
                </div>
              </div>
            </div>
            {/* Amount */}
            <div>
              <input
                type="number"
                min="0"
                value={vaultAmount}
                onChange={(e) => setVaultAmount(e.target.value)}
                placeholder="Enter amount"
                className="
        w-full
        rounded-2xl
        border border-white/10
        bg-slate-950/40
        px-4 py-3
        text-white
        outline-none
        focus:border-sky-400
      "
              />
            </div>
            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCeloVaultDeposit}
                disabled={loading}
                className="
  group
  relative
  overflow-hidden
  rounded-[20px]
  border border-emerald-400/20
  bg-[linear-gradient(135deg,
  rgba(16,185,129,0.18),
  rgba(5,150,105,0.08),
  rgba(15,23,42,0.95))]
  py-3.5
  transition-all
  duration-500
  hover:border-emerald-400/50
  hover:shadow-[0_0_35px_rgba(16,185,129,0.20)]
  active:scale-[0.97]
"
              >
                <div
                  className="
    absolute inset-0
    opacity-0
    group-hover:opacity-100
    transition
    bg-[radial-gradient(circle_at_center,
    rgba(16,185,129,0.20),
    transparent_70%)]
  "
                />
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {loading && vaultAction === "deposit" ? (
                    <svg
                      className="h-5 w-5 animate-spin text-emerald-300"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                  ) : (

                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      className="
    stroke-emerald-300
    fill-none
    transition-all
    duration-300
    group-hover:rotate-90
    group-hover:fill-emerald-500/20
  "
                    >
                      <path
                        d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M8 12H16"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M12 16V8"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}

                  <span className="font-semibold text-white">
                    {loading && vaultAction === "deposit"
                      ? "Depositing..."
                      : "Deposit"}
                  </span>
                </div>
              </button>
              <button
                onClick={handleCeloVaultWithdraw}
                disabled={loading}
                className="
  group
  relative
  overflow-hidden
  rounded-[20px]
  border border-amber-400/20
  bg-[linear-gradient(135deg,
  rgba(251,191,36,0.18),
  rgba(245,158,11,0.08),
  rgba(15,23,42,0.95))]
  py-3.5
  transition-all 
  duration-500
  hover:border-amber-400/50
  hover:shadow-[0_0_35px_rgba(251,191,36,0.18)]
  active:scale-[0.97]
"
              >
                <div
                  className="
    absolute inset-0
    opacity-0
    group-hover:opacity-100
    transition
    bg-[radial-gradient(circle_at_center,
    rgba(251,191,36,0.20),
    transparent_70%)]
  "
                />
                <div className="relative z-10 flex items-center justify-center gap-2">

                  {loading && vaultAction === "withdraw" ? (
                    <svg
                      className="h-5 w-5 animate-spin text-amber-300"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M22 12a10 10 0 0 1-10 10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                  ) : (
                    <div
                      className="
      flex h-8 w-8
      items-center justify-center
      rounded-full
      bg-amber-400/10
      border border-amber-300/20
      text-amber-300
      text-sm
    "
                    >
                      ↑
                    </div>
                  )}
                  <span className="font-semibold text-white">
                    {loading && vaultAction === "withdraw"
                      ? "Withdrawing..."
                      : "Withdraw"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showConvertModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setShowConvertModal(false)}
          />
          <div
            className="
      relative
      w-full
      max-w-[420px]
      rounded-[32px]
      border border-sky-400/20
      bg-[#050816]
      p-4
      shadow-[0_0_60px_rgba(56,189,248,0.15)]
      "
          >
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"
                    }`}
                >
                  Convert to GTR
                </h2>
                <p
                  className={`text-xs mt-1 ${isDarkMode ? "text-slate-400" : "text-slate-600"
                    }`}
                >
                  Swap CELO or USDm for GTR
                </p>
              </div>
              <div
                className="
  px-3 py-1
  rounded-full
  border border-sky-400/20
  bg-sky-500/10
  text-sky-300
  text-[10px]
  font-medium
  backdrop-blur-xl
"
              >
                SWAP
              </div>
            </div>
            {/* FROM */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400">
                From
              </label>
              <div
                className="
        flex items-center gap-3
        rounded-2xl
        border border-white/10
        bg-slate-950/40
        p-3
      "
              >
                <select
                  value={convertToken}
                  onChange={(e) =>
                    setConvertToken(e.target.value)
                  }
                  className="
          bg-transparent
          outline-none
          text-white
        "
                >
                  <option value="CELO">
                    CELO
                  </option>
                  <option value="USDm">
                    USDm
                  </option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={convertAmount}
                  onChange={(e) =>
                    setConvertAmount(e.target.value)
                  }
                  placeholder="0.00"
                  className="
          flex-1
          bg-transparent
          outline-none
          text-right
          text-white
        "
                />
              </div>
            </div>
            {/* TO */}
            <div
              className="
      rounded-2xl
      border border-sky-500/20
      bg-sky-500/5
      p-3
    "
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  You Receive
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-lg font-semibold text-sky-200">
                    {estimatedGTR.toLocaleString()}
                  </span>
                  <span className="text-xs text-sky-300">
                    GTR
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-slate-500">
                  {convertToken === "USDm"
                    ? "1 USDm = 1000 GTR"
                    : "1 CELO = 100 GTR"}
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-sky-200">
                { }
              </div>
            </div>
            {/* BUTTON */}
            <button
              onClick={handleConvert}
              disabled={loading}
              className="
  group
  relative
  w-full
  h-16
  overflow-hidden
  rounded-[22px]
  border border-sky-400/20
  bg-[linear-gradient(135deg,
  rgba(14,165,233,0.18),
  rgba(59,130,246,0.12),
  rgba(15,23,42,0.95))]
  backdrop-blur-xl
  transition-all
  duration-500
  hover:border-sky-400/50
  hover:shadow-[0_0_40px_rgba(56,189,248,0.20)]
  active:scale-[0.98]
  disabled:opacity-50
"
            >
              {/* Glow */}
              <div
                className="
    absolute
    inset-0
    opacity-0
    group-hover:opacity-100
    transition
    bg-[radial-gradient(circle_at_center,
    rgba(56,189,248,0.22),
    transparent_70%)]
  "
              />
              {/* Moving shine */}
              <div
                className="
    absolute
    inset-0
    -translate-x-[160%]
    group-hover:translate-x-[160%]
    transition-transform
    duration-[1800ms]
    bg-[linear-gradient(
      120deg,
      transparent,
      rgba(255,255,255,0.10),
      transparent
    )]
  "
              />
              <div className="relative z-10 flex items-center justify-center gap-3">

                <div
                  className="
      flex
      h-9
      w-9
      items-center
      justify-center
      rounded-full
      bg-sky-400/10
      border border-sky-300/20
      text-sky-300
    "
                >
                  ⇄
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-semibold text-white">
                    {activeAction === "convert"
                      ? "Converting..."
                      : "Convert to GTR"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Instant swap
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {showCollectionsModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4">

          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => {
              setShowCollectionsModal(false);
              setExpandedCollection(false);
            }}
          />
          <div
            className="
      relative
      w-full
      max-w-[500px]
      rounded-[32px]
      border border-violet-500/20
      bg-[#050816]
      p-4
      shadow-[0_0_60px_rgba(168,85,247,0.15)]
      "
          >
            <div className="flex justify-end mb-3">
              <button
                onClick={() => {
                  setShowCollectionsModal(false);
                  setExpandedCollection(false);
                }}
                className="
          h-10 w-10
          rounded-full
          bg-white/5
          border border-white/10
          text-slate-300
          hover:bg-white/10
          "
              >
                ✕
              </button>
            </div>
            <div
              className="
    rounded-3xl
    border border-violet-500/10
    bg-[#050816]/90
    backdrop-blur-xl
    p-4
    shadow-[0_0_40px_rgba(80,0,255,0.08)]
  "
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white">
                  My Guitar NFTs
                </h2>
              </div>
              <div
                className={`
    transition-all
    duration-500
    overflow-y-auto
    ${expandedCollection
                    ? "max-h-[420px] pr-1"
                    : "max-h-[120px]"
                  }
  `}
              >
                {/* NFT Grid */}
                <div className="grid grid-cols-3 gap-3">

                  {/* Acoustic */}
                  <div
                    className="
        rounded-2xl
        border border-white/5
        bg-gradient-to-b
        from-violet-950/40
        to-slate-950/90
        p-2
        transition
        hover:scale-[1.03]
      "
                  >
                    <img
                      src="/nfts/acoustic.jpeg"
                      alt="Acoustic"
                      className="w-full h-20 object-contain"
                    />
                    <h3 className="mt-2 text-xs text-white">
                      Acoustic
                    </h3>
                    <div className="mt-1 flex items-center justify-between">

                      <span className="text-[10px] text-slate-500">
                        NFT
                      </span>

                      <span
                        className="
      rounded-full
      border border-violet-500/20
      bg-violet-500/10
      px-2
      py-[2px]
      text-[9px]
      font-semibold
      text-violet-300
    "
                      >
                        {(nftBalances[1] ?? 0) > 0 ? (
                          <span className="...">
                            Owned ×{nftBalances[1]}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500">
                            Not Owned
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {/* Electric */}
                  <div
                    className="
        rounded-2xl
        border border-violet-500/20
        bg-gradient-to-b
        from-violet-900/30
        to-slate-950/90
        p-2
        transition
        hover:scale-[1.03]
      "
                  >
                    <img
                      src="/nfts/electric.jpeg"
                      alt="Electric"
                      className="w-full h-20 object-contain"
                    />
                    <h3 className="mt-2 text-xs text-white">
                      Electric
                    </h3>
                    <div className="mt-1 flex items-center justify-between">

                      <span className="text-[10px] text-slate-500">
                        NFT
                      </span>
                      <span
                        className="
      rounded-full
      border border-violet-500/20
      bg-violet-500/10
      px-2
      py-[2px]
      text-[9px]
      font-semibold
      text-violet-300
    "
                      >
                        {(nftBalances[2] ?? 0) > 0 ? (
                          <span className="...">
                            Owned ×{nftBalances[2]}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500">
                            Not Owned
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div
                    className="
        rounded-2xl
        border border-amber-400/40
        bg-gradient-to-b
        from-amber-500/10
        to-slate-950/90
        p-2
        transition
        hover:scale-[1.03]
        shadow-[0_0_18px_rgba(251,191,36,0.25)]
      "
                  >
                    <img
                      src="/nfts/aurora-chord-guitar.jpeg"
                      alt="Aurora Chord Guitar"
                      className="w-full h-20 object-contain"
                    />
                    <h3 className="mt-2 text-xs text-white">
                      Aurora Chord Guitar
                    </h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">
                        NFT
                      </span>
                      <span
                        className="
      rounded-full
      border border-violet-500/20
      bg-violet-500/10
      px-2
      py-[2px]
      text-[9px]
      font-semibold
      text-violet-300
    "
                      >
                        {(nftBalances[31] ?? 0) > 0 ? (
                          <span className="...">
                            Owned ×{nftBalances[31]}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500">
                            Not Owned
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {additionalNFTs.map((nft) => (
                    <div
                      key={nft.name}
                      className="
      rounded-2xl
      border border-white/5
      bg-gradient-to-b
      from-violet-950/40
      to-slate-950/90
      p-2
      transition
      hover:scale-[1.03]
    "
                    >
                      <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-20 object-contain"
                      />
                      <h3 className="mt-2 text-xs text-white">
                        {nft.name}
                      </h3>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">
                          NFT
                        </span>
                        <span
                          className="
      rounded-full
      border border-violet-500/20
      bg-violet-500/10
      px-2
      py-[2px]
      text-[9px]
      font-semibold
      text-violet-300
    "
                        >
                          {(nftBalances[nft.id] ?? 0) > 0 ? (
                            <>Owned ×{nftBalances[nft.id]}</>
                          ) : (
                            <>Not Owned</>
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* CTA */}
              <button
                onClick={() =>
                  setExpandedCollection(!expandedCollection)
                }
                className="
  group
  relative
  w-full
  overflow-hidden
  rounded-[28px]
  border border-white/10
  bg-[linear-gradient(
    135deg,
    rgba(30,41,59,0.95),
    rgba(88,28,135,0.55),
    rgba(15,23,42,0.95)
  )]
  p-[1px]
  transition-all
  duration-500
  hover:scale-[1.015]
  hover:shadow-[0_0_60px_rgba(168,85,247,0.25)]
  active:scale-[0.985]
"
              >
                {/* Animated border */}
                <div
                  className="
    absolute inset-0
    opacity-0
    group-hover:opacity-100
    transition-opacity
    duration-500
    bg-[conic-gradient(
      from_180deg,
      transparent,
      rgba(168,85,247,0.7),
      transparent,
      rgba(59,130,246,0.7),
      transparent
    )]
    animate-[spin_6s_linear_infinite]
  "
                />
                <div
                  className="
    relative
    flex items-center
    justify-between
    rounded-[27px]
    bg-[#050816]/95
    px-5
    py-4
  "
                >
                  {/* Left */}
                  <div className="flex items-center gap-4">
                    <div
                      className="
        relative
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-2xl
        bg-gradient-to-br
        from-violet-500/20
        to-sky-500/20
        border border-white/10
      "
                    >
                      <div
                        className="
          absolute inset-0
          rounded-2xl
          bg-violet-500/20
          blur-xl
        "
                      />
                      <span className="relative text-xl">
                        🎸
                      </span>
                    </div>
                    <div className="text-left">
                      <div
                        className="
          text-sm
          font-bold
          bg-gradient-to-r
          from-white
          via-violet-200
          to-sky-300
          bg-clip-text
          text-transparent
        "
                      >
                        Guitar Collection
                      </div>
                      <div className="text-[11px] text-slate-400">
                        View your premium NFTs
                      </div>
                    </div>
                  </div>
                  {/* Right */}
                  <div
                    className="
    flex
    h-10
    w-10
    items-center
    justify-center
    rounded-full
    bg-white/5
    border border-white/10
    text-violet-300
    transition-all
    duration-300
    group-hover:translate-x-1
    group-hover:bg-violet-500/15
  "
                  >
                    {loadingNFTs ? (
                      <svg
                        className="h-5 w-5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="3"
                          opacity="0.25"
                        />
                        <path
                          d="M22 12a10 10 0 0 1-10 10"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                    ) : (
                      "→"
                    )}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding overlay */}
      {showOnboarding && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className="
    w-[90%] max-w-sm rounded-3xl
    bg-slate-950/80  backdrop-blur-xl
    border border-white/10
    shadow-[0_0_40px_rgba(56,189,248,0.25),0_0_90px_rgba(168,85,247,0.12)]
    p-5 space-y-3
    animate-[overlayFade_0.55s_ease-out]
            "
          >
            <div className="flex items-center gap-3">
              <div
                className="
    relative
    h-11 w-11
    rounded-full
    overflow-hidden
    flex items-center justify-center
    ring-2 ring-sky-400/30
    shadow-[0_0_25px_rgba(56,189,248,0.45)]
  "
              >
                <div
                  className="
      absolute inset-0
      bg-sky-400/20
      blur-xl
    "
                />
                <img
                  src="/logo-0x.jpg"
                  alt="0x logo"
                  className="h-full w-full object-contain" 
                />
              </div>
              <div className="flex flex-col">
                <span
                  className="
    text-base
    font-bold
    bg-gradient-to-r
    from-white
    via-sky-200
    to-cyan-300
    bg-clip-text
    text-transparent
  "
                >
                  Welcome to GuitarFi
                </span>
                <span className="text-[11px] text-slate-300">
                  Deposit, withdraw and stay liquid anytime.
                </span>
              </div>
            </div>
            <ul className="text-[11px] text-slate-200 space-y-1 pl-4 list-disc">
              <li>Play <span className="font-semibold">Tune</span> and discover a random soundtrack.</li>
              <li>Claim your <span className="font-semibold">GTR</span> and Guitar NFTs by clicking the gift button</li> 
              <li>31 unique Guitar NFTs await. Every NFT marks a moment in your journey.</li>
            </ul>
            <button
              onClick={closeOnboarding} 
              className="
group
relative
overflow-hidden
w-full
h-12
rounded-2xl
border border-sky-400/25
bg-gradient-to-r
from-sky-500/10
via-cyan-400/10
to-sky-500/10
backdrop-blur-xl
transition-all
duration-500
hover:border-sky-300/60
hover:shadow-[0_0_30px_rgba(56,189,248,0.25)]
active:scale-[0.98]
"
            >
              <div
                className="
    absolute inset-0
    -translate-x-full
    group-hover:translate-x-full 
    transition-transform
    duration-[1800ms]
    bg-gradient-to-r
    from-transparent
    via-white/20
    to-transparent
  "
              />
              <div className="relative z-10">
                Got it, let's start
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toast && (
        <div className="pointer-events-none fixed top-6 left-0 right-0 flex justify-center z-40"> 
          <div
            className="pointer-events-auto rounded-2xl bg-slate-950/95 border border-sky-400/60 px-4 py-2.5 text-xs text-sky-50 shadow-lg backdrop-blur-lg flex items-center gap-2 animate-[toast-pop_0.28s_ease-out]"
          >
            <span className="text-base">
              {toast.type === "checkin" ? "⚡" : "💰"}
            </span>
            <div className="flex flex-col">
              <span className="font-semibold">
                {toast.type === "checkin"
                  ? "Gm reward"
                  : toast.message.toLowerCase().includes("donated")
                    ? "Thank you for your support"
                    : "Reward claimed"}
              </span>
              <span className="text-[11px] text-slate-200">
                {toast.message}
              </span>
            </div>
          </div> 
        </div> 
      )}

      {showDevPanel && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-950 border border-sky-400/40 p-6">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-sky-300">
                Dev panel
              </span>
              <button
                onClick={() => {
                  setShowDevPanel(false);
                  setDevUnlocked(false);
                  setDevPasswordInput("");
                }}
                className="text-slate-400"
              >
                ✕
              </button>
            </div>
            {!devUnlocked && (
              <input
                type="password"
                maxLength={4}
                value={devPasswordInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setDevPasswordInput(val);
                  if (val === DEV_PASSWORD) {
                    setDevUnlocked(true);
                  }
                }}
                placeholder="Enter 4-digit password"
                className="w-full rounded-xl px-3 py-2 text-xs bg-slate-900 border border-slate-700 text-slate-100"
              />
            )}
            {devUnlocked && (
              <div className="flex flex-col gap-2">
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {/* MINT */}
                  <div className="border border-white/10 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-lg">Mint Tokens</h3>
                    <input
                      value={devMintAddress}
                      onChange={(e) => setDevMintAddress(e.target.value)}
                      placeholder="Wallet address"
                      className="w-full rounded-lg bg-black/30 p-3"
                    />
                    <input
                      value={devMintAmount}
                      onChange={(e) => setDevMintAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full rounded-lg bg-black/30 p-3"
                    />
                    <button
                      onClick={handleDevMint}
                      disabled={devRunning}
                      className="w-full rounded-lg bg-blue-500 p-3 font-bold"
                    >
                      Mint
                    </button>
                  </div>
                  {/* BURN */}
                  <div className="border border-white/10 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-lg">Burn Tokens</h3>
                    <input
                      value={devBurnAmount}
                      onChange={(e) => setDevBurnAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full rounded-lg bg-black/30 p-3"
                    />
                    <input
                      type="number"
                      value={devBurnCount}
                      onChange={(e) =>
                        setDevBurnCount(e.target.value)
                      }
                      placeholder="Burn Count"
                      className="
    w-full rounded-xl
    bg-slate-900
    border border-slate-700
    px-3 py-2
    text-sm text-white
    outline-none
  "
                    />
                    <button
                      onClick={handleDevBurn}
                      disabled={devRunning}
                      className="w-full rounded-lg bg-red-500 p-3 font-bold"
                    >
                      Burn
                    </button>
                  </div>
                  {/* CLAIM */}
                  <div className="border border-white/10 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-lg">Claim From Contract</h3>
                    <input
                      value={devClaimAddress}
                      onChange={(e) => setDevClaimAddress(e.target.value)}
                      placeholder="Wallet address"
                      className="w-full rounded-lg bg-black/30 p-3"
                    />
                    <input
                      value={devClaimAmount}
                      onChange={(e) => setDevClaimAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full rounded-lg bg-black/30 p-3"
                    />
                    <button
                      onClick={handleDevClaim}
                      disabled={devRunning}
                      className="w-full rounded-lg bg-green-500 p-3 font-bold"
                    >
                      Claim
                    </button>
                  </div>
                  {/* REVERSE */}
                  <div className="border border-white/10 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-lg">Reverse Tokens</h3>
                    <input
                      value={devReverseToken}
                      onChange={(e) => setDevReverseToken(e.target.value)}
                      placeholder="Token contract"
                      className="w-full rounded-lg bg-black/30 p-3"
                    />
                    <input
                      value={devReverseAmount}
                      onChange={(e) => setDevReverseAmount(e.target.value)}
                      placeholder="Amount"
                      className="w-full rounded-lg bg-black/30 p-3"
                    />
                    <button
                      onClick={handleDevReverse}
                      disabled={devRunning}
                      className="w-full rounded-lg bg-yellow-500 p-3 font-bold text-black"
                    >
                      Reverse
                    </button>
                  </div>
                  {/* MULTISEND */}
                  <div className="border border-white/10 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-lg">MultiSend</h3>
                    <textarea
                      value={devMultiAddresses}
                      onChange={(e) => setDevMultiAddresses(e.target.value)}
                      placeholder="One address per line"
                      className="w-full rounded-lg bg-black/30 p-3 h-32"
                    />
                    <textarea
                      value={devMultiAmounts}
                      onChange={(e) => setDevMultiAmounts(e.target.value)}
                      placeholder="One amount per line"
                      className="w-full rounded-lg bg-black/30 p-3 h-32"
                    />
                    <button
                      onClick={handleDevMultiSend}
                      disabled={devRunning}
                      className="w-full rounded-lg bg-purple-500 p-3 font-bold"
                    >
                      MultiSend
                    </button>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-lg">
                      Withdraw USDM
                    </h3>
                    <input
                      value={devWithdrawUSDM}
                      onChange={(e) =>
                        setDevWithdrawUSDM(
                          e.target.value
                        )
                      }
                      placeholder="Amount"
                      className="w-full rounded-lg bg-black/30 p-3"
                    />
                    <button
                      onClick={handleDevWithdrawUSDM}
                      disabled={devRunning}
                      className="w-full rounded-lg bg-cyan-500 p-3 font-bold"
                    >
                      Withdraw USDM
                    </button>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-lg">
                      Withdraw CELO
                    </h3>
                    <input
                      value={devWithdrawCELO}
                      onChange={(e) =>
                        setDevWithdrawCELO(
                          e.target.value
                        )
                      }
                      placeholder="Amount"
                      className="w-full rounded-lg bg-black/30 p-3"
                    />
                    <button
                      onClick={handleDevWithdrawCELO}
                      disabled={devRunning}
                      className="w-full rounded-lg bg-orange-500 p-3 font-bold"
                    >
                      Withdraw CELO
                    </button>
                  </div>
                </div>
                <hr className="border-white/10 my-1" />
                <div className="text-[11px] text-slate-400 text-center">
                  NFT actions
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {globalToast && (
        <div
          className="
      fixed
      inset-0
      z-[9999]
      flex
      items-center
      justify-center
    "
          onClick={() =>
            setGlobalToast(null)
          }
        >
          <div
            onClick={(e) =>
              e.stopPropagation()
            }
            className={`
        group
        relative
        isolate
        overflow-hidden
        rounded-2xl
        border
        px-6
        py-3
        text-xs
        font-semibold
        tracking-[0.15em]
        uppercase
        backdrop-blur-3xl
        animate-in
        fade-in
        zoom-in-95
        ${isDarkMode
                ? `
          border-white/15
          bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04))]
          text-slate-200
          shadow-[0_10px_40px_rgba(0,0,0,0.55)]
          `
                : `
          border-sky-300/40
          bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(230,240,255,0.72))]
          text-slate-800
          shadow-[0_10px_30px_rgba(56,189,248,0.25)]
          `
              }
        before:absolute
        before:inset-0
        before:bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_45%)]
        after:absolute
        after:inset-0
        after:bg-[linear-gradient(120deg,transparent_20%,rgba(255,255,255,0.25)_50%,transparent_80%)]
        after:translate-x-[-160%]
        after:animate-[shine_2s_linear]
        [&>span]:relative
        [&>span]:z-10
      `}
          >
            <span>
              {globalToast}
            </span>
          </div>
        </div>
      )}

      {/* Profile drawer (animated */}
      <div
        className={`
          fixed inset-0 z-50 flex
          transition-opacity duration-300
          ${drawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      >
        {/* overlay */}
        <div
          className={`
            flex-1 bg-black/40 backdrop-blur-sm
            transition-opacity duration-300
            ${drawerOpen ? "opacity-100" : "opacity-0"}
          `}
          onClick={() => {
            setDrawerOpen(false);
            setShowBadgeInfo(false);
          }}
        />
        {/* panel */}
        <div
          className={`
    w-4/5 max-w-xs
    p-4 flex flex-col gap-4
    transform transition-transform duration-300 ease-out
    ${isDarkMode
              ? `
     bg-[#050816]/99
    backdrop-blur-[0.5px]
    border border-white/15
    shadow-[0_20px_50px_rgba(0,0,0,0.45)]
  `
              : `
    bg-white/60
    backdrop-blur-md
    border border-white/40
    shadow-[0_20px_50px_rgba(0,0,0,0.12)]
  `
            }
    ${drawerOpen ? "translate-x-0" : "translate-x-full"}
  `}
        >
          {/* header */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">
            </h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-slate-400 text-sm hover:text-slate-100 active:scale-[0.98] transition-transform
              "
            >
              ✕
            </button>
          </div>
          <div
            className={`rounded-2xl px-3 py-2.5 flex items-center justify-between gap-3 border 
              ${isDarkMode ? "bg-slate-950/25 border-white/5" : "bg-white/80 border-sky-100/60"}`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <img
                src={
                  profileAvatar &&
                    profileAvatar.startsWith("data:image")
                    ? profileAvatar
                    : "/raihan-avatar.jpg"
                }
                alt="User avatar"
                className="h-15 w-15 rounded-full object-cover cursor-pointer"
                onClick={() =>
                  document
                    .getElementById("avatarUpload")
                    ?.click()
                }
              />
              {/* hidden file input (OUTSIDE layout) */}
              <input
                id="avatarUpload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              {/* Name */}
              <div className="flex flex-col">
                <span
                  className="text-sm font-semibold cursor-pointer"
                  onClick={() => {
                    const name = prompt("Enter your name", profileName || "");
                    if (name !== null) saveProfile(name, profileAvatar);
                  }}
                >
                  {profileName || "GuitarFi user"}
                </span>
                {/* username REMOVE → blank বা small hint */}
                <span className="text-[11px] text-slate-400">
                  Tap name to edit
                </span>
              </div>
            </div>
            {/* Theme toggle button */}
            {/*<button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              aria-label="Toggle theme"
              className={`relative inline-flex items-center justify-between w-14 h-7 rounded-full px-1 border text-[13px] select-none overflow-hidden active:scale-95 transition-transform

                ${isDarkMode ? "bg-slate-900/90 border-slate-600" : "bg-sky-100 border-sky-300"}`}
            >
              <span
                className={`z-10 transition-opacity ${isDarkMode ? "opacity-100" : "opacity-40"
                  }`}
              >
                🌙
              </span>
              <span
                className={`z-10 transition-opacity ${isDarkMode ? "opacity-40" : "opacity-100"
                  }`}
              >
                ☀️
              </span>
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-200
                  ${isDarkMode ? "translate-x-0" : "translate-x-7"}`}
              />
            </button> */}
          </div>

          {/* FID + Neynar score */}
          <div
            className={`
    rounded-2xl
    px-3 py-3 space-y-1
    text-[11px]
    ${isDarkMode
                ? "bg-slate-950/25 border border-white/5 text-slate-300"
                : "bg-white border border-slate-200 text-slate-700"
              }
  `}
          >

            <div className="flex justify-between">

              <span
                className={`
      font-mono
      ${isDarkMode ? "text-slate-100" : "text-slate-900 font-semibold"}
    `}
              >
              </span>
            </div>
            <div className="flex justify-between">
              <span
                className={`
    ${isDarkMode ? "text-sky-300" : "text-sky-500"}
    font-semibold
    text-[14px]
  `}
              >
              </span>
            </div>
          </div>
          {/* Your stats (on-chain) */}
          <div
            className={`
    rounded-2xl
    px-3 py-3
    ${isDarkMode
                ? "bg-slate-950/25 border border-white/5"
                : "bg-white border border-slate-200"
              }
  `}
          >
            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">

              {/* Streak */}
              <div>
                <p
                  className={`
          font-semibold
          ${isDarkMode ? "text-slate-100" : "text-slate-900"}
        `}
                >
                  {streakNumber}
                </p>
                <p
                  className={`
          ${isDarkMode ? "text-slate-400" : "text-slate-900"}
        `}
                >
                  Streak
                </p>
              </div>
              {/* GTR */}
              <div>
                <p
                  className={`
          font-semibold
          ${isDarkMode ? "text-slate-100" : "text-slate-900"}
        `}
                >
                  {totalEarnedReadable ?? "—"}
                </p>
                <p
                  className={`
          ${isDarkMode ? "text-slate-400" : "text-slate-900"}
        `}
                >
                  GTR
                </p>
              </div>

            </div>
          </div>
          {/* Contact dev */}
          <div
            className={`
              rounded-2xl
               px-3 py-3 space-y-2
              ${isDarkMode
                ? "bg-slate-950/25 border border-white/5"
                : "bg-white border border-slate-200"
              }
              `}
          >
            <p
              className={`
    text-xs font-semibold
    ${isDarkMode ? "text-slate-100" : "text-slate-900"}
  `}
            >
              Contact dev
            </p>

            <div className="flex items-center gap-3 text-[20px] text-slate-300">
              <a
                href="https://x.com/Oxxtxn"
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-400"
                title="X (Twitter)"
              >
                𝕏
              </a>
              <a
                href="mailto:kabir.business.marketing@gmail.com"
                className="hover:text-sky-400"
                title="Email"
              >
                ✉️
              </a>
            </div>
          </div>

          {/* bottom row */}
          <div className="mt-auto flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
            <button
              onClick={() => setAboutOpen(true)}
              className="relative
                 px-3 py-1.5
                  rounded-full
                    text-[11px]
                      font-medium
                        text-sky-300
                          bg-sky-500/10
                            border border-sky-400/30
                              shadow-[0_0_12px_rgba(56,189,248,0.25)]
                                hover:text-sky-200
                                  hover:bg-sky-400/20
                                    hover:shadow-[0_0_18px_rgba(56,189,248,0.45)]
                                      transition-all
                                        duration-300 active:scale-[0.98] transition-transform
                                        "
            >
              <span className={isDarkMode ? "text-sky-300" : "text-slate-900"}>
                About us
              </span>
              <span> 📒</span>
            </button>
            <button
              onClick={handleShare}
              className="
                relative
                 px-3 py-1.5
                  rounded-full
                    text-[11px]
                      font-medium
                        text-sky-300
                          bg-sky-500/10
                            border border-sky-400/30
                              shadow-[0_0_12px_rgba(56,189,248,0.25)]
                                hover:text-sky-200
                                  hover:bg-sky-400/20
                                    hover:shadow-[0_0_18px_rgba(56,189,248,0.45)]
                                      transition-all
                                        duration-300 active:scale-[0.98] transition-transform

                                          "
            >
              <span className={isDarkMode ? "text-sky-300" : "text-slate-900"}>
                Share
              </span>
            </button>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowDevPanel(true)}
              className={`
    w-full
    rounded-xl
    px-3 py-2
    text-xs
    font-semibold
    transition
    ${isDarkMode
                  ? "bg-slate-800/2 border border-white/1 text-slate-300 hover:bg-slate-800"
                  : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                }
  `}
            >
              Dev panel
            </button>
          </div>
          <div className="mt-3 text-center text-[10px] text-slate-500">
            © 2026 GuitarFi by{" "}
            <a
              href="https://celoscan.io/token/0x4C9Bf9f99F638E102dac7D54558A28007c2c7aB8"
              target="_blank"
              rel="noreferrer"
              className="text-sky-500 hover:underline"
            >
              GTR
            </a>{" "}
            — All rights reserved.
          </div>
        </div>
      </div>

      {showIdentityRequired && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowIdentityRequired(false)}
          />

          {/* popup */}
          <div
            className="
      relative z-10
      w-[90%] max-w-xs
      rounded-3xl
      border border-sky-400/20
      bg-slate-950/95
      backdrop-blur-xl
      px-4 py-3
      shadow-[0_0_40px_rgba(56,189,248,0.2)]
      "
          >
            <div className="text-center space-y-2">
              <div className="text-3xl">
                🪪
              </div>
              <h3 className="text-base font-semibold text-white">
                Mint Identity First
              </h3>
              <p className="text-[11px] leading-4 text-slate-400">
                You need a GuitarFi Identity NFT
                before using this feature.
              </p>
              <button
                onClick={() => {
                  setShowIdentityRequired(false);
                  setShowMintIdentity(true);
                }}
                className={`
  group
  relative
  isolate
  overflow-hidden
  rounded-2xl
  border
  px-3 py-1.5
  text-[11px]
  font-semibold
  tracking-[0.18em]
  uppercase
  backdrop-blur-3xl
  transition-all
  duration-500
  hover:scale-[1.03]
  ${isDarkMode
                    ? `
        border-white/15
        bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.04))]
        text-slate-400
        shadow-[0_10px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.18)]
        hover:border-white/30
        hover:shadow-[0_15px_45px_rgba(0,0,0,0.55),0_0_25px_rgba(255,255,255,0.12)]
      `
                    : `
        border-sky-300/40
        bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(230,240,255,0.72))]
        text-slate-800
        shadow-[0_10px_30px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.9)]
        hover:border-sky-400/60
        hover:shadow-[0_15px_45px_rgba(56,189,248,0.28)]
      `
                  }

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
`}
              >
                Open Identity Card
              </button>
            </div>
          </div>
        </div>
      )}
      {/* About us modal */}
      {aboutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <button
            className="absolute inset-0 bg-black/50 backdrop-blur-sm active:scale-[0.98] transition-transform
            "
            onClick={() => setAboutOpen(false)}
          />
          {/* panel */}
          <div
            className="relative z-10 mx-4 max-w-sm w-full rounded-3xl bg-slate-950/95 border border-sky-500/20 shadow-2xl shadow-black/70 px-4 py-4 text-xs text-slate-100 animate-[toast-pop_0.28s_ease-out]"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold flex items-center gap-1">
                <span>About GuitarFi</span>
                <span>📒</span>
              </h3>
              <button
                onClick={() => setAboutOpen(false)}
                className="text-slate-400 hover:text-slate-100 text-sm active:scale-[0.98] transition-transform
                "
              >
                ✕
              </button>
            </div>

            <p className="mb-2 text-[11px] text-slate-300">
              GuitarFi is a miniapp where you Gm to the Celo network every day to increase your streak and unlock GTR rewards.
            </p>
            <p className="text-[11px] text-slate-400">
              If you want, you can also support the project by tipping Mento Dollar (USDm) from the Support creator section below. 💙
            </p>
          </div>
        </div>
      )}
      {flashGlow && (
        <div
          className="
      pointer-events-none fixed inset-0 z-40
      bg-sky-400/20
      animate-[flashGlow_0.6s_ease-out]
    "
        />
      )}
      {showMintIdentity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMintIdentity(false)}
          />
          {/* modal */}
          <div className="
      relative z-10 w-[90%] max-w-sm
      rounded-3xl
      bg-slate-950/90 backdrop-blur-xl
      border border-sky-400/30
      shadow-2xl shadow-black/70
      p-4 space-y-3
      animate-[toast-pop_0.28s_ease-out]
    ">
            <h3
              className={`
    relative
    text-center
    text-lg
    font-semibold
    tracking-tight
    transition-all
    duration-500
    ${hasIdentityNFT
                  ? `
          bg-gradient-to-r from-emerald-300 via-sky-300 to-blue-400
          bg-clip-text text-transparent
          animate-[identityPulse_3.5s_ease-in-out_infinite]
        `
                  : `
          text-slate-100
        `
                }
  `}
            >
              {hasIdentityNFT ? "Your Identity" : "Mint Your GuitarFi Identity"}

              {/* subtle underline glow */}
              {hasIdentityNFT && (
                <span
                  className="
        pointer-events-none
        absolute
        left-1/2
        -bottom-1
        h-[2px]
        w-24
        -translate-x-1/2
        rounded-full
        bg-gradient-to-r from-transparent via-sky-400/60 to-transparent
        blur-sm
      "
                />
              )}
            </h3>
            {/* NFT preview card */}
            <div
              className="
    relative
    rounded-2xl
    p-4 space-y-3
    overflow-hidden
    bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617]
    border border-white/10
    shadow-[0_0_40px_rgba(56,189,248,0.15)]
  "
            >

              {/* glow blob */}
              <div className="
  absolute -top-10 -right-10
  h-32 w-32
  rounded-full
  bg-sky-500/20
  blur-3xl
" />

              {/* subtle grid texture */}
              <div className="
  absolute inset-0
  opacity-[0.06]
  bg-[linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)]
  bg-[size:24px_24px]
  pointer-events-none
" />

              <div className="flex items-center gap-3">
                <img
                  src={
                    profileAvatar &&
                      profileAvatar.startsWith("data:image")
                      ? profileAvatar
                      : "/raihan-avatar.jpg"
                  }
                  className="h-12 w-12 rounded-full ring-2 ring-sky-400 animate-[breath_3.6s_ease-in-out_infinite]"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {profileName || "GuitarFi user"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {hasIdentity
                      ? `GFID #${identityTokenId}`
                      : "Identity not minted"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <span className="text-[11px] uppercase tracking-wider text-slate-400">Highest streak</span>
                <span className=" text-right
    text-xl font-extrabold
    bg-gradient-to-r from-amber-300 to-yellow-400
    bg-clip-text text-transparent
    drop-shadow-[0_0_12px_rgba(251,191,36,0.35)]
  ">
                  {highestNumber}
                </span>
                <span className="text-right text-sm font-semibold text-sky-300">
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-slate-400 text-center">
                <img src="/logo-0x.jpg" className="h-4 w-4" />
                GuitarFi Identity NFT
              </div>
            </div>
            {/* mint button */}
            <div className="flex justify-center mt-3">
              <button
                onClick={handleMintIdentity}
                disabled={hasIdentityNFT === true}
                className={`
    mx-auto
    px-6 py-2
    rounded-full
    border border-sky-400/40
    backdrop-blur-md
    text-sm font-semibold
    shadow-[0_0_20px_rgba(56,189,248,0.25)]
    transition-all

    ${hasIdentityNFT
                    ? `
          bg-emerald-500/10
          text-emerald-300
          cursor-not-allowed
          shadow-[0_0_20px_rgba(16,185,129,0.25)]
        `
                    : `
          bg-sky-500/10
          text-sky-300
          hover:bg-sky-500/20
          hover:shadow-[0_0_30px_rgba(56,189,248,0.45)]
          active:scale-[0.97]
        `
                  }
  `}
              >
                {hasIdentityNFT ? "Minted ✓" : "Mint"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function BadgeCard({
  icon,
  name,
  owned,
  isDarkMode,
}: {
  icon: string;
  name: string;
  owned: number;
  isDarkMode: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl
        px-3 py-2
        flex items-center justify-between

        ${isDarkMode
          ? "bg-slate-950/80 shadow-inner shadow-slate-950/70"
          : "bg-white border border-slate-200"
        }
      `}
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-lg ${owned === 0
            ? "opacity-40 animate-[badge-pulse_1.8s_ease-in-out_infinite]"
            : ""
            }`}
        >
          {icon}
        </span>
        <span
          className={`text-[11px] ${isDarkMode ? "text-slate-100" : "text-slate-900"
            }`}
        >
          {name}
        </span>
      </div>
      <span
        className={`text-[11px] font-semibold ${isDarkMode ? "text-slate-400" : "text-slate-900"
          }`}
      >
        x{owned}
      </span>
    </div>
  );
}
function BadgeGlow({
  icon,
  count,
}:
  {
    icon: string;
    count: number;
  }) {
  return (
    <div className="relative">
      <span
        className="
          text-xl
          animate-[badge-glow_2.4s_ease-in-out_infinite]
        "
      >
        {icon}
      </span>
      {count > 1 && (
        <span
          className="
            absolute -top-1 -right-1
            text-[9px] font-bold
            bg-sky-500 text-slate-950
            rounded-full px-1
          "
        >
          {count}
        </span>
      )}
    </div>
  );
}
function BadgeGhost({ icon }: { icon: string }) {
  return (
    <span className="text-xl opacity-20 grayscale select-none">
      {icon}
    </span>
  );
}
function CeloBlockLogo({
  checkedIn,
  isDark,
}: {
  checkedIn: boolean;
  isDark: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <img
        src={isDark ? "/celo-white.png" : "/celo.png"}
        alt="Celo"
        className="h-6 w-auto object-contain transition-opacity duration-200"
      />
      {checkedIn && (
        <span className="ml-1 text-xs text-emerald-400 animate-[fade-up_0.3s_ease-out]">
          ✓
        </span>
      )}
    </div>
  );
}

function HoverInfo({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        absolute z-40 top-full mt-2 left-0
        w-64
        rounded-2xl
        bg-slate-950/95 backdrop-blur-xl
        border border-white/10
        shadow-2xl
        px-3 py-2
        text-[11px] text-slate-200
        opacity-0 scale-95
        group-hover:opacity-100 group-hover:scale-100
        transition-all duration-200
        pointer-events-none
      "
    >
      <p className="font-semibold text-sky-300 mb-1">{title}</p>
      {children}
    </div>
  );
}
