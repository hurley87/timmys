"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
  useAccount,
  useConnect,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
  useSimulateContract,
} from "wagmi";
import { base } from "wagmi/chains";
import { formatEther, formatUnits, zeroAddress, type Address, maxUint256 } from "viem";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CONTRACT_ADDRESSES, MULTICALL_ABI } from "@/lib/contracts";
import { cn, getEthPrice } from "@/lib/utils";
import { NavBar } from "@/components/nav-bar";

type MiniAppContext = {
  user?: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  };
};

type AuctionState = {
  epochId: bigint | number;
  initPrice: bigint;
  startTime: bigint | number;
  paymentToken: Address;
  price: bigint;
  paymentTokenPrice: bigint;
  wethAccumulated: bigint;
  wethBalance: bigint;
  paymentTokenBalance: bigint;
};

const DEADLINE_BUFFER_SECONDS = 5 * 60;
const LP_TOKEN_ADDRESS = "0xD1DbB2E56533C55C3A637D13C53aeEf65c5D5703" as Address;

const toBigInt = (value: bigint | number) =>
  typeof value === "bigint" ? value : BigInt(value);

const formatEth = (value: bigint, maximumFractionDigits = 4) => {
  if (value === 0n) return "0";
  const asNumber = Number(formatEther(value));
  if (!Number.isFinite(asNumber)) {
    return formatEther(value);
  }
  return asNumber.toLocaleString(undefined, {
    maximumFractionDigits,
  });
};

const initialsFrom = (label?: string) => {
  if (!label) return "";
  const stripped = label.replace(/[^a-zA-Z0-9]/g, "");
  if (!stripped) return label.slice(0, 2).toUpperCase();
  return stripped.slice(0, 2).toUpperCase();
};

