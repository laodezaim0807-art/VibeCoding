import React, { useState, useRef, useEffect } from "react";
import { 
  FileText, 
  Youtube, 
  FileUp, 
  Settings, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  HelpCircle,
  Clock,
  Loader2,
  File,
  XCircle,
  Check,
  Trash2
} from "lucide-react";
import { Quiz } from "../types";

interface QuizCreatorProps {
  onQuizGenerated: (quiz: Quiz) => void;
  onboardingStep?: number | null;
  setOnboardingStep?: (step: number | null) => void;
}

// Sample Templates
const templates = {
  sains: {
    title: "Sains (Fotosintesis)",
    content: "Fotosintesis adalah proses biokimia yang dilakukan oleh tumbuhan, alga, dan beberapa jenis bakteri untuk memproduksi energi makanan (glukosa) dengan menggunakan bantuan energi cahaya matahari. Proses ini sangat penting bagi kelangsungan hidup di Bumi karena menghasilkan oksigen yang dihirup oleh makhluk hidup lain. Di dalam sel tumbuhan, proses ini terjadi di dalam organel khusus yang disebut kloroplas, khususnya pada bagian klorofil yang menyerap spektrum cahaya merah dan biru. Reaksi kimia fotosintesis secara sederhana dapat dirumuskan sebagai: Karbon Dioksida (CO2) bereaksi dengan Air (H2O) memanfaatkan energi sinar matahari menghasilkan Glukosa (C6H12O6) dan Oksigen (O2). Tumbuhan menyerap air melalui jaringan xylem di akar dan menyerap karbon dioksida dari udara bebas melalui pori-pori stomata pada daun. Glukosa yang dihasilkan kemudian digunakan sebagai bahan bakar metabolisme sel, atau disimpan dalam bentuk amilum (pati) untuk cadangan makanan jangka panjang."
  },
  sejarah: {
    title: "Sejarah (Proklamasi)",
    content: "Proklamasi Kemerdekaan Indonesia dilaksanakan pada hari Jumat, 17 Agustus 1945 Masehi, atau menurut kalender Jepang adalah tanggal 17 Agustus 2605, yang dibacakan oleh Ir. Soekarno didampingi oleh Drs. Mohammad Hatta di sebuah rumah hibah dari Faradj Martak di Jalan Pegangsaan Timur No. 56, Jakarta Pusat. Momentum bersejarah ini menandai lahirnya negara Kesatuan Republik Indonesia (NKRI) dan berakhirnya belenggu penjajahan kolonialisme Belanda serta pendudukan militer Jepang di nusantara. Kejadian proklamasi diawali oleh peristiwa Rengasdengklok, di mana para pemuda pejuang menculik Soekarno dan Hatta untuk mendesak agar proklamasi kemerdekaan dilakukan secepatnya pasca kekalahan Jepang dari Sekutu karena bom atom Hiroshima dan Nagasaki. Naskah proklamasi dirumuskan dengan penuh perjuangan di rumah Laksamana Maeda dan diketik ulang menggunakan mesin ketik manual oleh Sayuti Melik dengan tulisan tangan asli yang mengalami sedikit penyesuaian tata bahasa."
  },
  matematika: {
    title: "Matematika (Persamaan Linear)",
    content: "Persamaan linear satu variabel adalah kalimat terbuka yang dihubungkan oleh tanda sama dengan (=) dan hanya mempunyai satu variabel dengan pangkat tertinggal bernilai satu. Kalimat terbuka artinya sebuah pernyataan matematika yang belum diketahui nilai kebenarannya secara pasti karena mengandung suatu peubah atau variabel bebas. Bentuk umum dari persamaan linear satu variabel adalah ax + b = c, dengan syarat nilai a tidak boleh sama dengan nol, di mana x bertindak sebagai variabel, a sebagai koefisien, b dan c sebagai konstanta bilangan real. Untuk menyelesaikan persamaan ini, kita menggunakan konsep operasi setara pada kedua ruas kiri dan kanan, yaitu dapat menambah atau mengurangi kedua ruas dengan angka yang sama, serta mengalikan atau membagi kedua ruas dengan bilangan bukan nol yang sama sampai variabel x terisolasi sendiri di satu pihak dan menghasilkan nilai penyelesaian yang benar."
  }
};

