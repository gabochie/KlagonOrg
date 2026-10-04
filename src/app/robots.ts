import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The *.txt$ rule is crawl-budget hygiene only. It saves crawlers from
        // fetching ~987 RSC flight payloads, but Disallow cannot de-index a URL
        // that is already indexed or externally linked -- that is what the
        // X-Robots-Tag: noindex rule in public/_headers is for.
        disallow: [
          "/dashboard/",
          "/auth/",
          "/submit",
          "/my/",
          "/field",
          "/*.txt$",
        ],
      },
    ],
    sitemap: "https://klagon.org/sitemap.xml",
  };
}
