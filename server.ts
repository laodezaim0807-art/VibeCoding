import express, { Request, Response } from "express";
import path from "path";
import multer from "multer";
import fs from "fs";
import os from "os";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up body parsers with increased limits for larger text uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setup multer for memory storage uploads with a 35MB size limit
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 35 * 1024 * 1024 },
});

// Lazy-loaded Gemini AI client helper to avoid crashing if GEMINI_API_KEY is unset on load
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Kunci API Gemini (GEMINI_API_KEY) tidak ditemukan. Silakan konfigurasi di Settings > Secrets di AI Studio."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint to generate quiz using Google Gemini Multimodal API
app.post("/api/generate-quiz", upload.single("file"), async (req: Request, res: Response) => {
  try {
    const { sourceType, textMaterial, youtubeUrl, difficulty, questionCount, modelChoice, format, timeLimit } = req.body;
    
    const count = parseInt(questionCount || "5", 10);
    const difficultyLevel = difficulty || "Sedang";
    const formatValue = format || "pilihan_ganda";
    const timeLimitMinutes = parseInt(timeLimit || "0", 10);
    
    let selectedModel = "gemini-3.5-flash";
    if (modelChoice === "pro") {
      selectedModel = "gemini-3.1-pro-preview";
    } else if (modelChoice === "flash-lite") {
      selectedModel = "gemini-3.1-flash-lite";
    } else if (modelChoice === "flash-latest") {
      selectedModel = "gemini-flash-latest";
    } else if (modelChoice === "flash") {
      selectedModel = "gemini-3.5-flash";
    }

    const ai = getGeminiClient();

    let contentsParts: any[] = [];
    let promptText = "";
    let sourceFileName = "Materi Kustom";

    if (sourceType === "text") {
      if (!textMaterial || textMaterial.trim().length === 0) {
        return res.status(400).json({ error: "Silakan masukkan materi teks terlebih dahulu." });
      }
      contentsParts.push({ text: textMaterial });
      promptText = `Materi teks di atas adalah bahan ajar utama yang harus dianalisis secara mendalam.\n\n`;
      sourceFileName = textMaterial.slice(0, 40) + "...";
    } else if (sourceType === "youtube") {
      if (!youtubeUrl || !youtubeUrl.trim()) {
        return res.status(400).json({ error: "Silakan masukkan tautan YouTube yang valid." });
      }

      let videoTitle = "";
      let videoDescription = "";

      // Try fetching metadata via oEmbed
      try {
        console.log(`Mengambil metadata oEmbed untuk video YouTube: ${youtubeUrl}`);
        const noembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(youtubeUrl)}`);
        if (noembedRes.ok) {
          const noembedData = await noembedRes.json();
          if (noembedData && noembedData.title) {
            videoTitle = noembedData.title;
            console.log(`Metadata YouTube berhasil didapatkan via oEmbed. Judul: "${videoTitle}"`);
          }
        }
      } catch (noembedErr) {
        console.warn("Gagal mengambil metadata YouTube via noembed:", noembedErr);
      }

      // Scraping YouTube page directly as a backup & enrichment
      try {
        console.log(`Mencoba scraping langsung halaman YouTube...`);
        const pageRes = await fetch(youtubeUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          }
        });
        if (pageRes.ok) {
          const html = await pageRes.text();
          const decodeEntities = (str: string) => {
            return str
              .replace(/&quot;/g, '"')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&#39;/g, "'")
              .replace(/&apos;/g, "'");
          };

          if (!videoTitle) {
            const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) || 
                                 html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
            if (ogTitleMatch) {
              videoTitle = decodeEntities(ogTitleMatch[1]);
            } else {
              const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);
              if (titleTagMatch) {
                videoTitle = decodeEntities(titleTagMatch[1].replace(" - YouTube", "").trim());
              }
            }
          }

          const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i) || 
                              html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:description["']/i) ||
                              html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i) ||
                              html.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/i);
          if (ogDescMatch) {
            videoDescription = decodeEntities(ogDescMatch[1]);
          }
          console.log(`Scraping halaman YouTube selesai. Judul: "${videoTitle}", Deskripsi panjang: ${videoDescription?.length || 0} karakter.`);
        }
      } catch (scrapeErr) {
        console.warn("Gagal mengekstrak metadata YouTube via scraping langsung:", scrapeErr);
      }

      sourceFileName = videoTitle ? `${videoTitle} (YouTube)` : youtubeUrl;

      // Unify video metadata directly to generate kuis in one go with internal knowledge
      const youtubeMetadata = `METADATA VIDEO YOUTUBE:
Judul Video: ${videoTitle || "Materi Pelajaran/Video Terkait"}
Deskripsi Video: ${videoDescription || "Tidak ada deskripsi rinci tersedia dari video."}
Tautan Sumber: ${youtubeUrl}`;

      contentsParts.push({ text: youtubeMetadata });
      promptText = `Hasil analisis video YouTube di atas (judul, deskripsi, dan tautan) harus dijadikan acuan utama materi kuis. Tugas Anda adalah mengonstruksikan kuis berdasarkan topik dan rincian materi yang dibahas pada video tersebut.\n\n`;
    } else if (sourceType === "file") {
      if (!req.file) {
        return res.status(400).json({ error: "Silakan unggah berkas PDF, Gambar, Audio, atau Video terlebih dahulu." });
      }
      
      sourceFileName = req.file.originalname;
      const ext = path.extname(req.file.originalname).toLowerCase();
      let mimeType = req.file.mimetype;

      // Robustly correct/remap generic or wrong mime types based on extension
      if (ext === ".pdf") {
        mimeType = "application/pdf";
      } else if (ext === ".jpg" || ext === ".jpeg") {
        mimeType = "image/jpeg";
      } else if (ext === ".png") {
        mimeType = "image/png";
      } else if (ext === ".webp") {
        mimeType = "image/webp";
      } else if (ext === ".gif") {
        mimeType = "image/gif";
      } else if (ext === ".mp3") {
        mimeType = "audio/mp3";
      } else if (ext === ".wav") {
        mimeType = "audio/wav";
      } else if (ext === ".mp4") {
        mimeType = "video/mp4";
      } else if (ext === ".webm") {
        mimeType = "video/webm";
      } else if (ext === ".txt" || ext === ".csv" || ext === ".md") {
        mimeType = "text/plain";
      }

      // If it is a text-based file, read it as UTF-8 directly
      if (ext === ".txt" || ext === ".csv" || ext === ".md" || (mimeType && mimeType.startsWith("text/"))) {
        const textData = req.file.buffer.toString("utf8");
        contentsParts.push({ text: textData });
        promptText = `Materi yang diunggah berupa berkas teks (${req.file.originalname}). Analisis isi teks berikut secara mendalam untuk menyusun pertanyaan kuis:\n\n`;
      } else {
        // Multimedia or binary documents (PDF, Image, Audio, Video)
        try {
          // Use Google Gemini Files API for extremely reliable handling
          const tempDir = os.tmpdir();
          const tempFilePath = path.join(tempDir, `${Date.now()}-${req.file.originalname}`);
          
          await fs.promises.writeFile(tempFilePath, req.file.buffer);
          console.log(`Menulis file sementara untuk diunggah ke Files API: ${tempFilePath}`);
          
          try {
            const uploadResult = await ai.files.upload({
              file: tempFilePath,
              config: {
                mimeType: mimeType,
              }
            });
            
            console.log(`Berkas berhasil diunggah ke Gemini Files API. URI: ${uploadResult.uri}`);
            
            contentsParts.push({
              fileData: {
                fileUri: uploadResult.uri,
                mimeType: uploadResult.mimeType,
              },
            });
            
            promptText = `Materi yang diunggah berupa berkas (${req.file.originalname}, tipe MIME: ${mimeType}). Analisis konten media/dokumen ini secara menyeluruh untuk menyusun kuis:\n\n`;
          } finally {
            // Clean up temporary file immediately after uploading
            await fs.promises.unlink(tempFilePath).catch(unlinkErr => {
              console.warn("Gagal menghapus berkas sementara:", unlinkErr);
            });
          }
        } catch (uploadError: any) {
          console.error("Gagal menggunakan Files API, mencoba fallback ke inlineData base64:", uploadError);
          
          // Fallback to inlineData base64 encoding if Files API fails
          const base64Data = req.file.buffer.toString("base64");
          contentsParts.push({
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          });
          promptText = `Materi yang diunggah berupa berkas bernuansa multimedia (${req.file.originalname}, tipe MIME: ${mimeType}). Analisis konten media ini secara menyeluruh:\n\n`;
        }
      }
    } else {
      return res.status(400).json({ error: "Metode input tidak dikenal." });
    }

    // Append instructions for professional educational quizzes with format options
    promptText += `Bertindaklah sebagai instruktur pendidikan profesional. Buatkan kuis yang sangat relevan, menantang, terstruktur dengan baik, dan edukatif sebanyak ${count} soal dengan tingkat kesulitan tingkat pendidikan '${difficultyLevel}' dan format soal '${formatValue}'.

Aturan pembuatan soal untuk format '${formatValue}':
1. Pastikan total soal yang dihasilkan tepat ${count} butir soal.
2. Jika jenis soal yang dihasilkan (kolom 'type') adalah 'pilihan_ganda':
   - Setiap pertanyaan harus memiliki tepat 4 pilihan jawaban yang masuk akal (opsi A, B, C, D).
   - Salah satu opsi HARUS merupakan jawaban pilihan yang benar. Pilihan jawaban benar dituliskan harus sama persis karakternya dengan salah satu item di dalam daftar pilihan (options).
3. Jika jenis soal yang dihasilkan (kolom 'type') adalah 'esai':
   - Pertanyaan harus berbentuk esai atau tanggapan terbuka yang mendalam.
   - Pilihan jawaban (options) harus dikosongkan (diisi dengan array kosong []).
   - Bidang correctAnswer harus diisi dengan contoh/teladan jawaban ideal yang lengkap, komprehensif, dan tepat sebagai pembanding koreksi.
4. Distribusi tipe soal berdasarkan format '${formatValue}':
   - Pembagian format 'pilihan_ganda': Semua ${count} soal harus bertipe 'pilihan_ganda'.
   - Pembagian format 'esai': Semua ${count} soal harus bertipe 'esai'.
   - Pembagian format 'campuran': Campurkan kedua jenis soal tersebut (misalnya setengah bertipe 'pilihan_ganda' dan setengah bertipe 'esai').
5. Penjelasan (explanation) harus ditulis dalam gaya bahasa ramah, menjelaskan alasan logis ditiap pilihan mengapa satu benar, atau memberikan kriteria nilai utama bagi esai guna membimbing proses belajar mandiri.
6. Gunakan bahasa Indonesia yang baik, baku, dan mudah dipahami.`;

    contentsParts.push({ text: promptText });

    // Call generative model with explicit JSON output schema
    const modelConfig: any = {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "Judul kuis yang representatif dan menarik berdasarkan materi yang disediakan",
          },
          questions: {
            type: Type.ARRAY,
            description: "Daftar butir-butir pertanyaan kuis",
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "Wajib bernilai 'pilihan_ganda' atau 'esai'",
                },
                question: {
                  type: Type.STRING,
                  description: "Pertanyaan yang menantang dan bebas dari ambigu fisik",
                },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Untuk pilihan ganda, berikan tepat 4 pilihan alternatif. Untuk kuis esai, isi dengan []",
                },
                correctAnswer: {
                  type: Type.STRING,
                  description: "Untuk pilihan ganda, isi dengan nilai string opsi yang benar. Untuk esai, isi dengan teladan jawaban ideal terperinci",
                },
                explanation: {
                  type: Type.STRING,
                  description: "Keterangan, penalaran, atau penyampaian konsep kunci bagi jawaban tersebut secara edukatif",
                },
              },
              required: ["type", "question", "options", "correctAnswer", "explanation"],
            },
          },
        },
        required: ["title", "questions"],
      },
    };

    // No search grounding tool is attached to Step 2 so we don't conflict with JSON responseSchema.

    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: { parts: contentsParts },
      config: modelConfig,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Model AI mengembalikan respons kosong.");
    }

    let quizData: any;
    try {
      let cleanedText = responseText.trim();
      
      // 1. Try extracting json inside standard markdown code blocks
      const markdownMatch = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (markdownMatch && markdownMatch[1]) {
        cleanedText = markdownMatch[1].trim();
      }

      try {
        quizData = JSON.parse(cleanedText);
      } catch (innerErr: any) {
        // 2. Fallback: Seek the first '{' and the last '}' to extract the raw JSON object
        const firstBrace = cleanedText.indexOf("{");
        const lastBrace = cleanedText.lastIndexOf("}");
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          const substringCleaned = cleanedText.substring(firstBrace, lastBrace + 1).trim();
          quizData = JSON.parse(substringCleaned);
        } else {
          throw new Error("Tidak menemukan objek JSON ({ ... }) dalam hasil AI: " + innerErr.message);
        }
      }
    } catch (parseError: any) {
      console.error("Gagal mengurai JSON kuis dari model:", parseError);
      console.error("Respons mentah model:", responseText);
      throw new Error("Gagal mengurai respons kuis dari AI: " + parseError.message);
    }
    
    // Inject client-side IDs for easier list track
    const quizResponse = {
      id: "quiz_" + Math.random().toString(36).substr(2, 9),
      title: quizData.title || `Kuis ${difficultyLevel} - ${new Date().toLocaleDateString("id-ID")}`,
      sourceType,
      sourceName: sourceFileName,
      difficulty: difficultyLevel,
      format: formatValue,
      timeLimit: timeLimitMinutes,
      questions: (quizData.questions || []).map((q: any, idx: number) => ({
        id: `q_${idx + 1}`,
        type: q.type || (formatValue === "esai" ? "esai" : "pilihan_ganda"),
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || "Tidak ada penjelasan tambahan.",
      })),
      createdAt: new Date().toISOString(),
    };

    return res.json(quizResponse);
  } catch (error: any) {
    console.error("Kesalahan pembuatan kuis:", error);
    return res.status(500).json({
      error: error.message || "Gagal membuat kuis karena kesalahan internal server.",
    });
  }
});

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Vite Middleware & static assets logic
async function bootstrap() {
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
    console.log(`Server AI Quiz Generator berjalan di port: http://localhost:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error("Gagal melakukan bootstrap server:", err);
});
