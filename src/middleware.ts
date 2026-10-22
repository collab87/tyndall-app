import { NextResponse, type NextRequest } from "next/server";
import { areaFor } from "./lib/roles";
import { readSession, SESSION_COOKIE } from "./lib/session";

const AREAS = ["developer", "console", "auditor"] as const;

export async function middleware(req: NextRequest) {
  const area = AREAS.find((a) => req.nextUrl.pathname === "/" + a || req.nextUrl.pathname.startsWith("/" + a + "/"));
  if (!area) return NextResponse.next();
  const s = await readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!s) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  const home = areaFor(s.role);
  if (home !== area) return NextResponse.redirect(new URL("/" + home, req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/developer/:path*", "/console/:path*", "/auditor/:path*"] };
