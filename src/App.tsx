import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  Library, 
  FilePlus, 
  HelpCircle, 
  GraduationCap, 
  LogOut, 
  TrendingUp, 
  X,
  Bell,
  ChevronDown,
  Menu,
  Shield,
  CreditCard,
  History,
  BookOpen,
  ArrowRight,
  Info,
  Sun,
  Moon,
  User as UserIcon,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  Check,
  Mail
} from "lucide-react";
import QuizCreator from "./components/QuizCreator";
import QuizActive from "./components/QuizActive";
import MyLibrary from "./components/MyLibrary";
import AuthScreen from "./components/AuthScreen";
import { Quiz, UserAttempt, User } from "./types";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'library' | 'history' | 'help'>("create");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<UserAttempt[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);

  // Profile control dropdown and click outside ref
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  // Bell notifications card and details
  const [notiOpen, setNotiOpen] = useState(false);
  const notiContainerRef = useRef<HTMLDivElement>(null);

  // Mobile hamburger toggles
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Onboarding sequence state
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null); // null, 1, 2, 3

  // Sub-features modal overlays (Account Settings, Subscription Package)
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  // Account settings edit states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | undefined>(undefined);
  const [editNameError, setEditNameError] = useState("");
  const [editEmailError, setEditEmailError] = useState("");
  
  // Account password change states
  const [changePasswordMode, setChangePasswordMode] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState("");

  // States for simulated email password reset
  const [resetCode, setResetCode] = useState("");
  const [userResetCodeInput, setUserResetCodeInput] = useState("");
  const [isResetCodeSent, setIsResetCodeSent] = useState(false);
  const [isResetCodeVerified, setIsResetCodeVerified] = useState(false);

  // Account delete action states
  const [deleteAccountStep, setDeleteAccountStep] = useState<number>(0);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");

  // Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync simulated state
  const [isSyncActive, setIsSyncActive] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("24 Mei 2026, 12.42 WIB");

  // Title case normalizer helper
  const toTitleCase = (str: string) => {
    if (!str) return "";
    return str
      .trim()
      .split(/\s+/)
      .map(word => {
        if (!word) return "";
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");
  };

  // Avatar initials helper
  const getAvatarInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 0) return "U";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    
    const firstInitial = parts[0][0].toUpperCase();
    
    // Custom check search for 'z' word per requirement 5.1
    const zWord = parts.find(p => p.toLowerCase().startsWith("z"));
    if (zWord) {
      return (firstInitial + "Z").toUpperCase();
    }
    
    const lastInitial = parts[parts.length - 1][0].toUpperCase();
    return (firstInitial + lastInitial).toUpperCase();
  };

  // Sync state helpers on modal open
  useEffect(() => {
    if (accountModalOpen && currentUser) {
      setEditName(toTitleCase(currentUser.name));
      setEditEmail(currentUser.email);
      setEditAvatarUrl(currentUser.avatarUrl);
      setEditNameError("");
      setEditEmailError("");
      setChangePasswordMode(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowOldPass(false);
      setShowNewPass(false);
      setShowConfirmPass(false);
      setPassError("");
      setDeleteAccountStep(0);
      setDeleteConfirmEmail("");
    }
  }, [accountModalOpen, currentUser]);

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Dark/Light Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const storedTheme = localStorage.getItem("quizai_theme");
      if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
      }
    } catch {
      // ignore
    }
    return "light";
  });

  useEffect(() => {
    try {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      localStorage.setItem("quizai_theme", theme);
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // Check if modified compared to user details (Requirement 1.5, 2.1)
  const isModified = currentUser ? (
    editName.trim() !== toTitleCase(currentUser.name) ||
    editEmail.trim() !== currentUser.email ||
    editAvatarUrl !== currentUser.avatarUrl
  ) : false;

  // Backdrop click handler (Requirement 10.2)
  const handleBackdropClick = () => {
    handleCloseModalAttempt();
  };

  // Safe Close attempt modal logic (Requirement 2.4, 5.1, 10)
  const handleCloseModalAttempt = () => {
    if (isModified) {
      const confirmClose = window.confirm("Anda memiliki perubahan yang belum disimpan. Apakah Anda yakin ingin membatalkan dan menutup?");
      if (!confirmClose) return;
    }
    setAccountModalOpen(false);
  };

  // Avatar file upload handler with 2MB limits (Requirement 5.2-5.4)
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // formats validation JPG/PNG/WebP
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Format file tidak didukung. Silakan gunakan format JPG, PNG, atau WebP.");
      return;
    }

    // Size limit verification: 2MB max
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert("Ukuran berkas terlalu besar. Batas maksimal pas foto adalah 2 Megabytes (2MB).");
      return;
    }

    // FileReader to Base64 dataURL for local preview
    const reader = new FileReader();
    reader.onload = () => {
      setEditAvatarUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Password simulator retrieval
  const getStoredPassword = () => {
    try {
      const val = localStorage.getItem(`quizai_password_${currentUser?.id}`);
      return val || "password123";
    } catch {
      return "password123";
    }
  };

  const setStoredPassword = (newPass: string) => {
    try {
      localStorage.setItem(`quizai_password_${currentUser?.id}`, newPass);
    } catch (e) {
      console.error(e);
    }
  };

  // Real-time password strength index with three segments
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { label: "", score: 0, color: "bg-slate-200", textClass: "text-slate-400" };
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const isAtLeast8 = pass.length >= 8;
    
    if (!isAtLeast8 || !hasLetter || !hasNumber) {
      return { label: "Lemah", score: 1, color: "bg-rose-500", textClass: "text-rose-500" };
    }
    
    const hasUpper = /[A-Z]/.test(pass);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass);
    
    if (hasUpper && hasSpecial) {
      return { label: "Kuat", score: 3, color: "bg-emerald-500", textClass: "text-emerald-500" };
    } else if (hasUpper || hasSpecial) {
      return { label: "Sedang", score: 2, color: "bg-amber-500", textClass: "text-amber-505" };
    } else {
      return { label: "Lemah", score: 1, color: "bg-rose-500", textClass: "text-rose-550" };
    }
  };

  // Save changes handler with validation
  const handleSaveAccountChanges = () => {
    setEditNameError("");
    setEditEmailError("");
    
    let valid = true;
    if (!editName.trim() || editName.trim().length < 3) {
      setEditNameError("Nama harus diisi, minimal 3 karakter");
      valid = false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editEmail.trim() || !emailRegex.test(editEmail.trim())) {
      setEditEmailError("Alamat email tidak valid (harus mengandung @ dan domain)");
      valid = false;
    }
    
    if (!valid) return;
    
    const updatedUser = {
      ...currentUser!,
      name: editName.trim(), // Save text typed by user exactly
      email: editEmail.trim(),
      avatarUrl: editAvatarUrl
    };
    
    try {
      const usersStr = localStorage.getItem("quizai_users");
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const index = users.findIndex((u: any) => u.id === currentUser?.id);
        if (index !== -1) {
          users[index] = updatedUser;
          localStorage.setItem("quizai_users", JSON.stringify(users));
        } else {
          localStorage.setItem("quizai_users", JSON.stringify([...users, updatedUser]));
        }
      } else {
        localStorage.setItem("quizai_users", JSON.stringify([updatedUser]));
      }
    } catch (e) {
      console.error(e);
    }
    
    setCurrentUser(updatedUser);
    localStorage.setItem("quizai_active_user", JSON.stringify(updatedUser));
    setToastMessage("Perubahan berhasil disimpan");
    
    setTimeout(() => {
      setAccountModalOpen(false);
    }, 1500);
  };

  // Delete account confirmation
  const handleDeleteAccount = () => {
    try {
      const usersStr = localStorage.getItem("quizai_users");
      if (usersStr) {
        const users = JSON.parse(usersStr);
        const filtered = users.filter((u: any) => u.id !== currentUser?.id);
        localStorage.setItem("quizai_users", JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
    
    localStorage.removeItem("quizai_active_user");
    localStorage.removeItem("ai_quizzes");
    localStorage.removeItem("ai_attempts");
    
    setCurrentUser(null);
    setAccountModalOpen(false);
    setDeleteAccountStep(0);
    setDeleteConfirmEmail("");
    
    alert("Akun Anda telah berhasil dihapus");
  };

  // Notification items lists
  const notifications = [
    { id: 1, message: "Koneksi Gemini 1.5 Flash v1.5 tersinkronisasi.", time: "Baru saja" },
    { id: 2, message: "Fitur pencarian berbasis penelusuran sedia mendukung YouTube.", time: "10 menit lalu" }
  ];

  // Load initial data from localStorage securely
  useEffect(() => {
    try {
      // 1. Auth check
      const storedActiveUser = localStorage.getItem("quizai_active_user");
      if (storedActiveUser) {
        setCurrentUser(JSON.parse(storedActiveUser));
      }

      // 2. Quiz / Attempts check
      const storedQuizzes = localStorage.getItem("ai_quizzes");
      const storedAttempts = localStorage.getItem("ai_attempts");
      
      if (storedQuizzes) setQuizzes(JSON.parse(storedQuizzes));
      if (storedAttempts) setAttempts(JSON.parse(storedAttempts));

      // 3. Onboarding check
      const alreadyOnboarded = localStorage.getItem("quizai_onboarded");
      if (!alreadyOnboarded) {
        setShowOnboardingModal(true);
      }
    } catch (e) {
      console.error("Gagal memuat data dari penyimpanan lokal: ", e);
    }
  }, []);

  // Handle outside clicks for header dropdown profiles
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (profileContainerRef.current && !profileContainerRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notiContainerRef.current && !notiContainerRef.current.contains(e.target as Node)) {
        setNotiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("quizai_active_user", JSON.stringify(user));
    // Trigger onboarding check on fresh logins
    const alreadyOnboarded = localStorage.getItem("quizai_onboarded");
    if (!alreadyOnboarded) {
      setShowOnboardingModal(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    setShowLogoutConfirm(false);
    localStorage.removeItem("quizai_active_user");
  };

  // Save quizzes whenever modified
  const saveQuizzes = (newQuizzes: Quiz[]) => {
    setQuizzes(newQuizzes);
    localStorage.setItem("ai_quizzes", JSON.stringify(newQuizzes));
  };

  // Save attempts whenever modified 
  const saveAttempts = (newAttempts: UserAttempt[]) => {
    setAttempts(newAttempts);
    localStorage.setItem("ai_attempts", JSON.stringify(newAttempts));
  };

  const handleQuizGenerated = (newQuiz: Quiz) => {
    const updated = [newQuiz, ...quizzes];
    saveQuizzes(updated);
    // Auto launch newly generated quiz
    setActiveQuiz(newQuiz);
  };

  const handleQuizCompleted = (attempt: UserAttempt) => {
    const updated = [...attempts, attempt];
    saveAttempts(updated);
  };

  const handleDeleteQuiz = (quizId: string) => {
    const updatedQuizzes = quizzes.filter((q) => q.id !== quizId);
    const updatedAttempts = attempts.filter((a) => a.quizId !== quizId);
    saveQuizzes(updatedQuizzes);
    saveAttempts(updatedAttempts);
  };

  const handleClearHistory = () => {
    setQuizzes([]);
    setAttempts([]);
    setShowClearHistoryConfirm(false);
    localStorage.removeItem("ai_quizzes");
    localStorage.removeItem("ai_attempts");
  };

  const startOnboardingWalkthrough = () => {
    setShowOnboardingModal(false);
    localStorage.setItem("quizai_onboarded", "true");
    setActiveTab("create");
    setOnboardingStep(1); // Launches the first tooltip on source selectors
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem("quizai_onboarded");
    setShowOnboardingModal(true);
    setOnboardingStep(null);
    setActiveTab("create");
    setMobileMenuOpen(false);
  };

  const getInitials = (nameStr: string) => {
    return getAvatarInitials(nameStr);
  };

  const getFirstName = (nameStr: string) => {
    if (!nameStr) return "User";
    const titleCased = toTitleCase(nameStr);
    return titleCased.trim().split(/\s+/)[0];
  };

  // If user is not logged in / signed up, enforce AuthScreen gate first
  if (!currentUser) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Segment evaluations based on logged in user ID
  const filteredAttempts = attempts.filter(
    (a) => !a.userId || a.userId === currentUser.id
  );

  // If in active quiz mode, swap layout to immersive single-screen quiz taker
  if (activeQuiz) {
    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <main className="max-w-3xl mx-auto focus-within:ring-2 focus-within:ring-indigo-500">
          <QuizActive
            quiz={activeQuiz}
            onQuizCompleted={handleQuizCompleted}
            onExit={() => {
              setActiveQuiz(null);
              setActiveTab("library");
            }}
            userId={currentUser.id}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 dark:bg-slate-950 flex flex-col font-sans text-slate-800 dark:text-slate-100 focus:outline-none transition-all">
      
      {/* 1. Onboarding Welcome Modal according to Requirement 7 */}
      {showOnboardingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="onboarding-welcome-modal" role="dialog" aria-modal="true" aria-labelledby="modal-welcome-title">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 subtle-shadow border border-slate-150 relative animate-scale-up">
            <button
              onClick={() => { setShowOnboardingModal(false); localStorage.setItem("quizai_onboarded", "true"); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              aria-label="Tutup jendela selamat datang"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-indigo-50 text-indigo-600 rounded-2xl mb-3.5">
                <Sparkles className="w-8 h-8 animate-pulse text-indigo-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-display font-black text-slate-900 leading-tight" id="modal-welcome-title">
                Selamat Datang di QuizAI!
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Sistem cerdas pembuat kuis evaluasi instan berbasis berkas belajar multimedia dan bertenaga Gemini.
              </p>
            </div>

            {/* Three explicit onboarding steps */}
            <div className="space-y-4 mb-7">
              <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-indigo-50/30">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700 font-extrabold text-sm flex-shrink-0">1</div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">Pilih Sumber Materi Belajar</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Unggah berkas naskah/PDF/gambar, rekam suara, unggah video pembelajaran Anda, atau ruju tautan url YouTube dalam sekejap.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-indigo-50/30">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700 font-extrabold text-sm flex-shrink-0">2</div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">Sesuaikan Format & Batasan Kuis</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Atur format pertanyaan (pilihan ganda, esai, atau kombinasi), tingkat kesukaran materi, dan pasang durasi pengisian opsional.</p>
                </div>
              </div>

              <div className="flex items-start space-x-3.5 p-3 rounded-2xl bg-indigo-50/30">
                <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700 font-extrabold text-sm flex-shrink-0">3</div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">Mulai Latihan Cerdas Mandiri</h4>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Tekan tombol kirim dan biarkan model cerdas merakit pertanyaan kredibel beserta visual ulasan teoritisnya.</p>
                </div>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={startOnboardingWalkthrough}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-5 rounded-xl transition-all cursor-pointer text-center text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                Mulai Panduan Aplikasi Sekarang
              </button>
              <button
                onClick={() => { setShowOnboardingModal(false); localStorage.setItem("quizai_onboarded", "true"); }}
                className="w-full bg-transparent hover:bg-slate-50 text-slate-500 font-bold py-2 px-5 rounded-xl transition-colors text-xs text-center cursor-pointer"
              >
                Lewati, Saya sudah paham cara pakainya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sub-feature overlays: Account Settings Modal */}
      {accountModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-50 animate-fade-in" 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="account-modal-title"
          onClick={handleBackdropClick}
        >
          <div 
            className="bg-white dark:bg-slate-900 md:rounded-3xl rounded-t-3xl rounded-b-none md:max-w-[480px] w-full max-h-[90vh] md:h-auto h-[90vh] flex flex-col relative overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 md:animate-scale-up animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Swipe-down indicator */}
            <div className="md:hidden py-3 cursor-pointer flex justify-center flex-shrink-0 animate-pulse" onClick={handleCloseModalAttempt}>
              <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
            </div>

            {/* Header Area */}
            <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center w-10 h-10">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-md sm:text-base font-extrabold text-slate-800 dark:text-slate-100" id="account-modal-title">
                    Pengaturan Akun
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Kelola informasi dan keamanan akun Anda
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModalAttempt}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-full cursor-pointer transition-colors"
                aria-label="Tutup pengaturan akun"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {deleteAccountStep === 0 && !changePasswordMode && (
                <>
                  {/* Identity Header: Avatar & Inisial */}
                  <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-850">
                    <div className="relative w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900/40 flex items-center justify-center overflow-hidden flex-shrink-0 group">
                      {editAvatarUrl ? (
                        <img src={editAvatarUrl} alt="Avatar" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-indigo-700 dark:text-indigo-300 font-extrabold text-base">
                          {getAvatarInitials(currentUser.name)}
                        </span>
                      )}
                      
                      {/* Photo change overlay */}
                      <label className="absolute inset-0 bg-black/55 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Camera className="w-4 h-4 text-white animate-pulse" />
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/webp" 
                          onChange={handleAvatarChange} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                        {toTitleCase(editName) || toTitleCase(currentUser.name)}
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-all">
                        {editEmail || currentUser.email}
                      </p>
                      <button 
                        type="button" 
                        onClick={() => {
                          const fileInput = document.createElement("input");
                          fileInput.type = "file";
                          fileInput.accept = "image/png, image/jpeg, image/webp";
                          fileInput.onchange = (e: any) => handleAvatarChange(e);
                          fileInput.click();
                        }}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 block"
                      >
                        Ganti foto profil
                      </button>
                    </div>
                  </div>

                  {/* Name field edit */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-name-field" className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">
                      Nama Lengkap
                    </label>
                    <input
                      id="edit-name-field"
                      type="text"
                      value={editName}
                      onChange={(e) => {
                        setEditName(e.target.value);
                        if (e.target.value.trim().length >= 3) {
                          setEditNameError("");
                        }
                      }}
                      placeholder="Masukkan nama lengkap Anda"
                      className={`w-full text-base sm:text-xs md:text-sm font-medium px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        editNameError 
                          ? "border-rose-500 ring-1 ring-rose-500" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    />
                    {editNameError && (
                      <p className="text-[10px] text-rose-500 font-bold block mt-1">
                        {editNameError}
                      </p>
                    )}
                  </div>

                  {/* Email field edit */}
                  <div className="space-y-1.5">
                    <label htmlFor="edit-email-field" className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">
                      Alamat Email
                    </label>
                    <input
                      id="edit-email-field"
                      type="email"
                      value={editEmail}
                      onChange={(e) => {
                        setEditEmail(e.target.value);
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (emailRegex.test(e.target.value.trim())) {
                          setEditEmailError("");
                        }
                      }}
                      placeholder="Masukkan alamat email Anda"
                      className={`w-full text-base sm:text-xs md:text-sm font-medium px-4 py-2.5 rounded-xl border bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
                        editEmailError 
                          ? "border-rose-500 ring-1 ring-rose-500" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    />
                    {editEmailError && (
                      <p className="text-[10px] text-rose-500 font-bold block mt-1">
                        {editEmailError}
                      </p>
                    )}
                  </div>

                  {/* Password trigger button (Requirement 3.1) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setChangePasswordMode(true)}
                      className="w-full border border-slate-250 dark:border-slate-800 bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-bold py-2.5 px-4 rounded-xl text-center text-xs cursor-pointer transition-all"
                    >
                      Ganti kata sandi
                    </button>
                  </div>

                  {/* Plan active row (Requirement 9) */}
                  <div className="border-t border-slate-150 dark:border-slate-800 pt-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between animate-fade-in">
                      <span className="text-[11px] text-slate-450 dark:text-slate-400 uppercase font-black tracking-wider">
                        Paket aktif
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="relative group">
                          <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-250 dark:border-amber-900/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-help select-none shadow-sm">
                            Premium
                          </span>
                          <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-48 bg-slate-900 text-white text-[9px] p-2 rounded shadow-xl z-50 text-left leading-normal border border-slate-800">
                            Fitur aktif: Akses model Pro & Flash tanpa batas, pencerahan Google Search, ukuran unggah 30MB.
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSubModalOpen(true);
                            setAccountModalOpen(false);
                          }}
                          className="text-xs font-bold text-[#6366F1] hover:underline"
                        >
                          Kelola langganan →
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      Aktif hingga: 24 Mei 2027
                    </p>
                  </div>

                  {/* File persistence & Sync Sandbox (Requirement 6) */}
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                    <div className="flex items-center space-x-1">
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider">Penyimpanan data</span>
                      <div className="relative group">
                        <Info className="w-3.5 h-3.5 text-slate-400 cursor-help" />
                        <div className="absolute left-1/2 bottom-full mb-1.5 hidden group-hover:block -translate-x-1/2 w-48 bg-slate-900 text-white text-[9px] p-2 rounded shadow-lg z-50 text-center leading-normal border border-slate-800">
                          Data Anda disimpan secara lokal di browser ini dan tidak dikirim ke server eksternal.
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        {isSyncActive ? (
                          <span className="inline-flex items-center space-x-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 border border-emerald-100 dark:border-emerald-900/20 rounded-full text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 px-2 py-0.5 border border-rose-100 dark:border-rose-900/20 rounded-full text-[10px] font-bold">
                              <span>Tidak aktif</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsSyncActive(true);
                                setLastSyncTime(new Date().toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric"
                                }) + ", " + new Date().toLocaleTimeString("id-ID", {
                                  hour: "2-digit",
                                  minute: "2-digit"
                                }) + " WIB");
                              }}
                              className="text-[10px] font-bold text-[#6366F1] hover:underline"
                            >
                              Coba lagi
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium animate-fade-in">
                        Data kuis tersimpan di browser ini
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                        Terakhir disinkronkan: {lastSyncTime}
                      </p>
                    </div>
                  </div>

                  {/* Bottom GDPR delete layout (Requirement 7) */}
                  <div className="border-t border-slate-150 dark:border-slate-800 pt-4">
                    <button
                      type="button"
                      onClick={() => setDeleteAccountStep(1)}
                      className="w-full py-2 bg-transparent border border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-[11px] transition-colors cursor-pointer text-center"
                    >
                      Hapus akun secara permanen (GDPR)
                    </button>
                  </div>
                </>
              )}

              {/* Password change screen */}
               {changePasswordMode && (
                <div className="space-y-4 font-sans text-xs sm:text-sm animate-fade-in">
                  <div className="flex items-center justify-between pb-1">
                    <h5 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">Ganti Kata Sandi</h5>
                    <button
                      type="button"
                      onClick={() => {
                        setChangePasswordMode(false);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setIsResetCodeSent(false);
                        setIsResetCodeVerified(false);
                        setUserResetCodeInput("");
                        setPassError("");
                      }}
                      className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline"
                    >
                      ← Kembali
                    </button>
                  </div>

                  {/* Password error inline */}
                  {passError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-220 rounded-xl font-bold text-xs ring-1 ring-rose-200 dark:ring-rose-900/40 animate-pulse">
                      {passError}
                    </div>
                  )}

                  {isResetCodeSent ? (
                    /* SIMULATED EMAIL INBOX CONTAINER inside Account Settings */
                    <div className="space-y-3.5 bg-gradient-to-br from-indigo-50/50 to-indigo-100/20 dark:from-slate-800/60 dark:to-slate-900/40 p-3.5 rounded-2xl border border-indigo-100/80 dark:border-indigo-950/80 animate-fade-in">
                      <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
                        <Mail className="w-4 h-4 animate-bounce" />
                        <span>Kotak Masuk Simulasi Email</span>
                      </div>
                      
                      <div className="p-3 bg-white dark:bg-slate-950/80 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] leading-relaxed text-slate-600 dark:text-slate-350 space-y-1 shadow-sm">
                        <div><strong>Kepada:</strong> {currentUser?.email}</div>
                        <div><strong>Dari:</strong> security@quizai.io</div>
                        <div><strong>Subjek:</strong> Kode Atur Ulang Kata Sandi QuizAI</div>
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-2 font-medium">
                          Anda menerima email ini karena Anda melakukan permintaan reset sandi akun. Silakan verifikasi identitas Anda menggunakan kode berikut:
                          <span className="block text-center font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100/30 rounded py-1.5 px-3 font-black text-base tracking-widest mt-2">
                            {resetCode}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Masukkan 6-Digit Kode Verifikasi</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={userResetCodeInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setUserResetCodeInput(val);
                            if (val === resetCode) {
                              setIsResetCodeVerified(true);
                              setPassError("");
                            } else if (val.length === 6) {
                              setPassError("Kode verifikasi salah! Silakan coba lagi.");
                              setIsResetCodeVerified(false);
                            } else {
                              setIsResetCodeVerified(false);
                            }
                          }}
                          placeholder="Masukkan kode aman"
                          className="w-full text-center font-mono text-base font-bold tracking-widest px-4 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                      </div>

                      {isResetCodeVerified && (
                        <div className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                          ✓ Kode Terverifikasi! Silakan ubah sandi baru di bawah.
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Old Password (only shown if not doing email reset) */
                    <div className="space-y-1 animate-fade-in">
                      <label className="block text-[10px] text-slate-450 uppercase font-bold">Kata sandi saat ini</label>
                      <div className="relative">
                        <input
                          type={showOldPass ? "text" : "password"}
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Masukkan kata sandi lama"
                          className="w-full text-base sm:text-xs md:text-sm font-medium px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOldPass(!showOldPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650"
                          aria-label="Tampilkan kata sandi saat ini"
                        >
                          {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* New Password (Always Shown) */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-450 uppercase font-bold">Kata sandi baru</label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Ketikan minimal 8 karakter dengan huruf & angka"
                        className="w-full text-base sm:text-xs md:text-sm font-medium px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650"
                        aria-label="Tampilkan kata sandi baru"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Real-time strength helper */}
                    {newPassword && (
                      <div className="space-y-1.5 pt-1 animate-fade-in">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className="text-slate-400">Kekuatan Sandi:</span>
                          <span className={getPasswordStrength(newPassword).textClass}>
                            {getPasswordStrength(newPassword).label}
                          </span>
                        </div>
                        {/* 3 stages colored progress bar */}
                        <div className="grid grid-cols-3 gap-1 h-1.5 w-full">
                          <div className={`h-full rounded-full transition-colors ${
                            getPasswordStrength(newPassword).score >= 1 ? getPasswordStrength(newPassword).color : "bg-slate-100 dark:bg-slate-800"
                          }`} />
                          <div className={`h-full rounded-full transition-colors ${
                            getPasswordStrength(newPassword).score >= 2 ? getPasswordStrength(newPassword).color : "bg-slate-100 dark:bg-slate-800"
                          }`} />
                          <div className={`h-full rounded-full transition-colors ${
                            getPasswordStrength(newPassword).score >= 3 ? getPasswordStrength(newPassword).color : "bg-slate-100 dark:bg-slate-800"
                          }`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password (Always Shown) */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-450 uppercase font-bold">Konfirmasi kata sandi baru</label>
                    <div className="relative">
                      <input
                        type={showConfirmPass ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kembali kata sandi baru"
                        className="w-full text-base sm:text-xs md:text-sm font-medium px-4 py-2.5 pr-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650"
                        aria-label="Tampilkan konfirmasi kata sandi baru"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Save button and link */}
                  <div className="pt-2.5 space-y-2">
                    <button
                      type="button"
                      disabled={
                        (isResetCodeSent && !isResetCodeVerified) ||
                        (!isResetCodeSent && !oldPassword) ||
                        !newPassword ||
                        newPassword.length < 8 ||
                        !/[a-zA-Z]/.test(newPassword) ||
                        !/[0-9]/.test(newPassword) ||
                        confirmPassword !== newPassword
                      }
                      onClick={() => {
                        if (!isResetCodeSent) {
                          // Check if old password matches stored simulator
                          const actualPassword = getStoredPassword();
                          if (oldPassword !== actualPassword) {
                            setPassError("Kata sandi saat ini salah!");
                            return;
                          }
                        } else {
                          // If reset via email, verify reset code input
                          if (userResetCodeInput !== resetCode) {
                            setPassError("Kode verifikasi tidak valid!");
                            return;
                          }
                        }
                        
                        // Save to simulator database
                        setStoredPassword(newPassword);
                        setPassError("");
                        setToastMessage("Kata sandi berhasil diperbarui!");
                        
                        // Reset all state back to initial
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setIsResetCodeSent(false);
                        setIsResetCodeVerified(false);
                        setUserResetCodeInput("");
                        setChangePasswordMode(false);
                      }}
                      className="w-full bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 hover:bg-slate-800 text-white font-extrabold py-3 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors disabled:cursor-not-allowed shadow-sm"
                    >
                      Simpan kata sandi baru
                    </button>

                    {isResetCodeSent ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsResetCodeSent(false);
                          setIsResetCodeVerified(false);
                          setUserResetCodeInput("");
                          setPassError("");
                        }}
                        className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline block text-center mx-auto"
                      >
                        Kembali ke Ubah Sandi Manual
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const code = Math.floor(100000 + Math.random() * 900000).toString();
                          setResetCode(code);
                          setIsResetCodeSent(true);
                          setIsResetCodeVerified(false);
                          setUserResetCodeInput("");
                          setPassError("");
                          setToastMessage("Email reset asisten terkirim!");
                        }}
                        className="text-[10px] text-slate-500 font-medium hover:underline block text-center mx-auto"
                      >
                        Lupa kata sandi saat ini? Kirim reset via email
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* GDPR Step 1 Confirmation */}
              {deleteAccountStep === 1 && (
                <div className="space-y-4 text-center py-4 inline-block w-full animate-fade-in">
                  <div className="inline-flex p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-405 rounded-3xl mx-auto mb-1">
                    <Trash2 className="w-8 h-8 text-rose-600" />
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-base font-black text-rose-600">Hapus akun secara permanen?</h5>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      Semua data kuis, riwayat, dan pengaturan Anda akan segera dihapus seutuhnya dan tidak dapat dipulihkan kembali setelah Anda konfirmasi.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setDeleteAccountStep(0)}
                      className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors border border-slate-200 dark:border-slate-750"
                    >
                      Batalkan
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteAccountStep(2)}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors shadow-sm"
                    >
                      Ya, lanjutkan hapus
                    </button>
                  </div>
                </div>
              )}

              {/* GDPR Step 2 Confirmation */}
              {deleteAccountStep === 2 && (
                <div className="space-y-4 py-3 inline-block w-full animate-fade-in">
                  <div className="space-y-1.5 text-center">
                    <h5 className="text-md font-extrabold text-slate-800 dark:text-slate-200">Konfirmasi Email Anda</h5>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Silakan ketik ulang email terdaftar Anda <strong className="text-slate-800 dark:text-slate-300 select-all">{currentUser.email}</strong> di bawah ini untuk mengonfirmasi penghapusan:
                    </p>
                  </div>
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      placeholder="Masukkan alamat email Anda"
                      className="w-full text-base sm:text-xs md:text-sm font-medium px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/50 text-center"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteAccountStep(0);
                        setDeleteConfirmEmail("");
                      }}
                      className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors"
                    >
                      Batalkan
                    </button>
                    <button
                      type="button"
                      disabled={deleteConfirmEmail.trim().toLowerCase() !== currentUser.email.toLowerCase()}
                      onClick={handleDeleteAccount}
                      className="w-full bg-rose-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors shadow-sm disabled:cursor-not-allowed"
                    >
                      Hapus akun saya selamanya
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Action Footer (Requirement 2 & 10.2) */}
            {deleteAccountStep === 0 && !changePasswordMode && (
              <div className="border-t border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50 dark:bg-slate-900 flex items-center gap-3 flex-shrink-0">
                {isModified ? (
                  <button
                    type="button"
                    onClick={handleSaveAccountChanges}
                    className="w-full bg-[#6366F1] hover:bg-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl text-center text-xs cursor-pointer transition-all shadow-sm transform duration-150 active:scale-95"
                  >
                    Simpan perubahan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAccountModalOpen(false)}
                    className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold py-3 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors"
                  >
                    Tutup
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Sub-feature overlays: Plan Subscription Modal */}
      {subModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="sub-modal-title">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-100 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setSubModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full cursor-pointer"
              aria-label="Tutup info paket berlangganan"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center space-x-3 mb-4 text-center">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-md sm:text-lg font-bold text-slate-800" id="sub-modal-title">Paket Berlangganan Saya</h4>
                <p className="text-xs text-slate-450">Konfigurasi kuota pemicu model kognitif Gemini</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl relative overflow-hidden flex flex-col gap-3">
              <div className="absolute top-0 right-0 p-3">
                <span className="bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full animate-bounce">
                  Premiums
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">Level Paket Aktif</span>
                <span className="text-lg font-display font-black text-slate-800 block mt-0.5">QuizAI Multimodal Guru Pro</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1.5 border-t border-slate-150 pt-2 font-medium">
                <li className="flex items-center space-x-1">
                  <span className="text-emerald-500">✓</span> <span>Akses tak terbatas model Gemini 1.5 Pro</span>
                </li>
                <li className="flex items-center space-x-1">
                  <span className="text-emerald-500">✓</span> <span>Pipa analisis penelusuran google search</span>
                </li>
                <li className="flex items-center space-x-1">
                  <span className="text-emerald-500">✓</span> <span>Ukuran berkas unggah maksimal 30 Megabytes</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => setSubModalOpen(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs mt-5 cursor-pointer transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      )}

      {/* 4. Custom Logout Confirmation Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="logout-confirm-title">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full cursor-pointer"
              aria-label="Tutup dialog keluar"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 bg-rose-50 text-rose-600 rounded-2xl mx-auto">
                <LogOut className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-md sm:text-lg font-bold text-slate-800" id="logout-confirm-title">Sesi Keluar Akun</h4>
                <p className="text-xs text-slate-450">Apakah Anda benar-benar yakin ingin keluar dari akun Anda?</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Custom Clear History Confirmation Overlay */}
      {showClearHistoryConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="clear-history-title">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-100 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setShowClearHistoryConfirm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full cursor-pointer"
              aria-label="Tutup dialog hapus semua"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-center space-y-4">
              <div className="inline-flex p-3 bg-rose-50 text-rose-600 rounded-2xl mx-auto">
                <X className="w-6 h-6 text-rose-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-md sm:text-lg font-bold text-slate-800" id="clear-history-title">Hapus Semua Pustaka</h4>
                <p className="text-xs text-slate-450">Tindakan ini akan menghapus secara permanen semua kuis di pustaka beserta riwayat seluruh evaluasi tes Anda.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowClearHistoryConfirm(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={handleClearHistory}
                  className="w-full bg-rose-600 hover:bg-[#E11D48] text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs cursor-pointer transition-colors shadow-sm"
                >
                  Hapus Permanen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Header Layout */}
      <header className="border-b border-indigo-100/50 dark:border-slate-800 bg-white/80 dark:bg-slate-900/85 backdrop-blur sticky top-0 z-40 subtle-shadow transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between pointer-events-auto">
          
          {/* Brand Logo Header */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <div className="p-2 bg-[#6366F1] text-white rounded-xl shadow-indigo-100 dark:shadow-none shadow-md">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm sm:text-md md:text-lg font-display font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center space-x-1">
                <span>QuizAI</span>
                <span className="text-[9px] bg-indigo-50 dark:bg-slate-800 text-[#6366F1] dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-bold">MULTIMODAL</span>
              </h1>
            </div>
          </div>

          {/* Desktop Central Navigation Menu (Requirement 4) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-2xl relative text-xs font-semibold select-none border border-slate-200 dark:border-slate-700/80">
            {(['create', 'library', 'history', 'help'] as const).map((tabId) => {
              const isActive = activeTab === tabId;
              const labels = {
                create: "Buat Kuis",
                library: "Pustaka",
                history: "Riwayat",
                help: "Bantuan"
              };
              const Icons = {
                create: FilePlus,
                library: Library,
                history: TrendingUp,
                help: HelpCircle
              };
              const SelectedIcon = Icons[tabId];

              return (
                <button
                  key={tabId}
                  onClick={() => { setActiveTab(tabId); setMobileMenuOpen(false); }}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
                    isActive
                      ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm border border-slate-200/50 dark:border-slate-600"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/40 dark:hover:bg-slate-700/40"
                  }`}
                  aria-pressed={isActive}
                  aria-label={`Menu tab navigasi ke halaman ${labels[tabId]}`}
                >
                  <SelectedIcon className="w-3.5 h-3.5" />
                  <span>{labels[tabId]}</span>
                </button>
              );
            })}
          </nav>

          {/* User Controls and Dropdowns (Right aligned) */}
          <div className="flex items-center space-x-2 sm:space-x-3.5">
            
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="p-2 text-slate-400 dark:text-slate-300 hover:text-[#6366F1] dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer focus:ring-2 focus:ring-indigo-600 focus:outline-none"
              title={theme === 'light' ? "Nyalakan Mode Gelap" : "Nyalakan Mode Terang"}
              aria-label={theme === 'light' ? "Nyalakan Mode Gelap" : "Nyalakan Mode Terang"}
            >
              {theme === 'light' ? <Moon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-500" /> : <Sun className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-500" />}
            </button>

            {/* Notification Bell Icon Area (Requirement 4) */}
            <div className="relative" ref={notiContainerRef}>
              <button
                onClick={() => setNotiOpen(!notiOpen)}
                className="p-2 text-slate-400 hover:text-[#6366F1] hover:bg-indigo-50/50 rounded-xl transition-all cursor-pointer relative focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                title="Pemberitahuan sistem"
                aria-label="Pemberitahuan sistem kuis"
                aria-expanded={notiOpen}
              >
                <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white"></span>
              </button>

              {/* Glowing dropdown popup panel */}
              {notiOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 text-xs text-slate-700 animate-scale-up font-sans">
                  <div className="font-bold border-b border-slate-100 pb-1.5 mb-2 flex items-center justify-between text-slate-800">
                    <span>Notifikasi Sistem AI</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-450 font-medium">Terbaru</span>
                  </div>
                  <ul className="space-y-2 mt-2">
                    {notifications.map((n) => (
                      <li key={n.id} className="p-2 hover:bg-slate-50 rounded-xl block bg-slate-50/50">
                        <p className="font-medium text-slate-650 leading-relaxed">{n.message}</p>
                        <span className="text-[9px] text-slate-400 mt-1 block">{n.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Avatar and Info Dropdown Menu (Requirement 11) */}
            <div className="relative border-l border-slate-150 pl-2 sm:pl-3.5 flex items-center" ref={profileContainerRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-1.5 hover:bg-slate-50 p-1 rounded-xl transition-colors text-xs font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-[#6366F1] focus:outline-none"
                aria-haspopup="true"
                aria-expanded={profileDropdownOpen}
                aria-label="Dropdown informasi profile pengguna"
              >
                {/* Visual Circle initials */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-xs overflow-hidden">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    getInitials(currentUser.name)
                  )}
                </div>
                {/* First name label only */}
                <span className="hidden sm:inline text-slate-700 text-xs font-extrabold">
                  {getFirstName(currentUser.name)}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform hidden sm:inline ${profileDropdownOpen ? 'rotate-180':''}`} />
              </button>

              {/* Profile dropdown container */}
              {profileDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 z-50 animate-scale-up font-sans text-xs">
                  {/* Non-truncated user data layout */}
                  <div className="px-3.5 py-3 border-b border-slate-100 flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                      {currentUser.avatarUrl ? (
                        <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        getInitials(currentUser.name)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-slate-800 text-sm max-w-full block leading-snug truncate">{toTitleCase(currentUser.name)}</p>
                      <p className="text-[10px] text-slate-450 mt-0.5 font-medium truncate">{currentUser.email}</p>
                    </div>
                  </div>
                  
                  <ul className="py-2.5 space-y-1">
                    <li>
                      <button
                        onClick={() => { setAccountModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left font-bold px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl cursor-pointer"
                        aria-label="Buka Pengaturan Akun"
                      >
                        Pengaturan Akun
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setSubModalOpen(true); setProfileDropdownOpen(false); }}
                        className="w-full text-left font-bold px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl cursor-pointer flex justify-between items-center"
                        aria-label="Buka Paket Berlangganan"
                      >
                        <span>Paket Saya</span>
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.1 rounded text-[9px] uppercase font-black tracking-wider">Premium</span>
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => { setActiveTab("help"); setProfileDropdownOpen(false); }}
                        className="w-full text-left font-bold px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl cursor-pointer"
                        aria-label="Halaman Bantuan dan Dukungan"
                      >
                        Bantuan & Dukungan
                      </button>
                    </li>
                  </ul >

                  <div className="border-t border-slate-100 pt-2 pb-1">
                    <button
                      onClick={() => { setShowLogoutConfirm(true); setProfileDropdownOpen(false); }}
                      className="w-full text-left font-black px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                      aria-label="Batal sesi dan keluar"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger toggle button with icons menu (Requirement 5) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-[#6366F1] hover:bg-slate-100 rounded-xl focus:ring-2 focus:ring-[#6366F1] focus:outline-none"
              aria-label="Menu navigasi mobile"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hamburger Mobile drawers container list */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-md px-4 py-3 space-y-2.5 shadow-lg relative z-40 transition-all font-sans text-xs">
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <button
                onClick={() => { setActiveTab("create"); setMobileMenuOpen(false); }}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 focus:outline-none ${
                  activeTab === "create" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                }`}
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>Buat Kuis</span>
              </button>
              <button
                onClick={() => { setActiveTab("library"); setMobileMenuOpen(false); }}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 focus:outline-none ${
                  activeTab === "library" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Library className="w-3.5 h-3.5" />
                <span>Pustaka</span>
              </button>
              <button
                onClick={() => { setActiveTab("history"); setMobileMenuOpen(false); }}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 focus:outline-none ${
                  activeTab === "history" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Riwayat</span>
              </button>
              <button
                onClick={() => { setActiveTab("help"); setMobileMenuOpen(false); }}
                className={`py-2 px-3 rounded-lg font-bold flex items-center justify-center space-x-1.5 focus:outline-none ${
                  activeTab === "help" ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Bantuan</span>
              </button>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-xs overflow-hidden flex-shrink-0">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    getInitials(currentUser.name)
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-850 dark:text-slate-100 text-xs">{toTitleCase(currentUser.name)}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{currentUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowLogoutConfirm(true); setMobileMenuOpen(false); }}
                className="text-rose-600 hover:bg-rose-50 font-bold text-xs py-1.5 px-3 border border-rose-150 rounded-lg cursor-pointer transition-colors"
              >
                Keluar
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Container Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 select-none focus:outline-none max-w-7xl">
        
        {activeTab === "create" && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-slate-800 rounded-3xl p-1">
            <div className="text-center md:text-left mb-2.5">
              <span className="text-[10px] sm:text-xs font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-widest bg-indigo-50 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-slate-700">
                Sistem Penilaian Cerdas
              </span>
              <h2 className="text-lg sm:text-xl md:text-2.5xl lg:text-3.5xl font-display font-black text-slate-850 dark:text-white mt-3.5 leading-tight tracking-tight">
                Ubah Berkas Belajar Anda Menjadi Kuis Evaluasi Mandiri
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                Unggah dokumen buku, naskah, presentasi, rekaman media pembelajaran (PDF, JPG, PNG, MP3, MP4), atau salin tautan YouTube dan catatan pribadi untuk memicu pembentukan soal bertenaga Gemini.
              </p>
            </div>
            
            <QuizCreator 
              onQuizGenerated={handleQuizGenerated} 
              onboardingStep={onboardingStep}
              setOnboardingStep={setOnboardingStep}
            />
          </div>
        )}

        {activeTab === "library" && (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-2.5">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-slate-800 dark:text-white leading-tight tracking-tight">
                Pustaka Latihan Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-450 dark:text-slate-400">
                Akses, tinjau, dan latih kembali pemahaman konsep kuis yang dikonstruksi bertenaga AI.
              </p>
            </div>

            <MyLibrary
              quizzes={quizzes}
              attempts={filteredAttempts}
              onStartQuiz={(quiz) => setActiveQuiz(quiz)}
              onDeleteQuiz={handleDeleteQuiz}
              onClearHistory={() => setShowClearHistoryConfirm(true)}
              onNavigateToCreator={() => setActiveTab("create")}
              focusView="library" // Shows only library specific views
            />
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6 animate-fade-in">
            <div className="mb-2.5">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-slate-800 dark:text-white leading-tight">
                Riwayat Pengerjaan Kuis
              </h2>
              <p className="text-xs sm:text-sm text-slate-450 dark:text-slate-400">
                Amati performa visual, persentase kebenaran soal, dan logs penilaian draf Anda di dasbor evaluasi.
              </p>
            </div>

            <MyLibrary
              quizzes={quizzes}
              attempts={filteredAttempts}
              onStartQuiz={(quiz) => setActiveQuiz(quiz)}
              onDeleteQuiz={handleDeleteQuiz}
              onClearHistory={() => setShowClearHistoryConfirm(true)}
              onNavigateToCreator={() => setActiveTab("create")}
              focusView="history" // Shows stats and history list
            />
          </div>
        )}

        {activeTab === "help" && (
          <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-slate-800 dark:text-white leading-tight">
                Pusat Bantuan & Panduan
              </h2>
              <p className="text-xs sm:text-sm text-slate-450 dark:text-slate-400">
                Temukan penyelesaian kendala teknis dan ulasan lengkap fitur QuizAI Multimodal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl subtle-shadow col-span-2 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-850 pb-2">Frequently Asked Questions (FAQ)</h3>
                
                <div className="space-y-4 text-xs sm:text-sm leading-relaxed">
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200">1. Bagaimana cara kerja pembuatan kuis AI?</h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">QuizAI memanfaatkan SDK teruji Google Gemini 1.5 Flash dan Pro untuk memproses rujukan transkripsi YouTube, file cetak belajar, PDF presentasi, rekaman materi MP3/MP4, maupun teks bebas. Sistem merakit pertanyaan analitik kredibel beserta ulasan teoritisnya.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200">2. Format dokumen apa saja yang didukumg untuk diunggah?</h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Anda dipersilakan mengunggah file PDF, foto gambar teks (PNG, JPG), rekaman audio (MP3, WAV), serta rekaman video pembelajaran (MP4, WebM) dengan kapasitas batas muat 30MB.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-200">3. Bagaimana cara mengulang kembali panduan interaktif?</h4>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Gunakan tombol rujukan instruksi di bagian kanan halaman ini untuk memicu panduan bertahap berkilau mengenai tata cara interaktif formulir QuizAI.</p>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex flex-col justify-between space-y-4 h-full">
                <div>
                  <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-xl w-fit">
                    <Info className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-black text-indigo-950 dark:text-indigo-200 mt-3.5">Butuh Panduan Lagi?</h3>
                  <p className="text-[11px] sm:text-xs text-indigo-800/80 dark:text-indigo-300 mt-1.5 leading-relaxed">
                    Sistem dapat mendemonstrasikan ulasan modal selamat datang serta cincin lingkaran ungu interaktif di atas formulir pembuatan kuis Anda.
                  </p>
                </div>
                <button
                  onClick={handleResetOnboarding}
                  className="w-full bg-indigo-600 hover:bg-slate-900 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl text-center shadow cursor-pointer transition-all hover:-translate-y-0.5"
                >
                  Mulai Panduan Lagi
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Premium Footer Layout */}
      <footer className="border-t border-slate-100 bg-white py-6 mt-12 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400 font-semibold gap-3">
          <div className="flex items-center space-x-1.5">
            <span>© 2026 QuizAI Multimodal.</span>
            <span>Mendukung Penilaian Berkualitas.</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleResetOnboarding}
              className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline py-1 cursor-pointer"
            >
              Lihat panduan lagi
            </button>
            <span className="text-slate-300">|</span>
            <span className="text-slate-400 font-medium">Powered by Google Gemini 1.5 Flash</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container (Requirement 1.7 & 2.2) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl py-3 px-4 shadow-2xl flex items-center space-x-2.5 max-w-sm">
            <div className="p-1 bg-emerald-500/20 text-emerald-400 rounded-full flex-shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <p className="text-xs font-extrabold tracking-wider leading-relaxed pr-1 select-none">
              {toastMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
