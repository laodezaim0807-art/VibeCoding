import React, { useState } from "react";
import { 
  BookOpen, 
  Trash2, 
  Play, 
  Clock, 
  Award, 
  BarChart3, 
  ExternalLink, 
  CheckCircle, 
  FileText, 
  FileDown,
  ChevronRight,
  TrendingUp,
  XCircle,
  Video
} from "lucide-react";
import { Quiz, UserAttempt } from "../types";

interface MyLibraryProps {
  quizzes: Quiz[];
  attempts: UserAttempt[];
  onStartQuiz: (quiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
  onClearHistory: () => void;
  onNavigateToCreator: () => void;
  focusView?: 'all' | 'library' | 'history';
}

export default function MyLibrary({ 
  quizzes, 
  attempts, 
  onStartQuiz, 
  onDeleteQuiz, 
  onClearHistory,
  onNavigateToCreator,
  focusView = 'all'
}: MyLibraryProps) {
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // Statistics calculation helpers
  const totalQuizzes = quizzes.length;
  const totalAttempts = attempts.length;
  
  const averageScore = totalAttempts > 0 
    ? Math.round(attempts.reduce((sum, current) => sum + current.score, 0) / totalAttempts) 
    : 0;

  const highestScore = totalAttempts > 0
    ? Math.max(...attempts.map(a => a.score))
    : 0;

  // Render stats ring helper
  const strokeDashoffset = 188 - (188 * averageScore) / 100;

  const showStats = focusView === 'all' || focusView === 'history';
  const showQuizzes = focusView === 'all' || focusView === 'library';
  const showHistoryList = focusView === 'all' || focusView === 'history';

  return (
    <div className="space-y-8" id="my-library-pane">
      
      {/* Visual Analytics Banner */}
      {showStats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Core Stats Overview Row */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-950 rounded-2xl p-6 text-white lg:col-span-2 flex flex-col justify-between relative overflow-hidden subtle-shadow">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 -mr-16 -mt-16 animate-pulse"></div>
            
            <div>
              <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-1">Perkembangan Belajar Anda</span>
              <h2 className="text-2xl md:text-3xl font-display font-bold leading-tight mb-4 text-white">Dasbor Evaluasi Mandiri</h2>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-indigo-800/40 pt-4">
              <div>
                <span className="block text-xs text-indigo-200">Kuis Dibuat</span>
                <span className="text-2xl md:text-3xl font-display font-extrabold text-white mt-1 block">{totalQuizzes}</span>
              </div>
              <div>
                <span className="block text-xs text-indigo-200">Total Latihan</span>
                <span className="text-2xl md:text-3xl font-display font-extrabold text-teal-450 mt-1 block">{totalAttempts}</span>
              </div>
              <div>
                <span className="block text-xs text-indigo-200">Skor Tertinggi</span>
                <span className="text-2xl md:text-3xl font-display font-extrabold text-amber-400 mt-1 block">{highestScore}%</span>
              </div>
            </div>
          </div>

          {/* Circular Average Gauge Ring */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 subtle-shadow flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Rata-Rata Nilai</span>
              <h3 className="text-lg font-display font-black text-slate-800 dark:text-slate-200">Evaluasi Belajar</h3>
              <p className="text-xs text-slate-450 dark:text-slate-400">Nilai rata-rata dari seluruh pengerjaan kuis pustaka Anda.</p>
            </div>

            <div className="relative flex items-center justify-center flex-shrink-0 w-24 h-24">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="30" stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="40" cy="40" r="30" stroke="#4f46e5" strokeWidth="6" fill="transparent" 
                  strokeDasharray="188" 
                  strokeDashoffset={strokeDashoffset} 
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-lg font-display font-black text-slate-800 dark:text-slate-100 block">{averageScore}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Quizzes Library Grid */}
      {showQuizzes && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-md sm:text-lg font-display font-extrabold text-slate-800 dark:text-slate-100">Pustaka Kuis Saya</h3>
              <p className="text-xs text-slate-450 dark:text-slate-400">Simpanan kuis terstruktur yang pernah Anda buat</p>
            </div>
            {totalQuizzes > 0 && (
              <button
                onClick={onClearHistory}
                id="clear-all-data-btn"
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
              >
                Hapus Semua Pustaka
              </button>
            )}
          </div>

          {totalQuizzes === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800" id="empty-library-state">
              <div className="max-w-xs mx-auto space-y-4">
                <div className="inline-flex p-3 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Pustaka Kuis Masih Kosong</h4>
                  <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">Anda belum membuat kuis apa pun. Mulailah merancang kuis AI multimodal perdana Anda!</p>
                </div>
                <button
                  onClick={onNavigateToCreator}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs inline-flex items-center space-x-1 cursor-pointer hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <span>Buat Kuis Baru Sekarang</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="quizzes-grid">
              {quizzes.map((quiz) => {
                // Filters attempts for this quiz
                const quizAttempts = attempts.filter((a) => a.quizId === quiz.id);
                const maxQuizScore = quizAttempts.length > 0 
                  ? Math.max(...quizAttempts.map(a => a.score)) 
                  : null;

                return (
                  <div 
                    key={quiz.id}
                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 subtle-shadow flex flex-col justify-between transition-all hover:border-indigo-100 dark:hover:border-indigo-900/60 relative group"
                  >
                    <div>
                      {/* Source Indicator Badge */}
                      <div className="flex justify-between items-start mb-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          quiz.difficulty === 'Mudah' ? "bg-emerald-50 text-emerald-700" :
                          quiz.difficulty === 'Sedang' ? "bg-indigo-50 text-indigo-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          {quiz.difficulty}
                        </span>

                        <span className="text-[10px] text-slate-400 dark:text-slate-450 flex items-center space-x-1 bg-slate-50 dark:bg-slate-800/40 border border-slate-101/60 dark:border-slate-700 px-2 py-0.5 rounded-full font-semibold">
                          <span>{quiz.questions.length} Soal</span>
                        </span>
                      </div>

                      {/* Quiz Title */}
                      <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-100 mb-1 font-display group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {quiz.title}
                      </h4>

                      {/* Metadata Context */}
                      <p className="text-[11px] text-slate-450 dark:text-slate-400 mb-4 truncate italic">
                        Sumber: {quiz.sourceName}
                      </p>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-2">
                      {/* Score status */}
                      <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-4">
                        <span>Dikerjakan: {quizAttempts.length} kali</span>
                        {maxQuizScore !== null && (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Skor Max: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{maxQuizScore}%</span></span>
                        )}
                      </div>

                      {/* Option controls */}
                      {deleteConfirmationId === quiz.id ? (
                        <div className="bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl flex items-center justify-between text-xs border border-rose-100 dark:border-rose-900/40">
                          <span className="text-rose-800 dark:text-rose-200 font-medium">Hapus kuis ini?</span>
                          <div className="flex space-x-1.5">
                            <button
                              onClick={() => onDeleteQuiz(quiz.id)}
                              className="text-rose-600 dark:text-rose-450 bg-white dark:bg-slate-800 hover:bg-rose-100 px-2 py-1 rounded font-bold"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setDeleteConfirmationId(null)}
                              className="text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-150 px-2 py-1 rounded font-medium"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center gap-2">
                          <button
                            onClick={() => onStartQuiz(quiz)}
                            className="flex-1 bg-indigo-600 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-center space-x-1 transition-all cursor-pointer hover:-translate-y-0.2 active:translate-y-0 font-display focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Mulai Tes</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirmationId(quiz.id)}
                            className="text-slate-400 dark:text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800 cursor-pointer focus:ring-1 focus:ring-rose-500 focus:outline-none"
                            aria-label={`Hapus kuis ${quiz.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Attempt History Table (Detailed logs) */}
      {showHistoryList && attempts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 subtle-shadow space-y-4 animate-fade-in">
          <div>
            <h3 className="text-md font-display font-extrabold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Riwayat Tes Evaluasi Terakhir</span>
            </h3>
            <p className="text-xs text-slate-450 dark:text-slate-400">Review historis performa hasil kuis Anda</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                  <th className="py-2.5 px-3 text-slate-700 dark:text-slate-350 font-bold">Judul Kuis</th>
                  <th className="py-2.5 px-3 text-slate-700 dark:text-slate-350 font-bold">Tanggal Selesai</th>
                  <th className="py-2.5 px-3 text-slate-700 dark:text-slate-350 font-bold">Hasil / Nilai</th>
                  <th className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-350 font-bold font-sans">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attempts.slice().reverse().map((attempt) => {
                  const date = new Date(attempt.completedAt);
                  const formattedDate = `${date.toLocaleDateString("id-ID")} • ${date.toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB`;
                  const isPassed = attempt.score >= 70;

                  return (
                    <tr key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100 max-w-xs truncate">{attempt.quizTitle}</td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{formattedDate}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{attempt.score}%</span>{" "}
                        <span className="text-slate-450 dark:text-slate-450 font-normal">({attempt.correctCount}/{attempt.totalQuestions})</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPassed ? "bg-emerald-55 text-emerald-700" : "bg-rose-50 text-rose-700"
                        }`}>
                          {isPassed ? "LULUS" : "REMIDI"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showHistoryList && attempts.length === 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-10 text-center border border-slate-101 dark:border-slate-800 animate-fade-in">
          <div className="max-w-xs mx-auto space-y-3">
            <TrendingUp className="w-8 h-8 text-slate-300 dark:text-slate-650 mx-auto" />
            <h4 className="text-sm font-semibold text-slate-750 dark:text-slate-300">Belum Ada Riwayat Tes</h4>
            <p className="text-xs text-slate-450 dark:text-slate-400">Selesaikan kuis di pustaka untuk melihat visualisasi performa belajarmu di papan skor ini.</p>
          </div>
        </div>
      )}
    </div>
  );
}