export default function QuizCreator({ onQuizGenerated, onboardingStep, setOnboardingStep }: QuizCreatorProps) {
  const [sourceType, setSourceType] = useState<'text' | 'file' | 'youtube'>("text");
  const [textMaterial, setTextMaterial] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [difficulty, setDifficulty] = useState<'Mudah' | 'Sedang' | 'Sulit'>("Sedang");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [modelChoice, setModelChoice] = useState<'flash' | 'pro' | 'flash-lite' | 'flash-latest'>("flash");
  const [format, setFormat] = useState<'pilihan_ganda' | 'esai' | 'campuran'>("pilihan_ganda");
  
  // Custom Time Limits
  const [timeMode, setTimeMode] = useState<string>("0"); // "0", "15", "30", "45", "60", "90", "custom"
  const [customTime, setCustomTime] = useState<number>(10);
  const [timeLimit, setTimeLimit] = useState<number>(0);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validation States
  const [validationError, setValidationError] = useState<{ field: string; message: string } | null>(null);

  // Templates list dropdown
  const [showTemplates, setShowTemplates] = useState(false);
  const [isUsingExample, setIsUsingExample] = useState(false);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Model choice description tooltip hover state
  const [showTooltip, setShowTooltip] = useState(false);

  // Close example template list when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync custom/timeMode to timeLimit
  useEffect(() => {
    if (timeMode === "custom") {
      setTimeLimit(customTime);
    } else {
      setTimeLimit(parseInt(timeMode, 10));
    }
  }, [timeMode, customTime]);

  // List of professional loading messages to display in sequence
  const loadingStops = [
    "Mengunggah materi Anda ke pipa AI...",
    "Gemini sedang menganalisis materi multimedia Anda...",
    "Menemukan poin penting pelajaran...",
    "Merancang butir soal penantang yang mendalam...",
    "Menyusun penjelasan edukatif bagi setiap soal...",
    "Menghaluskan opsi jawaban alternatif...",
    "Hampir siap! Menyelesaikan format kuis..."
  ];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isGenerating) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isGenerating) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setErrorMsg(null);
    setValidationError(null);
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (file.size > maxSize) {
      setValidationError({ field: "media-file-input", message: "Berkas terlalu besar. Batas maksimal ukuran berkas adalah 30MB." });
      document.getElementById("media-file-input")?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setUploadedFile(file);
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper for toggle group coloring
  const getToggleStyle = (isActive: boolean) => {
    return `transition-all duration-150 ease-in-out cursor-pointer text-xs sm:text-sm font-semibold rounded-xl py-3 px-4 flex items-center justify-center space-x-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
      isActive 
        ? "bg-indigo-600 text-white border border-transparent shadow-md" 
        : "bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-[#F9FAFB] dark:hover:bg-slate-800/50"
    }`;
  };

  const handleApplyTemplate = (type: keyof typeof templates) => {
    setTextMaterial(templates[type].content);
    setIsUsingExample(true);
    setShowTemplates(false);
    setValidationError(null);
  };

  const handleClearExample = () => {
    setTextMaterial("");
    setIsUsingExample(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setValidationError(null);

    // Form Validations according to requirement 2
    if (sourceType === "text") {
      const charCount = textMaterial.trim().length;
      if (charCount === 0) {
        setValidationError({ field: "textMaterial", message: "Materi wajib diisi" });
        setTimeout(() => {
          document.getElementById("textMaterial")?.scrollIntoView({ behavior: "smooth", block: "center" });
          document.getElementById("textMaterial")?.focus();
        }, 50);
        return;
      }
      if (charCount < 100) {
        setValidationError({ field: "textMaterial", message: "Teks terlalu pendek, minimal 100 karakter" });
        setTimeout(() => {
          document.getElementById("textMaterial")?.scrollIntoView({ behavior: "smooth", block: "center" });
          document.getElementById("textMaterial")?.focus();
        }, 50);
        return;
      }
    } else if (sourceType === "youtube") {
      if (!youtubeUrl.trim()) {
        setValidationError({ field: "youtubeUrl", message: "Tautan YouTube wajib diisi" });
        setTimeout(() => {
          document.getElementById("youtubeUrl")?.scrollIntoView({ behavior: "smooth", block: "center" });
          document.getElementById("youtubeUrl")?.focus();
        }, 50);
        return;
      }
      if (!youtubeUrl.includes("youtube.com") && !youtubeUrl.includes("youtu.be")) {
        setValidationError({ field: "youtubeUrl", message: "Format tautan YouTube tidak valid" });
        setTimeout(() => {
          document.getElementById("youtubeUrl")?.scrollIntoView({ behavior: "smooth", block: "center" });
          document.getElementById("youtubeUrl")?.focus();
        }, 50);
        return;
      }
    } else if (sourceType === "file") {
      if (!uploadedFile) {
        setValidationError({ field: "media-file-input", message: "Berkas materi wajib diunggah" });
        setTimeout(() => {
          document.getElementById("media-file-block")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
        return;
      }
    }

    setIsGenerating(true);

    // Dynamic rotation of loading messages
    let stage = 0;
    setLoadingMessage(loadingStops[0]);
    const interval = setInterval(() => {
      stage = (stage + 1) % loadingStops.length;
      setLoadingMessage(loadingStops[stage]);
    }, 3200);

    try {
      const formData = new FormData();
      formData.append("sourceType", sourceType);
      formData.append("difficulty", difficulty);
      formData.append("questionCount", questionCount.toString());
      formData.append("modelChoice", modelChoice);
      formData.append("format", format);
      formData.append("timeLimit", timeLimit.toString());

      if (sourceType === "text") {
        formData.append("textMaterial", textMaterial);
      } else if (sourceType === "youtube") {
        formData.append("youtubeUrl", youtubeUrl);
      } else if (sourceType === "file") {
        formData.append("file", uploadedFile!);
      }

      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        body: formData,
      });

      let responseData: any;
      if (!response.ok) {
        let errorText = "Gagal membuat kuis hibrida.";
        try {
          const rawText = await response.text();
          if (
            rawText.trim().toLowerCase().startsWith("<!doctype") ||
            rawText.includes("<html") ||
            rawText.includes("Cookie check") ||
            rawText.includes("Action required to load your app")
          ) {
            throw new Error("COOKIE_CHECK_REQUIRED");
          }
          try {
            const errJson = JSON.parse(rawText);
            errorText = errJson.error || errorText;
          } catch {
            if (rawText.toLowerCase().includes("timeout") || rawText.toLowerCase().includes("gateway")) {
              errorText = "Pengolahan materi timeout atau waktu habis. Coba kurangi jumlah soal atau ganti dengan rangkuman teks yang lebih pendek.";
            } else if (rawText) {
              errorText = `Kesalahan Server (${response.status}): ${rawText.substring(0, 150)}`;
            } else {
              errorText = `Terjadi kesalahan internal server dengan status HTTP ${response.status}.`;
            }
          }
        } catch (innerErr: any) {
          if (innerErr.message === "COOKIE_CHECK_REQUIRED") {
            throw innerErr;
          }
          errorText = `Terjadi kesalahan dengan status HTTP ${response.status}.`;
        }
        throw new Error(errorText);
      }

      const rawResponseText = await response.text();
      if (
        rawResponseText.trim().toLowerCase().startsWith("<!doctype") ||
        rawResponseText.includes("<html") ||
        rawResponseText.includes("Cookie check") ||
        rawResponseText.includes("Action required to load your app")
      ) {
        throw new Error("COOKIE_CHECK_REQUIRED");
      }

      try {
        responseData = JSON.parse(rawResponseText);
      } catch (jsonErr: any) {
        console.error("Gagal mengurai respons JSON:", jsonErr);
        console.error("Respons mentah dari server:", rawResponseText);
        throw new Error(`Gagal mengurai respons dari server kecerdasan buatan. Respons mentah: ${rawResponseText.substring(0, 200)}...`);
      }

      // Show temporary successful generation screen
      setSuccessMsg("Kuis berhasil didefinisikan! Menyiapkan ruang uji coba untuk Anda...");
      
      // Delay response so user sees the success feedback
      setTimeout(() => {
        onQuizGenerated(responseData);
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Gagal menghubungi API AI Quiz Generator.");
      // Scroll to error alert automatically
      setTimeout(() => {
        document.getElementById("error-banner")?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      clearInterval(interval);
      setIsGenerating(false);
    }
  };

  // Text material progress bar details
  const charactersCount = textMaterial.length;
  const charactersPercentage = Math.min((charactersCount / 10000) * 100, 100);
  
  // Progress bar color
  let progressColorClass = "bg-slate-300";
  if (charactersCount >= 100 && charactersCount <= 8000) {
    progressColorClass = "bg-emerald-500";
  } else if (charactersCount > 8000) {
    progressColorClass = "bg-amber-500";
  }

  // Textarea change and clamp at 10k limit
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isGenerating) return;
    const value = e.target.value;
    if (value.length <= 10000) {
      setTextMaterial(value);
      if (isUsingExample && value !== templates.sains.content && value !== templates.sejarah.content && value !== templates.matematika.content) {
        // user tweaked example, remove Contoh label
        setIsUsingExample(false);
      }
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-8 border border-slate-100 dark:border-slate-800 ${
      onboardingStep ? "ring-4 ring-indigo-500/30 ring-offset-2" : "subtle-shadow"
    }`} id="quiz-creator-pane">
      
      {/* Title block */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2.5 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 rounded-xl relative">
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-slate-800 dark:text-white">
            Pembuat Kuis AI Multimodal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-450">Ubah dokumen, gambar, video, audio, atau teks menjadi kuis interaktif</p>
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-start space-x-3 text-emerald-800 dark:text-emerald-300" id="success-banner" role="alert">
          <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-emerald-500" />
          <div className="text-sm">
            <span className="font-bold block mb-0.5">Selesai Berhasil!</span>
            <p>{successMsg}</p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl flex items-start space-x-3 text-rose-800 dark:text-rose-300" id="error-banner" role="alert">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-rose-400" />
          <div className="text-sm w-full">
            <span className="font-semibold block mb-1">Materi Gagal Diproses</span>
            {errorMsg === "COOKIE_CHECK_REQUIRED" ? (
              <div className="space-y-3">
                <p className="text-rose-700 dark:text-rose-300 leading-relaxed text-xs sm:text-sm">
                  Browser Anda memblokir cookie keamanan sistem karena aplikasi dimuat di bawah lingkungan bingkai (iframe). 
                  Tekan tombol di bawah untuk membuka aplikasi di tab tersendiri agar proses kuis bertenaga kecerdasan buatan dapat berlari lancar.
                </p>
                <div>
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-medium text-xs rounded-xl shadow-md transition-all whitespace-nowrap"
                  >
                    <span>🎯 Buka Aplikasi di Tab Baru</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ) : (
              <p>{errorMsg}</p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-6">
         {/* Input Source Selector Tab - Mobile Horizontal Scroll Custom */}
        <div className={onboardingStep === 1 ? "ring-2 ring-indigo-600 p-2 rounded-xl bg-indigo-50/20" : ""}>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center">
              Pilih Sumber Materi
              <span className="text-rose-500 font-bold ml-1">*</span>
            </label>
            {onboardingStep === 1 && (
              <div className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-bounce">
                💡 Panduan 1/3
              </div>
            )}
          </div>

          {/* Tab Selector Buttons */}
          <div className="relative">
            <div className="flex overflow-x-auto pb-1.5 gap-2.5 sm:grid sm:grid-cols-3 snap-x scrollbar-none">
              <button
                type="button"
                id="source-text-btn"
                disabled={isGenerating}
                onClick={() => { setSourceType("text"); removeFile(); setValidationError(null); }}
                className={`snap-align-start shrink-0 min-w-[130px] sm:min-w-0 ${getToggleStyle(sourceType === "text")}`}
                aria-label="Pilih sumber berupa teks pelajari"
                aria-pressed={sourceType === "text"}
              >
                <FileText className="w-4 h-4" />
                <span>Teks/Catatan</span>
              </button>

              <button
                type="button"
                id="source-file-btn"
                disabled={isGenerating}
                onClick={() => { setSourceType("file"); setValidationError(null); }}
                className={`snap-align-start shrink-0 min-w-[130px] sm:min-w-0 ${getToggleStyle(sourceType === "file")}`}
                aria-label="Pilih sumber berupa unggah berkas PDF gambar audio video"
                aria-pressed={sourceType === "file"}
              >
                <FileUp className="w-4 h-4" />
                <span>Unggah Berkas</span>
              </button>

              <button
                type="button"
                id="source-youtube-btn"
                disabled={isGenerating}
                onClick={() => { setSourceType("youtube"); removeFile(); setValidationError(null); }}
                className={`snap-align-start shrink-0 min-w-[130px] sm:min-w-0 ${getToggleStyle(sourceType === "youtube")}`}
                aria-label="Pilih sumber berupa rujukan video Youtube"
                aria-pressed={sourceType === "youtube"}
              >
                <Youtube className="w-4 h-4" />
                <span>Video YouTube</span>
              </button>
            </div>
          </div>

          {/* Onboarding step 1 tooltip feedback overlay */}
          {onboardingStep === 1 && setOnboardingStep && (
            <div className="mt-2.5 bg-indigo-950 text-white text-xs p-3 rounded-xl shadow-lg relative flex flex-col sm:flex-row items-center justify-between gap-2.5 z-20">
              <span>Pilih tipe dokumen belajarmu: ketik teks langsung, unggah file pelajaran, atau tempel url video YouTube.</span>
              <button
                type="button"
                onClick={() => setOnboardingStep(2)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold px-3 py-1 rounded-lg text-[11px] whitespace-nowrap cursor-pointer transition-colors"
              >
                Lanjut ke Pengaturan
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Content Panel based on Tab */}
        <div className={`p-4 sm:p-5 rounded-2xl border min-h-[160px] flex flex-col justify-center transition-all ${
          validationError 
            ? "border-rose-300 bg-rose-50/5" 
            : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"
        }`}>
          {sourceType === "text" && (
            <div className="space-y-2.5" id="panel-text-material">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                <label htmlFor="textMaterial" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center">
                  Materi Teks Pelajaran
                  <span className="text-rose-500 font-bold ml-1">*</span>
                  {isUsingExample && (
                    <span className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded-md text-[9px] font-black ml-2 uppercase">Contoh</span>
                  )}
                </label>

                {/* Templates Selection Group */}
                <div className="flex items-center space-x-2.5 justify-between sm:justify-end">
                  <div className="relative" ref={templateMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      disabled={isGenerating}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-bold hover:underline py-1 cursor-pointer flex items-center space-x-0.5"
                    >
                      <span>Coba contoh teks →</span>
                    </button>
                    {showTemplates && (
                      <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-30 transition-all font-sans text-left">
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider px-2 py-1 border-b border-slate-50 dark:border-slate-800">Filter Topik Edukasi:</div>
                        <ul className="mt-1 space-y-0.5">
                          <li>
                            <button
                              type="button"
                              onClick={() => handleApplyTemplate("sains")}
                              className="w-full text-left text-xs px-2 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium"
                            >
                              Sains (Biologi - Fotosintesis)
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => handleApplyTemplate("sejarah")}
                              className="w-full text-left text-xs px-2 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium"
                            >
                              Sejarah (Kemerdekaan Indonesia)
                            </button>
                          </li>
                          <li>
                            <button
                              type="button"
                              onClick={() => handleApplyTemplate("matematika")}
                              className="w-full text-left text-xs px-2 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium"
                            >
                              Matematika (Persamaan Linear)
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Clean Example Text Option */}
                  {isUsingExample && (
                    <button
                      type="button"
                      onClick={handleClearExample}
                      className="bg-transparent hover:text-rose-600 text-slate-400 dark:text-slate-500 flex items-center space-x-0.5 text-[11px] font-bold"
                      title="Hapus teks contoh"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Bersihkan</span>
                    </button>
                  )}

                  {/* Length limit format text */}
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {charactersCount.toLocaleString("id-ID")} / 10.000 karakter
                  </span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  id="textMaterial"
                  value={textMaterial}
                  onChange={handleTextareaChange}
                  disabled={isGenerating}
                  placeholder="Ketik atau tempel rangkuman materi pelajaran, esai, naskah presentasi, atau artikel pendidikan di sini (minimal 100 karakter)..."
                  rows={5}
                  className={`w-full p-4 rounded-xl bg-white dark:bg-slate-900 border focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 text-xs sm:text-sm text-slate-700 dark:text-slate-250 placeholder:text-slate-400 dark:placeholder:text-slate-600 subtle-shadow resize-none ${
                    validationError && validationError.field === "textMaterial"
                      ? "border-rose-500 ring-2 ring-rose-100"
                      : "border-slate-250 dark:border-slate-800"
                  }`}
                  aria-describedby="textarea-help-guide textMaterial-error-msg"
                  aria-invalid={validationError && validationError.field === "textMaterial" ? "true" : "false"}
                />
                
                {charactersCount === 10000 && (
                  <div className="absolute bottom-2 right-3 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                    Batas maksimum tercapai
                  </div>
                )}
              </div>

              {/* Progress bar and informative guide according to Requirement 5 */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${progressColorClass}`}
                    style={{ width: `${charactersPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-405 font-medium" id="textarea-help-guide">
                  <span>Minimal 100 karakter · Optimal 500–3.000 karakter untuk hasil kuis terbaik</span>
                  <span>{charactersPercentage.toFixed(0)}%</span>
                </div>
              </div>

              {/* Validation Feedback */}
              {validationError && validationError.field === "textMaterial" && (
                <p id="textMaterial-error-msg" className="text-xs text-rose-600 font-bold flex items-center space-x-1 mt-1.5 animate-fade-in" role="alert">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>{validationError.message}</span>
                </p>
              )}
            </div>
          )}

          {sourceType === "youtube" && (
            <div className="space-y-3" id="panel-youtube-material">
              <label htmlFor="youtubeUrl" className="text-xs font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Tautan Video YouTube
                <span className="text-rose-500 font-bold ml-1">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Youtube className="h-4 w-4 sm:h-5 sm:w-5 text-rose-500" />
                </div>
                <input
                  type="url"
                  id="youtubeUrl"
                  value={youtubeUrl}
                  disabled={isGenerating}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className={`w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white dark:bg-slate-900 border rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 subtle-shadow text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-650 ${
                    validationError && validationError.field === "youtubeUrl"
                      ? "border-rose-500 ring-2 ring-rose-100"
                      : "border-slate-250 dark:border-slate-800"
                  }`}
                  aria-invalid={validationError && validationError.field === "youtubeUrl" ? "true" : "false"}
                  aria-describedby="youtubeUrl-error-msg"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">AI akan mengolah transkripsi ucapan dan konten pengajaran video YouTube tersebut dalam pengonstruksian kuis.</p>
              
              {/* Validation Feedback */}
              {validationError && validationError.field === "youtubeUrl" && (
                <p id="youtubeUrl-error-msg" className="text-xs text-rose-600 font-bold flex items-center space-x-1 mt-1.5" role="alert">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>{validationError.message}</span>
                </p>
              )}
            </div>
          )}

          {sourceType === "file" && (
            <div id="panel-file-material" className="space-y-2">
              <label htmlFor="media-file-input" className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Unggah Berkas Pelajaran
                <span className="text-rose-500 font-bold ml-1">*</span>
              </label>
              <input
                type="file"
                id="media-file-input"
                name="media-file-input"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isGenerating}
                accept=".pdf,image/*,audio/*,video/*"
                className="hidden"
              />
              
              {!uploadedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  id="media-file-block"
                  onClick={() => !isGenerating && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging 
                      ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20" 
                      : "border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 dark:hover:border-indigo-400"
                  }`}
                >
                  <FileUp className={`w-8 h-8 sm:w-10 sm:h-10 mb-2 transition-colors ${isDragging ? "text-indigo-600" : "text-slate-400 dark:text-slate-500"}`} />
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 text-center font-display">Tarik berkas ke sini atau <span className="text-indigo-600 dark:text-indigo-455 hover:underline">pilih file</span></span>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1.5 text-center">
                    Mendukung PDF, Gambar, Audio, atau Video (MP4) hingga 30 MB
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-205 dark:border-slate-800 flex items-center justify-between subtle-shadow">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                      <File className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="overflow-hidden">
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 block truncate">{uploadedFile.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-805 hover:text-slate-800 dark:hover:text-slate-100 h-fit transition-colors cursor-pointer font-bold"
                  >
                    Ganti Berkas
                  </button>
                </div>
              )}

              {/* Validation Feedback */}
              {validationError && validationError.field === "media-file-input" && (
                <p className="text-xs text-rose-600 font-bold flex items-center space-x-1 mt-1.5" role="alert">
                  <XCircle className="w-4 h-4 text-rose-500" />
                  <span>{validationError.message}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Config Settings Section */}
        <div className={`border-t border-slate-100 dark:border-slate-800 pt-5 space-y-4 ${
          onboardingStep === 2 ? "ring-2 ring-indigo-600 p-3 rounded-xl bg-indigo-50/25" : ""
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center space-x-1.5">
              <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span>Pengaturan Kuis Tambahan</span>
            </h3>
            {onboardingStep === 2 && (
              <div className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-bounce">
                💡 Panduan 2/3
              </div>
            )}
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Format Soal */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Format Soal</label>
              <div className="flex border border-slate-200 dark:border-slate-800 p-1 rounded-xl space-x-1 bg-white dark:bg-slate-900">
                {(['pilihan_ganda', 'esai', 'campuran'] as const).map((formatOpt) => {
                  const mappedName = formatOpt === 'pilihan_ganda' ? 'PilGan' : formatOpt === 'esai' ? 'Esai' : 'Campuran';
                  const isFActive = format === formatOpt;
                  return (
                    <button
                      key={formatOpt}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setFormat(formatOpt)}
                      className={`flex-1 py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-150 ease-in-out cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                        isFActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-850"
                      }`}
                    >
                      {mappedName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Redesigned Waktu Pengerjaan according to Requirement 9 */}
            <div>
              <label htmlFor="timeSelect" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 mr-1" />
                <span>Waktu Pengerjaan</span>
              </label>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <select
                    id="timeSelect"
                    value={timeMode}
                    disabled={isGenerating}
                    onChange={(e) => setTimeMode(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 py-2.5 px-4 pr-8 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm cursor-pointer appearance-none font-semibold"
                  >
                    <option value="0">∞ Tanpa Batas Waktu</option>
                    <option value="15">15 Menit</option>
                    <option value="30">30 Menit</option>
                    <option value="45">45 Menit</option>
                    <option value="60">60 Menit</option>
                    <option value="90">90 Menit</option>
                    <option value="custom">Kustom...</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 dark:text-slate-500 text-[10px]">
                    ▼
                  </div>
                </div>

                {/* Custom numeric range entry box */}
                {timeMode === "custom" && (
                  <div className="flex items-center space-x-1.5 w-full sm:w-28 animate-fade-in">
                    <input
                      type="number"
                      min={1}
                      max={300}
                      value={customTime}
                      disabled={isGenerating}
                      onChange={(e) => setCustomTime(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold py-2 px-3 border border-slate-300 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-center focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">menit</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tingkat Kesulitan */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Tingkat Kesulitan</label>
              <div className="flex border border-slate-200 dark:border-slate-800 p-1 rounded-xl space-x-1 bg-white dark:bg-slate-900">
                {(['Mudah', 'Sedang', 'Sulit'] as const).map((level) => {
                  const isDActive = difficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setDifficulty(level)}
                      className={`flex-1 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all duration-150 ease-in-out cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-none ${
                        isDActive
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-850"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jumlah Pertanyaan */}
            <div>
              <label htmlFor="questionCount" className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Jumlah Pertanyaan</label>
              <div className="relative">
                <select
                  id="questionCount"
                  value={questionCount}
                  disabled={isGenerating}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                  className="w-full bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 py-2.5 px-4 pr-8 rounded-xl text-xs sm:text-sm border border-slate-300 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm cursor-pointer appearance-none font-semibold"
                >
                  {[3, 5, 10, 15, 20].map((num) => (
                    <option key={num} value={num}>
                      {num} Butir Soal {num === 5 ? "(Ideal)" : ""}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400 dark:text-slate-500 text-[10px]">
                  ▼
                </div>
              </div>
            </div>

            {/* AI Engine Choice according to Requirement 3 */}
            <div className="sm:col-span-2">
              <div className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Mesin AI Utama</span>
                <div className="relative">
                  {/* Tooltip trigger button */}
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded"
                    aria-label="Informasi detail mengenai pilihan mesin model AI kuis"
                  >
                    <HelpCircle className="w-4 h-4 cursor-pointer" />
                  </button>

                  {/* Enhanced explanation Tooltip (Requirement 3) */}
                  {showTooltip && (
                    <div className="absolute right-0 bottom-full mb-2 w-72 bg-slate-900 dark:bg-slate-950 text-white text-[11px] p-3 rounded-xl shadow-2xl z-30 leading-relaxed font-sans font-medium animate-fade-in select-none border border-slate-200/10">
                      <p className="font-bold border-b border-white/10 pb-1 mb-1.5 text-indigo-300">Deskripsi Model Gemini</p>
                      Sistem mendukung seluruh rangkaian utama model Gemini API. Mulai dari model Flash super hemat & lincah hingga model Pro bertenaga tinggi untuk penalaran logika mendalam.
                    </div>
                  )}
                </div>
              </div>

              {/* Redesigned checkmark cards with 4 models */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. Gemini 3.5 Flash */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setModelChoice("flash")}
                  className={`relative py-3 px-4 rounded-xl text-left flex flex-col justify-between transition-all duration-150 ease-in-out cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                    modelChoice === "flash"
                      ? "border-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300"
                      : "border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-850"
                  }`}
                  aria-pressed={modelChoice === "flash"}
                >
                  {modelChoice === "flash" && (
                    <span className="absolute top-2.5 right-2.5 bg-indigo-600 text-white rounded-full p-0.5 text-[8px] font-bold" aria-hidden="true">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </span>
                  )}
                  <div>
                    <span className="font-bold block text-sm">Flash v3.5</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mt-1">
                      Gratis · Cepat · Ideal & Cocok untuk kuis harian
                    </span>
                  </div>
                </button>

                {/* 2. Gemini 3.1 Pro */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setModelChoice("pro")}
                  className={`relative py-3 px-4 rounded-xl text-left flex flex-col justify-between transition-all duration-150 ease-in-out cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                    modelChoice === "pro"
                      ? "border-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300"
                      : "border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-850"
                  }`}
                  aria-pressed={modelChoice === "pro"}
                >
                  {modelChoice === "pro" && (
                    <span className="absolute top-2.5 right-2.5 bg-indigo-600 text-white rounded-full p-0.5 text-[8px] font-bold" aria-hidden="true">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </span>
                  )}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold block text-sm">Pro v3.1</span>
                      <span className="bg-amber-100 dark:bg-amber-950/45 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-900/40 shadow-sm animate-pulse">
                        Premium
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mt-1">
                      Berbayar · Logika Terdalam · Kuis kompleks akademis
                    </span>
                  </div>
                </button>

                {/* 3. Gemini 3.1 Flash Lite */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setModelChoice("flash-lite")}
                  className={`relative py-3 px-4 rounded-xl text-left flex flex-col justify-between transition-all duration-150 ease-in-out cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                    modelChoice === "flash-lite"
                      ? "border-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300"
                      : "border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-850"
                  }`}
                  aria-pressed={modelChoice === "flash-lite"}
                >
                  {modelChoice === "flash-lite" && (
                    <span className="absolute top-2.5 right-2.5 bg-indigo-600 text-white rounded-full p-0.5 text-[8px] font-bold" aria-hidden="true">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </span>
                  )}
                  <div>
                    <span className="font-bold block text-sm">Flash Lite v3.1</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mt-1">
                      Gratis · Respons Sangat Cepat · Latensi super rendah
                    </span>
                  </div>
                </button>

                {/* 4. Gemini Flash Latest */}
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => setModelChoice("flash-latest")}
                  className={`relative py-3 px-4 rounded-xl text-left flex flex-col justify-between transition-all duration-150 ease-in-out cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                    modelChoice === "flash-latest"
                      ? "border-2 border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-300"
                      : "border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-[#F9FAFB] dark:hover:bg-slate-850"
                  }`}
                  aria-pressed={modelChoice === "flash-latest"}
                >
                  {modelChoice === "flash-latest" && (
                    <span className="absolute top-2.5 right-2.5 bg-indigo-600 text-white rounded-full p-0.5 text-[8px] font-bold" aria-hidden="true">
                      <Check className="w-3 h-3 text-white stroke-[3px]" />
                    </span>
                  )}
                  <div>
                    <span className="font-bold block text-sm">Flash Latest</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold block mt-1">
                      Gratis · Bawaan Produksi · Versi stabil & andal
                    </span>
                  </div>
                </button>
              </div>

              {/* Documentation anchor */}
              <div className="mt-2.5">
                <a
                  href="https://ai.google.dev/gemini-api/docs/models/gemini"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-805 dark:hover:text-indigo-300 font-bold hover:underline inline-flex items-center space-x-0.5"
                >
                  <span>Pelajari perbedaan model di situs resmi →</span>
                </a>
              </div>
            </div>
          </div>

          {/* Onboarding step 2 tooltip footer navigation inside settings */}
          {onboardingStep === 2 && setOnboardingStep && (
            <div className="mt-4 bg-indigo-950 text-white text-xs p-3 rounded-xl shadow-lg relative flex flex-col sm:flex-row items-center justify-between gap-2.5 z-20 border border-indigo-800">
              <span>Sesuaikan format soal (pilihan ganda/esai/campuran), batas waktu pengerjaan, dan tingkat kesulitan soal yang dirancang AI.</span>
              <button
                type="button"
                onClick={() => setOnboardingStep(3)}
                className="bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold px-3 py-1 rounded-lg text-[11px] whitespace-nowrap cursor-pointer transition-colors"
              >
                Kembali & Kirim Form
              </button>
            </div>
          )}
        </div>

        {/* Action Generate & Progress button (Sticky bottom bar on mobile < 640px) */}
        <div className={onboardingStep === 3 ? "relative z-30" : ""}>
          
          {/* Progress loader and informative label inline above button */}
          {isGenerating && (
            <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40 animate-fade-in text-indigo-800 dark:text-indigo-300 text-xs font-semibold mb-3 flex flex-col gap-2 shadow-sm">
              <div className="flex items-center space-x-2">
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
                <span>{loadingMessage}</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full animate-[loading-bar_15s_infinite_linear]"></div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Wrap Container for Mobile compatibility (Requirement 6) */}
          <div className="sm:relative fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 sm:border-0 sm:p-0 sm:bg-transparent z-40 sm:z-auto shadow-lg sm:shadow-none">
            <button
              type="submit"
              disabled={isGenerating}
              id="generator-submit-btn"
              className={`w-full text-white py-3 px-5 rounded-xl font-bold font-display transition-all flex items-center justify-center space-x-2.5 shadow-md hover:-translate-y-0.5 active:translate-y-0 focus:ring-2 focus:ring-indigo-600 focus:outline-none ${
                isGenerating 
                  ? "bg-slate-400 dark:bg-slate-700 cursor-not-allowed text-slate-100" 
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:shadow-none"
              }`}
              aria-label="Tombol pengiriman formulir pembuat kuis AI"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sedang membuat kuis...</span>
                </>
              ) : (
                <>
                  <span>Buat Kuis AI Sekarang</span>
                  <ArrowRight className="w-5 h-5 animate-pulse" />
                </>
              )}
            </button>
          </div>
          </div>

          {/* Onboarding step 3 tooltip guide feedback */}
          {onboardingStep === 3 && setOnboardingStep && (
            <div className="mt-4 sm:relative fixed bottom-20 left-4 right-4 sm:bottom-auto sm:left-auto sm:right-auto bg-indigo-950 text-white text-xs p-3.5 rounded-xl shadow-xl z-20 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans leading-relaxed border border-indigo-800">
              <div className="flex items-center space-x-1.5">
                <div className="bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded font-black">3/3</div>
                <span>Siap meluncur! Klik tombol untuk memicu model cerdas Gemini merakit kuis instan bagi Anda.</span>
              </div>
              <button
                type="button"
                onClick={() => setOnboardingStep(null)}
                className="bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold px-3 py-1.5 rounded-lg text-[11px] whitespace-nowrap cursor-pointer transition-colors shadow"
              >
                Mulai Gunakan!
              </button>
            </div>
          )}

          {/* Spacer block underneath to prevent sticky bottom navigation overlay from cropping content */}
          <div className="sm:hidden h-16" aria-hidden="true" />
        </div>
      </form>
    </div>
  );
}
