import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award, 
  ArrowRight, 
  RotateCcw, 
  Home, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Percent
} from "lucide-react";
import { Quiz, UserAttempt } from "../types";

interface QuizActiveProps {
  quiz: Quiz;
  onQuizCompleted: (attempt: UserAttempt) => void;
  onExit: () => void;
  userId: string;
}

export default function QuizActive({ quiz, onQuizCompleted, onExit, userId }: QuizActiveProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userSelections, setUserSelections] = useState<{ [questionId: string]: string }>({});
  
  // States for essay questions
  const [essayResponse, setEssayResponse] = useState<string>("");
  const [essayGrade, setEssayGrade] = useState<number | null>(null); // % completeness chosen by user
  const [essayGrades, setEssayGrades] = useState<{ [questionId: string]: number }>({});
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState<UserAttempt | null>(null);
  const [showDetailedReview, setShowDetailedReview] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [totalSecondsSpent, setTotalSecondsSpent] = useState<number>(0);

  const currentQuestion = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;

  // Initialize timer
  useEffect(() => {
    if (quiz.timeLimit && quiz.timeLimit > 0) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  }, [quiz.timeLimit]);

  // Handle ticking intervals
  useEffect(() => {
    if (attemptHistory) return;

    const mainInterval = setInterval(() => {
      setTotalSecondsSpent((prev) => prev + 1);
    }, 1000);

    let countdownInterval: NodeJS.Timeout | null = null;
    if (quiz.timeLimit && quiz.timeLimit > 0) {
      countdownInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleAutoSubmission();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(mainInterval);
      if (countdownInterval) clearInterval(countdownInterval);
    };
  }, [quiz.timeLimit, attemptHistory]);

  // Sync state when moving between questions
  useEffect(() => {
    setIsAnswerRevealed(false);
    if (currentQuestion.type === "esai") {
      setEssayResponse(userSelections[currentQuestion.id] || "");
      setEssayGrade(essayGrades[currentQuestion.id] || null);
      setSelectedOption(null);
    } else {
      setSelectedOption(userSelections[currentQuestion.id] || null);
      setEssayResponse("");
      setEssayGrade(null);
    }
  }, [currentIdx, currentQuestion]);

  const handleOptionClick = (option: string) => {
    if (isAnswerRevealed) return;
    setSelectedOption(option);
  };

  const handleRevealAnswer = () => {
    if (currentQuestion.type === "pilihan_ganda" && !selectedOption) return;
    if (currentQuestion.type === "esai" && essayResponse.trim().length === 0) return;

    setIsAnswerRevealed(true);
    
    if (currentQuestion.type === "pilihan_ganda") {
      const newSelections = { ...userSelections, [currentQuestion.id]: selectedOption! };
      setUserSelections(newSelections);
    } else {
      const newSelections = { ...userSelections, [currentQuestion.id]: essayResponse };
      setUserSelections(newSelections);
      // default grade selection is 60% if not explicitly clicked to avoid 0 scores
      if (essayGrade === null) {
        setEssayGrade(60);
        setEssayGrades({ ...essayGrades, [currentQuestion.id]: 60 });
      }
    }
  };

  const handleEssayGradeSelection = (grade: number) => {
    setEssayGrade(grade);
    setEssayGrades({ ...essayGrades, [currentQuestion.id]: grade });
  };

  const calculateFinalScores = (selections: { [id: string]: string }, grades: { [id: string]: number }) => {
    let correctedCount = 0;
    let accumulatedTotalScore = 0;

    quiz.questions.forEach((q) => {
      if (q.type === "pilihan_ganda") {
        const choice = selections[q.id];
        if (choice && choice.trim() === q.correctAnswer.trim()) {
          correctedCount++;
          accumulatedTotalScore += 100;
        }
      } else {
        const gradeVal = grades[q.id] || 0;
        accumulatedTotalScore += gradeVal;
        if (gradeVal >= 60) {
          correctedCount++; // Treat decent or good essay understanding as a pass/correct counts
        }
      }
    });

    const finalScore = Math.round(accumulatedTotalScore / totalQuestions);

    return {
      finalScore,
      correctedCount
    };
  };

  const handleAutoSubmission = () => {
    if (attemptHistory) return;
    // Assemble results using whatever state is registered up to now
    const ratings = { ...essayGrades };
    // Pre-grade unassessed visible essay question
    quiz.questions.forEach(q => {
      if (q.type === "esai" && !ratings[q.id]) {
        ratings[q.id] = 20; // Default minimal attempt scoring on timeout
      }
    });

    const { finalScore, correctedCount } = calculateFinalScores(userSelections, ratings);

    const attempt: UserAttempt = {
      id: "attempt_" + Math.random().toString(36).substr(2, 9),
      userId,
      quizId: quiz.id,
      quizTitle: quiz.title,
      score: finalScore,
      totalQuestions,
      correctCount: correctedCount,
      answers: userSelections,
      grades: ratings,
      completedAt: new Date().toISOString(),
      timeSpentSeconds: totalSecondsSpent || (quiz.timeLimit ? quiz.timeLimit * 60 : 60),
    };

    setAttemptHistory(attempt);
    onQuizCompleted(attempt);
  };

  const handleNextQuestion = () => {
    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Assemble and trigger normal submission
      const { finalScore, correctedCount } = calculateFinalScores(userSelections, essayGrades);

      const attempt: UserAttempt = {
        id: "attempt_" + Math.random().toString(36).substr(2, 9),
        userId,
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: finalScore,
        totalQuestions,
        correctCount: correctedCount,
        answers: userSelections,
        grades: essayGrades,
        completedAt: new Date().toISOString(),
        timeSpentSeconds: totalSecondsSpent,
      };

      setAttemptHistory(attempt);
      onQuizCompleted(attempt);
    }
  };

  const handleRetake = () => {
    setCurrentIdx(0);
    setUserSelections({});
    setEssayResponse("");
    setEssayGrade(null);
    setEssayGrades({});
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setAttemptHistory(null);
    setShowDetailedReview(false);
    setTotalSecondsSpent(0);
    if (quiz.timeLimit && quiz.timeLimit > 0) {
      setTimeLeft(quiz.timeLimit * 60);
    }
  };

  // Human friendly countdown representation
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (attemptHistory) {
    const isPassing = attemptHistory.score >= 70;
    
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 subtle-shadow border border-slate-100 dark:border-slate-800 text-center animate-fade-in text-slate-800 dark:text-slate-100" id="quiz-results-screen">
        <div className="max-w-2xl mx-auto">
          {/* Celebratory Icon */}
          <div className="inline-flex p-4 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-6 scale-110">
            <Award className="w-12 h-12" />
          </div>

          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block uppercase tracking-widest mb-1.5">Hasil Akhir Evaluasi</span>
          <h2 className="text-2xl md:text-3xl font-display font-black text-slate-800 dark:text-white mb-1 leading-snug">{quiz.title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            {quiz.difficulty} • {totalQuestions} Pertanyaan • Selesai dalam {formatTime(attemptHistory.timeSpentSeconds)}
          </p>

          {/* Real Score Gauge */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 mb-8 grid grid-cols-3 gap-4 items-center">
            <div className="text-center border-r border-slate-200 dark:border-slate-700">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">Total Soal</span>
              <span className="text-xl font-display font-bold text-slate-700 dark:text-slate-200">{totalQuestions}</span>
            </div>
            <div className="text-center border-r border-slate-200 dark:border-slate-700">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">Pemahaman Baik</span>
              <span className="text-xl font-display font-bold text-emerald-600 dark:text-emerald-400">{attemptHistory.correctCount}</span>
            </div>
            <div className="text-center">
              <span className="block text-xs font-medium text-slate-400 dark:text-slate-500">Rerata Nilai Akhir</span>
              <span className={`text-2xl font-display font-extrabold ${isPassing ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600 dark:text-rose-400"}`}>
                {attemptHistory.score}/100
              </span>
            </div>
          </div>

          <div className="mb-8">
            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
              {isPassing 
                ? "🎉 Kompetensi Luar biasa! Anda berhasil menguasai materi ini dengan tingkat pemahaman akademis yang tinggi!" 
                : "👉 Ayo latih pemahaman Anda! Tinjau pembahasan terperinci di bawah, pelajari kunci esai atau solusi pilihan ganda, lalu ulangi kuis."
              }
            </p>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <button
              onClick={handleRetake}
              id="btn-retry-quiz"
              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center justify-center space-x-1.5 cursor-pointer hover:-translate-y-0.5 transition-transform"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ulangi Evaluasi Kuis</span>
            </button>

            <button
              onClick={() => setShowDetailedReview(!showDetailedReview)}
              id="btn-toggle-review"
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              <span>{showDetailedReview ? "Sembunyikan Kunci & Pembahasan" : "Lihat Kunci & Pembahasan"}</span>
              {showDetailedReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={onExit}
              id="btn-exit-to-home"
              className="px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 font-semibold text-sm flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Ke Perpustakaan</span>
            </button>
          </div>

          {/* Detailed Question Review Panel */}
          {showDetailedReview && (
            <div className="text-left border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6 animate-fade-in" id="detailed-review-panel">
              <h3 className="text-md font-display font-bold text-slate-800 dark:text-white">
                Kunci Jawaban & Penjelasan Komparatif
              </h3>

              {quiz.questions.map((q, idx) => {
                const userAns = attemptHistory.answers[q.id] || "(Tidak menjawab)";
                
                if (q.type === "pilihan_ganda") {
                  const cleanUserAns = userAns.trim();
                  const cleanCorrectAns = q.correctAnswer.trim();
                  const isCorrect = cleanUserAns === cleanCorrectAns;

                  return (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">Soal {idx + 1} (Pilihan Ganda)</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isCorrect ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-450"}`}>
                          {isCorrect ? "Benar" : "Salah"}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white leading-relaxed">{q.question}</h4>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt) => {
                          const isSelectedByU = cleanUserAns === opt.trim();
                          const isCorrectOpt = cleanCorrectAns === opt.trim();

                          return (
                            <div 
                              key={opt}
                              className={`p-2.5 rounded-lg text-xs flex justify-between items-center ${
                                isCorrectOpt 
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 font-medium" 
                                  : isSelectedByU 
                                    ? "bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-400" 
                                    : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                              }`}
                            >
                              <span>{opt}</span>
                              {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                              {isSelectedByU && !isCorrectOpt && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-2.5 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg text-xs leading-relaxed text-slate-650 dark:text-slate-300">
                        <span className="font-semibold block text-slate-700 dark:text-slate-200 mb-0.5">Solusi Analitik:</span>
                        {q.explanation}
                      </div>
                    </div>
                  );
                } else {
                  // Review for essay questions
                  const gradePercent = attemptHistory.grades?.[q.id] || 0;
                  return (
                    <div key={q.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Soal {idx + 1} (Esai)</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400">
                          Kecocokan Solusi: {gradePercent}%
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-white leading-relaxed">{q.question}</h4>
                      
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 block uppercase">Jawaban Anda:</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-sans italic whitespace-pre-wrap">"{userAns}"</p>
                      </div>

                      <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100/70 dark:border-emerald-900/40 space-y-2">
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">Teladan Solusi Akademis:</span>
                        <p className="text-xs text-slate-800 dark:text-slate-100 font-sans font-medium whitespace-pre-wrap">{q.correctAnswer}</p>
                      </div>

                      <div className="mt-2.5 p-3 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-lg text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        <span className="font-semibold block text-slate-700 dark:text-slate-200 mb-0.5">Penjelasan Kriteria Nilai:</span>
                        {q.explanation}
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 subtle-shadow border border-slate-100 dark:border-slate-800 animate-fade-in text-slate-800 dark:text-slate-100" id="active-quiz-game">
      {/* Top Meta Hub */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-6 gap-3">
        <div>
          <span className="text-xs bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider border border-indigo-100/50 dark:border-slate-700">
            {quiz.difficulty}
          </span>
          <h1 className="text-lg md:text-xl font-display font-bold text-slate-800 dark:text-white mt-1.5">{quiz.title}</h1>
        </div>

        {/* Dynamic Timer Section */}
        {quiz.timeLimit > 0 ? (
          <div className="flex items-center gap-3">
            <div className={`flex items-center space-x-2 border rounded-xl py-2 px-3.5 ${
              timeLeft < 30 
                ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-450 font-bold animate-pulse" 
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}>
              <Clock className={`w-4 h-4 ${timeLeft < 30 ? "text-rose-500" : "text-indigo-500"}`} />
              <div className="text-xs font-semibold font-mono tracking-wider">
                Sisa Waktu: {formatTime(timeLeft)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="text-[11px] text-rose-600 dark:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-rose-750 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold cursor-pointer inline-flex items-center space-x-1 transition-colors"
            >
              <span>Keluar Sesi</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 font-bold cursor-pointer inline-flex items-center space-x-1 transition-colors"
          >
            <span>Keluar Sesi</span>
          </button>
        )}
      </div>

      {/* Progress metrics */}
      <div className="mb-6">
        <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase mb-2">
          <span>Pertanyaan {currentIdx + 1} dari {totalQuestions} • {currentQuestion.type === "pilihan_ganda" ? "Pilihan Ganda" : "Soal Esai"}</span>
          <span>{Math.round(((currentIdx) / totalQuestions) * 100)}% Selesai</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Presentation Container */}
      <div className="py-2 mb-6">
        <h2 className="text-base md:text-lg font-semibold text-slate-800 dark:text-white mb-5 leading-relaxed bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 p-4 rounded-xl">
          {currentQuestion.question}
        </h2>

        {/* Conditional Layouts based on Pilihan Ganda vs Esai */}
        {currentQuestion.type === "pilihan_ganda" ? (
          /* Multi-choices options */
          <div className="grid grid-cols-1 gap-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option;
              const cleanOpt = option.trim();
              const cleanCorrect = currentQuestion.correctAnswer.trim();
              const isCorrectOption = cleanOpt === cleanCorrect;
              const isWrongSelection = isSelected && !isCorrectOption;

              let optionStyle = "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800";
              
              if (isAnswerRevealed) {
                if (isCorrectOption) {
                  optionStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 font-medium scale-[1.01]";
                } else if (isWrongSelection) {
                  optionStyle = "border-rose-400 bg-rose-50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300";
                } else {
                  optionStyle = "border-slate-100 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 dark:text-slate-500 opacity-60";
                }
              } else if (isSelected) {
                optionStyle = "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-300 font-medium ring-2 ring-indigo-500/10";
              }

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswerRevealed}
                  className={`w-full py-3.5 px-5 text-left rounded-xl border text-sm transition-all flex justify-between items-center select-option-btn cursor-pointer ${optionStyle}`}
                >
                  <span>{option}</span>
                  {isAnswerRevealed && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />
                  )}
                  {isAnswerRevealed && isWrongSelection && (
                    <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          /* Essay Response Textarea Input */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Jawaban Esai Anda</label>
              <textarea
                value={essayResponse}
                onChange={(e) => setEssayResponse(e.target.value)}
                disabled={isAnswerRevealed}
                placeholder="Tuliskan penjelasan, argumen, atau definisi kunci Anda secara detail dan tuntas..."
                className="w-full bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl p-4 text-sm font-sans min-h-[140px] text-slate-700 dark:text-slate-200 font-medium leading-relaxed shadow-inner placeholder:text-slate-400 dark:placeholder:text-slate-600"
              />
            </div>

            {/* Revealed Solusi Akademis and Self-Assessment widgets */}
            {isAnswerRevealed && (
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4 animate-fade-in">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider block mb-2 w-max">
                    Teladan Solusi Ideal
                  </span>
                  <p className="text-xs md:text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-sans font-medium whitespace-pre-wrap">
                    {currentQuestion.correctAnswer}
                  </p>
                </div>

                {/* Self grading interface requested to rate themselves */}
                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 border border-amber-100 dark:border-amber-900/40 rounded-xl text-center">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-2">
                    Lakukan Evaluasi Mandiri (Seberapa cocok jawaban Anda dengan solusi ideal?)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 20, label: "Kurang Sesuai", desc: "Skor: 20%", style: "border-rose-200 text-rose-800 bg-rose-50 hover:bg-rose-100 dark:border-rose-900/40 dark:text-rose-200 dark:bg-rose-950/20" },
                      { val: 60, label: "Cukup Memenuhi", desc: "Skor: 60%", style: "border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100 dark:border-amber-900/40 dark:text-amber-200 dark:bg-amber-950/20" },
                      { val: 100, label: "Sangat Akurat", desc: "Skor: 100%", style: "border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-900/40 dark:text-emerald-200 dark:bg-emerald-950/20" }
                    ].map((btn) => {
                      const isActive = essayGrade === btn.val;
                      return (
                        <button
                          key={btn.val}
                          type="button"
                          onClick={() => handleEssayGradeSelection(btn.val)}
                          className={`p-2 rounded-lg border text-xs text-center transition-all cursor-pointer flex flex-col justify-center items-center ${
                            isActive 
                              ? "bg-slate-900 dark:bg-slate-800 border-slate-900 dark:border-slate-700 text-white font-bold scale-[1.03]" 
                              : btn.style
                          }`}
                        >
                          <span className="font-semibold">{btn.label}</span>
                          <span className={`${isActive ? "text-slate-300 dark:text-slate-250" : "text-slate-500 dark:text-slate-400"} text-[10px] mt-0.5`}>{btn.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanatory notes under answers if checked */}
      {isAnswerRevealed && (
        <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/60 dark:border-indigo-900/45 mb-6 text-sm animate-fade-in" id="explanation-container">
          <span className="font-bold block text-indigo-900 dark:text-indigo-300 mb-1 flex items-center space-x-1.5">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Kriteria Penilaian & Penjelasan Tambahan:</span>
          </span>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs md:text-sm">
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Action panel underneath */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-5 flex justify-end">
        {!isAnswerRevealed ? (
          <button
            onClick={handleRevealAnswer}
            disabled={currentQuestion.type === "pilihan_ganda" ? !selectedOption : essayResponse.trim().length === 0}
            id="btn-submit-answer"
            className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 transition-all shadow-md ${
              (currentQuestion.type === "pilihan_ganda" ? selectedOption : essayResponse.trim().length > 0)
                ? "bg-indigo-600 hover:bg-slate-800 text-white cursor-pointer active:scale-95" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            }`}
          >
            <span>Cek Jawaban</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            disabled={currentQuestion.type === "esai" && essayGrade === null}
            id="btn-next-question"
            className={`px-5 py-3 rounded-xl font-semibold text-sm flex items-center space-x-2 shadow-md transition-transform ${
              (currentQuestion.type === "esai" && essayGrade === null)
                ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                : "bg-slate-900 dark:bg-indigo-950 hover:bg-indigo-700 text-white cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
            }`}
          >
            <span>{currentIdx < totalQuestions - 1 ? "Soal Berikutnya" : "Lihat Hasil Akhir"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" id="exit-confirmation-dialog" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowExitConfirm(false)}
          />
          
          {/* Modal Card */}
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-100 dark:border-slate-800 p-6 shadow-2xl animate-scale-up text-left z-10 transition-colors">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl flex-shrink-0">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-sans font-black text-slate-800 dark:text-white leading-tight">
                  Keluar dari Evaluasi?
                </h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  Apakah Anda yakin ingin keluar? Progres kuis saat ini akan hilang dan tidak akan tersimpan ke dalam riwayat.
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onExit();
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer duration-150"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
