// ══════════════════════════════════════════════════════════
// POST /api/transcribe — Trascrizione audio con Whisper
// Riceve un file audio (WebM/OGG/WAV) e restituisce il testo
// ══════════════════════════════════════════════════════════
import { Router, Request, Response } from "express";
import multer from "multer";
// Use native FormData (Node 18+) and native fetch
import { ENV } from "./_core/env";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

router.post("/api/transcribe", upload.single("audio"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nessun file audio ricevuto" });
    }

    const forgeUrl = ENV.forgeApiUrl?.replace(/\/+$/, "");
    const forgeKey = ENV.forgeApiKey;

    if (!forgeUrl || !forgeKey) {
      return res.status(500).json({ error: "Configurazione API mancante" });
    }

    // Determina l'estensione dal mimetype
    const mime = req.file.mimetype || "audio/webm";
    let ext = "webm";
    if (mime.includes("ogg")) ext = "ogg";
    else if (mime.includes("wav")) ext = "wav";
    else if (mime.includes("mp4") || mime.includes("m4a")) ext = "mp4";
    else if (mime.includes("mpeg") || mime.includes("mp3")) ext = "mp3";

    const form = new (globalThis as any).FormData();
    const blob = new (globalThis as any).Blob([req.file!.buffer], { type: mime });
    form.append("file", blob, `audio.${ext}`);
    form.append("model", "whisper-1");
    form.append("language", "it");
    form.append("response_format", "json");

    const whisperRes = await globalThis.fetch(`${forgeUrl}/v1/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${forgeKey}`,
      },
      body: form,
    });

    if (!whisperRes.ok) {
      const errText = await whisperRes.text();
      console.error("Whisper API error:", whisperRes.status, errText);
      return res.status(502).json({ error: "Errore trascrizione", detail: errText });
    }

    const data = (await whisperRes.json()) as { text?: string };
    const text = (data.text || "").trim();

    return res.json({ text });
  } catch (err) {
    console.error("Transcribe error:", err);
    return res.status(500).json({ error: "Errore interno server" });
  }
});

export function registerTranscribeRoute(app: import("express").Express) {
  app.use(router);
}
