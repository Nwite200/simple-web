import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API endpoint for Higgsfield video URL extraction
  app.get("/api/higgsfield-video", async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) {
        return res.status(400).json({ success: false, error: "URL parameter is required" });
      }

      const response = await fetch(url);
      const html = await response.text();

      // Simple regex to find og:video meta tag content
      const ogVideoRegex = /<meta\s+property=["']og:video["']\s+content=["']([^"']+)["']/i;
      const match = html.match(ogVideoRegex);

      if (match && match[1]) {
        return res.json({ success: true, url: match[1] });
      }

      // Fallback: look for any .mp4 URL in the HTML
      const mp4Regex = /(https:\/\/[^\s"'<>]+\.mp4)/i;
      const mp4Match = html.match(mp4Regex);

      if (mp4Match && mp4Match[1]) {
        return res.json({ success: true, url: mp4Match[1] });
      }

      return res.status(404).json({ success: false, error: "Video URL not found on page" });
    } catch (error) {
      console.error("Error fetching Higgsfield video:", error);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
