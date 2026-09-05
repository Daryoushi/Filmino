import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await context.params;
    const pathString = path.join("/");
    const searchParams = request.nextUrl.searchParams;

    const url = new URL(`${TMDB_BASE_URL}/${pathString}`);

    // Forward all incoming search parameters
    searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (TMDB_ACCESS_TOKEN) {
      headers["Authorization"] = `Bearer ${TMDB_ACCESS_TOKEN}`;
    } else if (TMDB_API_KEY) {
      url.searchParams.set("api_key", TMDB_API_KEY);
    }

    const response = await fetch(url.toString(), {
      headers,
      next: { revalidate: 3600 }, // Cache on Next.js server for 1 hour
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: "TMDB API error", details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("TMDB Proxy Route Handler Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error in TMDB Proxy" },
      { status: 500 }
    );
  }
}
