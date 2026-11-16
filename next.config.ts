import type { NextConfig } from "next";

import { getSanityImagePath } from "./src/lib/sanity";

const lanHost = process.env.NEXT_DEV_LAN_HOST;
const sanityImagePath = getSanityImagePath();

const nextConfig: NextConfig = {
  allowedDevOrigins: lanHost ? [lanHost] : undefined,
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: sanityImagePath ? [{
      protocol: "https",
      hostname: "cdn.sanity.io",
      pathname: `${sanityImagePath}**`,
      search: "",
    }] : [],
  },
};

export default nextConfig;
