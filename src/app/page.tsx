import React from "react";
import { getSession } from "@/lib/auth";
import { HomeView } from "@/components/home/HomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  return <HomeView session={session} />;
}