export default function BlazeryPage() {
  const readyRef = useRef(false);
  const autoConnectAttempted = useRef(false);
  const [context, setContext] = useState<MiniAppContext | null>(null);
  const [ethUsdPrice, setEthUsdPrice] = useState<number>(3500);
  const [blazeResult, setBlazeResult] = useState<"success" | "failure" | null>(
    null,
  );
  const [txStep, setTxStep] = useState<"idle" | "approving" | "buying">("idle");
  const blazeResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const resetBlazeResult = useCallback(() => {
    if (blazeResultTimeoutRef.current) {
      clearTimeout(blazeResultTimeoutRef.current);
      blazeResultTimeoutRef.current = null;
    }
    setBlazeResult(null);
  }, []);

  const showBlazeResult = useCallback(
    (result: "success" | "failure") => {
      if (blazeResultTimeoutRef.current) {
        clearTimeout(blazeResultTimeoutRef.current);
      }
      setBlazeResult(result);
      blazeResultTimeoutRef.current = setTimeout(() => {
        setBlazeResult(null);
        blazeResultTimeoutRef.current = null;
      }, 3000);
    },
    [],
  );

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

  // Fetch ETH price on mount and every minute
  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getEthPrice();
      setEthUsdPrice(price);
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 60_000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (blazeResultTimeoutRef.current) {
        clearTimeout(blazeResultTimeoutRef.current);
      }
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

  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const primaryConnector = connectors[0];

  useEffect(() => {
    if (
      autoConnectAttempted.current ||
      isConnected ||
      !primaryConnector ||
      isConnecting
    ) {
      return;
    }
    autoConnectAttempted.current = true;
    connectAsync({
      connector: primaryConnector,
      chainId: base.id,
    }).catch(() => {});
  }, [connectAsync, isConnected, isConnecting, primaryConnector]);

  const { data: rawAuctionState, refetch: refetchAuctionState } =
    useReadContract({
      address: CONTRACT_ADDRESSES.multicall,
      abi: MULTICALL_ABI,
      functionName: "getAuction",
      args: [address ?? zeroAddress],
      chainId: base.id,
      query: {
        refetchInterval: 3_000,
      },
    });

  const auctionState = useMemo(() => {
    if (!rawAuctionState) return undefined;
    return rawAuctionState as unknown as AuctionState;
  }, [rawAuctionState]);

  const ERC20_ABI = [
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
  ] as const;

  useEffect(() => {
    if (!readyRef.current && auctionState) {
      readyRef.current = true;
      sdk.actions.ready().catch(() => {});
    }
  }, [auctionState]);

  const {
    data: txHash,
    writeContract,
    isPending: isWriting,
    reset: resetWrite,
  } = useWriteContract();

  const { data: receipt, isLoading: isConfirming } =
    useWaitForTransactionReceipt({
      hash: txHash,
      chainId: base.id,
    });

  const handleBlaze = useCallback(async () => {
    if (!auctionState) return;
    resetBlazeResult();
    try {
      let targetAddress = address;
      if (!targetAddress) {
        if (!primaryConnector) {
          throw new Error("Wallet connector not available yet.");
        }
        const result = await connectAsync({
          connector: primaryConnector,
          chainId: base.id,
        });
        targetAddress = result.accounts[0];
      }
      if (!targetAddress) {
        throw new Error("Unable to determine wallet address.");
      }

      const price = auctionState.price;
      const epochId = toBigInt(auctionState.epochId);
      const deadline = BigInt(
        Math.floor(Date.now() / 1000) + DEADLINE_BUFFER_SECONDS,
      );
      const maxPaymentTokenAmount = price;

      // If we're in idle or approval failed, start with approval
      if (txStep === "idle") {
        setTxStep("approving");
        await writeContract({
          account: targetAddress as Address,
          address: LP_TOKEN_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.multicall as Address, price],
          chainId: base.id,
        });
        return;
      }

      // If approval succeeded, now call buy
      if (txStep === "buying") {
        await writeContract({
          account: targetAddress as Address,
          address: CONTRACT_ADDRESSES.multicall as Address,
          abi: MULTICALL_ABI,
          functionName: "buy",
          args: [epochId, deadline, maxPaymentTokenAmount],
          chainId: base.id,
        });
      }
    } catch (error) {
      console.error("Failed to blaze:", error);
      showBlazeResult("failure");
      setTxStep("idle");
      resetWrite();
    }
  }, [
    address,
    connectAsync,
    auctionState,
    primaryConnector,
    resetBlazeResult,
    resetWrite,
    showBlazeResult,
    writeContract,
    txStep,
  ]);

  useEffect(() => {
    if (!receipt) return;
    if (receipt.status === "success" || receipt.status === "reverted") {
      if (receipt.status === "reverted") {
        showBlazeResult("failure");
        setTxStep("idle");
        refetchAuctionState();
        const resetTimer = setTimeout(() => {
          resetWrite();
        }, 500);
        return () => clearTimeout(resetTimer);
      }

      // If approval succeeded, now call buy
      if (txStep === "approving") {
        resetWrite();
        setTxStep("buying");
        return;
      }

      // If buy succeeded
      if (txStep === "buying") {
        showBlazeResult("success");
        setTxStep("idle");
        refetchAuctionState();
        const resetTimer = setTimeout(() => {
          resetWrite();
        }, 500);
        return () => clearTimeout(resetTimer);
      }
    }
    return;
  }, [receipt, refetchAuctionState, resetWrite, showBlazeResult, txStep]);

  // Auto-trigger buy after approval
  useEffect(() => {
    if (txStep === "buying" && !isWriting && !isConfirming && !txHash) {
      handleBlaze();
    }
  }, [txStep, isWriting, isConfirming, txHash, handleBlaze]);

  const auctionPriceDisplay = auctionState
    ? formatEth(auctionState.price, auctionState.price === 0n ? 0 : 5)
    : "—";

  const claimableDisplay = auctionState
    ? formatEth(auctionState.wethAccumulated, 8)
    : "—";

  const buttonLabel = useMemo(() => {
    if (!auctionState) return "Loading, Bud…";
    if (blazeResult === "success") return "BEAUTY!";
    if (blazeResult === "failure") return "SORRY, BUD";
    if (isWriting || isConfirming) {
      if (txStep === "approving") return "APPROVING, EH…";
      if (txStep === "buying") return "BLAZING, EH…";
      return "WORKING ON IT…";
    }
    return "BLAZE IT";
  }, [blazeResult, isConfirming, isWriting, auctionState, txStep]);

  const hasInsufficientLP = auctionState && auctionState.paymentTokenBalance < auctionState.price;

  // Calculate profit/loss for blazing
  const blazeProfitLoss = useMemo(() => {
    if (!auctionState) return null;

    // LP token value in USD
    const lpValueInEth = Number(formatEther(auctionState.price)) * Number(formatEther(auctionState.paymentTokenPrice));
    const lpValueInUsd = lpValueInEth * ethUsdPrice;

    // WETH value in USD
    const wethReceivedInEth = Number(formatEther(auctionState.wethAccumulated));
    const wethValueInUsd = wethReceivedInEth * ethUsdPrice;

    const profitLoss = wethValueInUsd - lpValueInUsd;
    const isProfitable = profitLoss > 0;

    return {
      profitLoss,
      isProfitable,
      lpValueInUsd,
      wethValueInUsd,
    };
  }, [auctionState, ethUsdPrice]);

  const isBlazeDisabled =
    !auctionState || isWriting || isConfirming || blazeResult !== null || hasInsufficientLP;

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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-script font-bold text-timmys-red">Blazery</h1>
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

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Card className="border-timmys-red bg-timmys-white-off">
              <CardContent className="grid gap-1.5 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600">
                  PAY
                </div>
                <div className="text-2xl font-semibold text-timmys-red">
                  {auctionPriceDisplay} LP
                </div>
                <div className="text-xs text-gray-600">
                  $
                  {auctionState
                    ? (
                        Number(formatEther(auctionState.price)) *
                        Number(formatEther(auctionState.paymentTokenPrice)) *
                        ethUsdPrice
                      ).toFixed(2)
                    : "0.00"}
                </div>
              </CardContent>
            </Card>

            <Card className="border-timmys-red/20 bg-timmys-white-off">
              <CardContent className="grid gap-1.5 p-2.5">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-gray-600">
                  GET
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  Ξ{claimableDisplay}
                </div>
                <div className="text-xs text-gray-600">
                  $
                  {auctionState
                    ? (
                        Number(formatEther(auctionState.wethAccumulated)) * ethUsdPrice
                      ).toFixed(2)
                    : "0.00"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              className="w-full rounded-timmys-lg bg-timmys-red py-3 text-base font-bold text-white shadow-lg transition-all hover:bg-timmys-red-dark active:scale-98 disabled:cursor-not-allowed disabled:bg-timmys-red/40"
              onClick={handleBlaze}
              disabled={isBlazeDisabled}
            >
              {buttonLabel}
            </Button>

            <div className="flex items-center justify-between px-1">
              <div className="text-xs text-gray-600">
                Available:{" "}
                <span className="text-gray-900 font-semibold">
                  {address && auctionState?.paymentTokenBalance
                    ? formatEth(auctionState.paymentTokenBalance, 4)
                    : "0"}
                </span>{" "}
                DONUT-ETH LP
              </div>
              <a
                href="https://app.uniswap.org/explore/pools/base/0xD1DbB2E56533C55C3A637D13C53aeEf65c5D5703"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-timmys-red hover:text-timmys-red-dark font-semibold transition-colors"
              >
                Get LP →
              </a>
            </div>

            {/* Profit/Loss Warning Message */}
            {blazeProfitLoss && (
              <div className={cn(
                "text-center text-sm font-semibold px-2 py-1.5 rounded-timmys border-2",
                blazeProfitLoss.isProfitable 
                  ? "text-green-700 bg-green-50 border-green-200" 
                  : "text-red-700 bg-red-50 border-red-200"
              )}>
                {blazeProfitLoss.isProfitable ? (
                  <>
                    🍁 Beauty of a blaze, bud! You'll get ${blazeProfitLoss.wethValueInUsd.toFixed(2)} in WETH for ${blazeProfitLoss.lpValueInUsd.toFixed(2)} in LP
                    ({blazeProfitLoss.profitLoss >= 0 ? '+' : ''}${blazeProfitLoss.profitLoss.toFixed(2)})
                  </>
                ) : (
                  <>
                    🥶 Sorry bud, not a great deal eh! You'll get ${blazeProfitLoss.wethValueInUsd.toFixed(2)} in WETH for ${blazeProfitLoss.lpValueInUsd.toFixed(2)} in LP
                    (${blazeProfitLoss.profitLoss.toFixed(2)})
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <NavBar />
    </main>
  );
}
