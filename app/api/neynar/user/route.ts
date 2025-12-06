import { NextRequest, NextResponse } from "next/server";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";

const apiKey = process.env.NEYNAR_API_KEY;
const neynarClient = apiKey ? new NeynarAPIClient(apiKey) : null;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const addressParam = searchParams.get("address");
  console.log("[neynar:user] raw address param:", addressParam);

  if (!addressParam) {
    return NextResponse.json(
      { error: "Missing address parameter." },
      { status: 400 },
    );
  }

  if (!apiKey || !neynarClient) {
    return NextResponse.json(
      { error: "Neynar API key not configured." },
      { status: 503 },
    );
  }

  try {
    const normalizedAddress = addressParam.trim().toLowerCase();
    console.log("[neynar:user] normalized address:", normalizedAddress);
    if (!normalizedAddress) {
      return NextResponse.json(
        { error: "Address parameter is empty." },
        { status: 400 },
      );
    }

    const response = await neynarClient.fetchBulkUsersByEthereumAddress(
      [normalizedAddress]
    );

    const addressKey = Object.keys(response).find(
      key => key.toLowerCase() === normalizedAddress
    );

    const user = addressKey && response[addressKey]?.[0] ? response[addressKey][0] : null;

    if (!user) {
      return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        fid: user.fid ?? null,
        username: user.username ?? null,
        displayName: user.display_name ?? null,
        pfpUrl: user.pfp_url ?? null,
      },
    });
  } catch (error) {
    const status = (error as any)?.response?.status;
    if (status === 404) {
      console.warn("[neynar:user] 404 not found for address:", addressParam);
      return NextResponse.json({ user: null }, { status: 404 });
    }

    console.error("[neynar:user] Error fetching user:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to fetch Neynar user.",
        details: errorMessage
      },
      { status: 500 },
    );
  }
}
