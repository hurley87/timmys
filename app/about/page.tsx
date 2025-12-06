"use client";

import { useEffect, useRef, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NavBar } from "@/components/nav-bar";
import { AddToFarcasterButton } from "@/components/add-to-farcaster-button";
import { DuneDashboardButton } from "@/components/dune-dashboard-button";

type MiniAppContext = {
  user?: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
};

const initialsFrom = (label?: string) => {
  if (!label) return "";
  const stripped = label.replace(/[^a-zA-Z0-9]/g, "");
  if (!stripped) return label.slice(0, 2).toUpperCase();
  return stripped.slice(0, 2).toUpperCase();
};

export default function AboutPage() {
  const readyRef = useRef(false);
  const [context, setContext] = useState<MiniAppContext | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hydrateContext = async () => {
      try {
        const ctx = (await (sdk as unknown as {
          context: Promise<MiniAppContext> | MiniAppContext;
        }).context) as MiniAppContext;
        if (!cancelled) {
          setContext(ctx);
        }
      } catch {
        if (!cancelled) setContext(null);
      }
    };
    hydrateContext();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!readyRef.current) {
        readyRef.current = true;
        sdk.actions.ready().catch(() => {});
      }
    }, 1200);
    return () => clearTimeout(timeout);
  }, []);

  const userDisplayName =
    context?.user?.displayName ?? context?.user?.username ?? "Farcaster user";
  const userHandle = context?.user?.username
    ? `@${context.user.username}`
    : context?.user?.fid
      ? `fid ${context.user.fid}`
      : "";
  const userAvatarUrl = context?.user?.pfpUrl ?? null;

  return (
    <main className="flex h-screen w-screen justify-center overflow-hidden bg-timmys-white font-sans">
      <div
        className="relative flex h-full w-full max-w-[520px] flex-1 flex-col overflow-hidden rounded-[28px] bg-timmys-white px-2 pb-4 shadow-lg border-2 border-timmys-red/20"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 8px)",
          paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)",
        }}
      >
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="sticky top-0 z-10 bg-white pb-2 flex items-center justify-between border-b-2 border-timmys-red/10">
            <h1 className="text-3xl font-script font-bold text-timmys-red">About Timmies</h1>
            {context?.user ? (
              <div className="flex items-center gap-2 rounded-full bg-timmys-white-off border-2 border-timmys-red/20 px-3 py-1 shadow-sm">
                <Avatar className="h-8 w-8 border-2 border-timmys-red/30">
                  <AvatarImage
                    src={userAvatarUrl || undefined}
                    alt={userDisplayName}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-timmys-red text-white">
                    {initialsFrom(userDisplayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="leading-tight text-left">
                  <div className="text-sm font-bold text-gray-900">{userDisplayName}</div>
                  {userHandle ? (
                    <div className="text-xs text-gray-600">{userHandle}</div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6 px-2 overflow-y-auto scrollbar-hide flex-1 pt-4">
            <div className="grid grid-cols-2 gap-2">
              <AddToFarcasterButton
                variant="default"
              />
              <DuneDashboardButton
                variant="default"
              />
            </div>

            <section className="bg-timmys-white-off rounded-timmys-lg p-4 border-2 border-timmys-red/20">
              <h2 className="text-lg font-bold text-timmys-red mb-2">
                What Is $DONUT, Eh?
              </h2>
              <ul className="space-y-2 text-sm text-gray-900 list-disc list-inside">
                <li>$DONUT is a beauty of a store-of-value token on Base</li>
                <li>Mined through a continuous Dutch auction instead of proof-of-work or staking, bud</li>
                <li>Auction revenue keeps $DONUT's liquidity strong like a double-double</li>
              </ul>
            </section>

            <section className="bg-timmys-white-off rounded-timmys-lg p-4 border-2 border-timmys-red/20">
              <h2 className="text-lg font-bold text-timmys-red mb-2">
                How Mining Works, Bud
              </h2>
              <ul className="space-y-2 text-sm text-gray-900 list-disc list-inside">
                <li>Only one hoser at a time can be King Glazer, eh</li>
                <li>The right to mine is bought with ETH through a continuous Dutch auction:</li>
                <li className="pl-6 list-none">- Price doubles after each purchase, like ordering a second double-double</li>
                <li className="pl-6 list-none">- Then decays to 0 over one hour</li>
                <li className="pl-6 list-none">- Anyone can grab control at the current price</li>
              </ul>
            </section>

            <section className="bg-timmys-white-off rounded-timmys-lg p-4 border-2 border-timmys-red/20">
              <h2 className="text-lg font-bold text-timmys-red mb-2">
                How We Split the Loonies
              </h2>
              <ul className="space-y-2 text-sm text-gray-900 list-disc list-inside">
                <li>80% → previous King Glazer (good on ya, bud!)</li>
                <li>15% → treasury (the Blazery)</li>
                <li>5% → provider (the shop owner, eh)</li>
              </ul>
            </section>

            <section className="bg-timmys-white-off rounded-timmys-lg p-4 border-2 border-timmys-red/20">
              <h2 className="text-lg font-bold text-timmys-red mb-2">
                Fresh Donuts Schedule
              </h2>
              <ul className="space-y-2 text-sm text-gray-900 list-disc list-inside">
                <li>Starts at 4 DONUT / sec (always fresh!)</li>
                <li>Halving every 30 days, eh</li>
                <li>Tail emission: 0.01 DONUT / sec (forever, bud)</li>
              </ul>
            </section>

            <section className="bg-timmys-white-off rounded-timmys-lg p-4 border-2 border-timmys-red/20">
              <h2 className="text-lg font-bold text-timmys-red mb-2">
                Proof of Just-In-Time Stake, Eh
              </h2>
              <ul className="space-y-2 text-sm text-gray-900 list-disc list-inside">
                <li>ETH is "staked" only while you're running the shop</li>
                <li>Profit if the next hoser pays more</li>
                <li>Take a hit if they pay less, sorry bud</li>
                <li>Earn $DONUT the whole time you're King Glazer!</li>
              </ul>
            </section>

            <section className="bg-timmys-white-off rounded-timmys-lg p-4 border-2 border-timmys-red/20">
              <h2 className="text-lg font-bold text-timmys-red mb-2">
                The Treasury (Our Loonie Jar)
              </h2>
              <ul className="space-y-2 text-sm text-gray-900 list-disc list-inside">
                <li>Treasury ETH gets used to buy and burn DONUT-WETH LP in the Blazery, eh</li>
                <li>Once we've got enough loonies saved up, we can upgrade to buy and burn DONUT directly, or the crew can vote on what to do with it</li>
              </ul>
            </section>

            <section className="bg-timmys-white-off rounded-timmys-lg p-4 border-2 border-timmys-red/20 pb-4">
              <h2 className="text-lg font-bold text-timmys-red mb-2">
                Open Your Own Shop, Bud!
              </h2>
              <ul className="space-y-2 text-sm text-gray-900 list-disc list-inside">
                <li>Anyone can open their own Timmies by deploying a frontend, eh</li>
                <li>Add your builder code to earn 5% of all purchases - beauty!</li>
                <li>We're launching with two official shops:</li>
                <li className="pl-6 list-none">- GlazeCorp by @heesh</li>
                <li className="pl-6 list-none">- Pinky Glazer by @bigbroc</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <NavBar />
    </main>
  );
}
