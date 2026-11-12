import React, { useState, useEffect } from "react";
import { GraduationCap, Mail, Lock, User, Sparkles, LogIn, UserPlus, Info, Sun, Moon, ArrowLeft, Check } from "lucide-react";
import { User as UserType } from "../types";

interface AuthScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for simulated email forgot password reset
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [userCodeInput, setUserCodeInput] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

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

  const getStoredUsers = (): UserType[] => {
    try {
      const usersStr = localStorage.getItem("quizai_users");
      return usersStr ? JSON.parse(usersStr) : [];
    } catch {
      return [];
    }
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Semua kolom harus diisi!");
      return;
    }

    if (!isLogin && !name) {
      setErrorMsg("Nama harus diisi untuk melakukan pendaftaran!");
      return;
    }

    const users = getStoredUsers();

    if (isLogin) {
      // Find user
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!existingUser) {
        setErrorMsg("Akun tidak ditemukan. Silakan buat akun baru terlebih dulu.");
        return;
      }
      
      const storedPass = localStorage.getItem(`quizai_password_${existingUser.id}`) || "password123";
      if (password !== storedPass) {
        setErrorMsg("Kata sandi salah. Silakan coba lagi atau atur ulang kata sandi.");
        return;
      }
      
      // Simulate login success
      onLoginSuccess(existingUser);
    } else {
      // Register user
      const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setErrorMsg("Email sudah terdaftar. Silakan masuk menggunakan email tersebut.");
        return;
      }

      const newUser: UserType = {
        id: "usr_" + Math.random().toString(36).substr(2, 9),
        name,
        email,
        createdAt: new Date().toISOString()
      };

      try {
        localStorage.setItem("quizai_users", JSON.stringify([...users, newUser]));
        localStorage.setItem(`quizai_password_${newUser.id}`, password);
        setSuccessMsg("Akun berhasil dibuat! Silakan masuk.");
        setIsLogin(true);
        setPassword("");
      } catch {
        setErrorMsg("Gagal menyimpan akun Anda.");
      }
    }
  };

  // Pre-fill simulation credentials to allow the user to easily click and tests
  const handleQuickDemo = () => {
    const demoUserStr = localStorage.getItem("quizai_users");
    let users = demoUserStr ? JSON.parse(demoUserStr) : [];
    
    let demoUsr = users.find((u: any) => u.email === "mentor@quiz.ai");
    if (!demoUsr) {
      demoUsr = {
        id: "usr_demo",
        name: "Pengajar Hebat",
        email: "mentor@quiz.ai",
        createdAt: new Date().toISOString()
      };
      users.push(demoUsr);
      localStorage.setItem("quizai_users", JSON.stringify(users));
    }

    localStorage.setItem("quizai_password_usr_demo", "password123");
    if (demoUsr.id !== "usr_demo") {
      localStorage.setItem(`quizai_password_${demoUsr.id}`, "password123");
    }

    setEmail("mentor@quiz.ai");
    setPassword("password123");
    setIsLogin(true);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative transition-all" id="auth-flow-gate">
      {/* Floating Theme Toggle Switch on Login gate */}
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2.5 text-slate-500 hover:text-slate-800 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all cursor-pointer shadow-sm focus:ring-2 focus:ring-indigo-600 focus:outline-none"
          title={theme === 'light' ? "Nyalakan Mode Gelap" : "Nyalakan Mode Terang"}
          aria-label={theme === 'light' ? "Nyalakan Mode Gelap" : "Nyalakan Mode Terang"}
        >
          {theme === 'light' ? <Moon className="w-5 h-5 text-slate-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* App Logo */}
        <div className="inline-flex p-3 bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white rounded-2xl shadow-indigo-100 dark:shadow-none shadow-lg mb-4">
          <GraduationCap className="w-8 h-8" />
        </div>
        
        <h2 className="text-3xl font-display font-black text-slate-800 dark:text-slate-100 tracking-tight">
          QuizAI Multimodal
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Gerbang evaluasi belajar berbasis kecerdasan artifisial. Silakan daftar atau masuk terlebih dahulu untuk menggunakan platform.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 rounded-2xl subtle-shadow border border-slate-100 dark:border-slate-800/80">
          
          {errorMsg && (
            <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-start space-x-2">
              <span className="font-bold flex-shrink-0 mt-0.5">⚠️ Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-start space-x-2">
              <span className="font-bold flex-shrink-0 mt-0.5">✅ Berhasil:</span>
              <span>{successMsg}</span>
            </div>
          )}

          {isForgotPassword ? (
            <div className="space-y-4 font-sans text-xs sm:text-sm animate-fade-in">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-250">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  aria-label="Kembali ke halaman masuk"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Atur Ulang Kata Sandi Akun</span>
              </div>

              {!isCodeSent ? (
                /* STEP 1: Enter email to query matched user */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setErrorMsg(null);
                    setSuccessMsg(null);

                    if (!forgotEmail) {
                      setErrorMsg("Silakan masukkan alamat email terdaftar.");
                      return;
                    }

                    const users = getStoredUsers();
                    const matchedUser = users.find(u => u.email.toLowerCase() === forgotEmail.toLowerCase());
                    if (!matchedUser) {
                      setErrorMsg("Alamat email tidak terdaftar. Hubungi admin atau buat akun baru.");
                      return;
                    }

                    // Generate safe secure simulation code
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    setResetCode(code);
                    setIsCodeSent(true);
                    setSuccessMsg(`Kode reset keamanan silakan lihat di simulasi di bawah.`);
                  }}
                  className="space-y-4"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    Silakan masukkan alamat email akun Anda. Kami akan merakit pesan simulasi beserta kode 6-digit rahasia di layar guna proses otentikasi.
                  </p>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alamat Email Terdaftar</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Contoh: budi@gmail.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Kirim Kode Verifikasi Reset</span>
                  </button>
                </form>
              ) : !isCodeVerified ? (
                /* STEP 2: Verify Code with pretty simulated card */
                <div className="space-y-4 text-xs sm:text-sm">
                  {/* Simulated Incoming Inbox box Notification */}
                  <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 dark:from-slate-800/60 dark:to-slate-900/40 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-950/80 space-y-2.5 shadow-sm">
                    <div className="flex items-center space-x-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider">
                      <Mail className="w-4 h-4 animate-bounce" />
                      <span>Kotak Masuk Simulasi Email</span>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 rounded-lg text-[11px] leading-relaxed text-slate-600 dark:text-slate-350 space-y-1">
                      <div><strong>Dari:</strong> security@quizai.io</div>
                      <div><strong>Subjek:</strong> Kode Atur Ulang Kata Sandi QuizAI</div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 mt-1.5">
                        Kami telah menerima permintaan riset sandi Anda. Gunakan kode keamanan di bawah ini untuk mengonfirmasi kepemilikan akun Anda:
                        <span className="block text-center font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 rounded py-1.5 px-3 font-black text-lg tracking-widest mt-2 border border-indigo-100 dark:border-indigo-900/30 shadow-inner">
                          {resetCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Masukkan Kode Verifikasi</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={userCodeInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setUserCodeInput(val);
                        if (val === resetCode) {
                          setIsCodeVerified(true);
                          setErrorMsg(null);
                          setSuccessMsg("Kode Terverifikasi! Silakan simpan sandi baru Anda.");
                        } else if (val.length === 6) {
                          setErrorMsg("Kode verifikasi salah! Coba periksa kembali kotak masuk.");
                        } else {
                          setErrorMsg(null);
                        }
                      }}
                      placeholder="Masukkan 6-digit kode keamanan"
                      className="w-full text-center font-mono text-base font-bold tracking-widest py-2.5 px-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-250 cursor-text"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsCodeSent(false);
                      setUserCodeInput("");
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-xs font-bold text-center mx-auto block text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Kirim ulang kode verifikasi
                  </button>
                </div>
              ) : (
                /* STEP 3: Enter and Confirm New Password */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setErrorMsg(null);
                    setSuccessMsg(null);

                    if (!newPassword || newPassword.length < 8) {
                      setErrorMsg("Kata sandi baru minimal harus terdiri dari 8 karakter.");
                      return;
                    }
                    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
                      setErrorMsg("Kata sandi baru wajib memadukan huruf dan angka.");
                      return;
                    }
                    if (newPassword !== confirmNewPassword) {
                      setErrorMsg("Konfirmasi kata sandi baru tidak sesuai.");
                      return;
                    }

                    // Perform simulated password updater
                    const users = getStoredUsers();
                    const matchedUser = users.find(u => u.email.toLowerCase() === forgotEmail.toLowerCase());
                    if (matchedUser) {
                      localStorage.setItem(`quizai_password_${matchedUser.id}`, newPassword);
                      setSuccessMsg("Kredensial diperbarui! Silakan login menggunakan sandi baru.");
                      setIsForgotPassword(false);
                      setIsLogin(true);
                      setEmail(forgotEmail);
                      setPassword("");
                    } else {
                      setErrorMsg("Gagal mereset kata sandi. Silakan mendaftar ulang.");
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kata Sandi Baru</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4.5 w-4.5 text-slate-400 dark:text-slate-450" />
                      </div>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimal 8 karakter (huruf & angka)"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Konfirmasi Kata Sandi Baru</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4.5 w-4.5 text-slate-400 dark:text-slate-450" />
                      </div>
                      <input
                        type="password"
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Ketik kembali kata sandi baru"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <Check className="w-4 h-4" />
                    <span>Ubah Kata Sandi Saya</span>
                  </button>
                </form>
              )}
            </div>
          ) : (
            <>
              <form className="space-y-4" onSubmit={handleAuth}>
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Ahmad Dhani"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Alamat Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Contoh: budi@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kata Sandi</label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setForgotEmail(email);
                          setErrorMsg(null);
                          setSuccessMsg(null);
                          setIsCodeSent(false);
                          setIsCodeVerified(false);
                          setUserCodeInput("");
                          setNewPassword("");
                          setConfirmNewPassword("");
                        }}
                        className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        Lupa kata sandi?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password Anda"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-700 dark:text-slate-200 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-md mt-6"
                >
                  {isLogin ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk Ke Dashboard</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Daftar Akun Baru</span>
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Button */}
              <div className="mt-5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                >
                  {isLogin ? "Belum punya akun? Buat akun baru di sini" : "Sudah memiliki akun? Masuk di sini"}
                </button>
              </div>
            </>
          )}

          <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-5">
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100/70 dark:border-slate-800 rounded-xl p-3 flex flex-col space-y-2.5">
              <div className="flex items-start space-x-2">
                <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-slate-400 dark:text-slate-450 font-medium leading-relaxed">
                  Gunakan simulasi masuk cepat untuk melewati pendaftaran secara langsung.
                </span>
              </div>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-700 dark:hover:text-indigo-300 text-slate-600 dark:text-slate-300 text-[11px] font-semibold py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer text-center transition-all"
              >
                Masuk Cepat (Akun Simulasi)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
