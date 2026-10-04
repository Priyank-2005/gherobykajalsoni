/** Web app manifest so the POS can be installed on a phone / iPad home screen and open full-screen. */
export function GET() {
  return Response.json(
    {
      name: "Ghero POS",
      short_name: "Ghero POS",
      description: "Billing counter for Ghero by Kajal Soni",
      id: "/pos",
      start_url: "/pos",
      scope: "/pos",
      display: "standalone",
      orientation: "any",
      background_color: "#FAF8F5",
      theme_color: "#722F37",
      icons: [
        { src: "/api/pos/icon?size=192", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/api/pos/icon?size=512", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/api/pos/icon?size=512", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" } }
  );
}
