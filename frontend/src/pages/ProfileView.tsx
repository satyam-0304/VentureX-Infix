import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Mail, 
  Building, 
  Target, 
  Camera, 
  Save, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Flame, 
  Award, 
  PlayCircle, 
  LogOut, 
  Sparkles, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Check,
  Trophy,
  Brain,
  GraduationCap
} from 'lucide-react';
import { 
  profileService, 
  UserProfile, 
  LearningStats, 
  WatchHistoryItem, 
  AchievementItem 
} from '../services/profileService';
import { useLearning } from '../contexts/LearningContext';
import { formatVideoTime, formatRelativeDate, formatDate } from '../utils/timeFormat';

export const ProfileView: React.FC = () => {
  const { setActiveNavView, setActiveSessionId, seekTo } = useLearning();

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'achievements' | 'security'>('overview');

  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Profile Form State
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInstitution, setEditInstitution] = useState('');
  const [editTargetExam, setEditTargetExam] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileNotice, setProfileNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Avatar upload
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Load all initial data
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [profData, statsData, histData, achData] = await Promise.all([
          profileService.getProfile(),
          profileService.getStats(),
          profileService.getWatchHistory(),
          profileService.getAchievements()
        ]);
        if (mounted) {
          setProfile(profData);
          setEditFullName(profData.full_name);
          setEditBio(profData.bio || '');
          setEditInstitution(profData.institution || '');
          setEditTargetExam(profData.target_exam || '');
          setAvatarPreview(profData.avatar_url || null);
          setStats(statsData);
          setHistory(histData);
          setAchievements(achData);
        }
      } catch (err) {
        console.error('Failed loading profile data', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Handle avatar photo selection and base64 upload
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, or SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result as string;
      setAvatarPreview(dataUri);
      try {
        const updated = await profileService.updateAvatar(dataUri);
        setProfile(updated);
        setProfileNotice({ type: 'success', text: 'Profile picture updated successfully!' });
        setTimeout(() => setProfileNotice(null), 4000);
      } catch (err: any) {
        setProfileNotice({ type: 'error', text: err.message || 'Failed to update photo.' });
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Edit Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileNotice(null);

    if (!editFullName.trim()) {
      setProfileNotice({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await profileService.updateProfile({
        full_name: editFullName.trim(),
        bio: editBio.trim(),
        institution: editInstitution.trim(),
        target_exam: editTargetExam.trim()
      });
      setProfile(updated);
      setProfileNotice({ type: 'success', text: 'Profile information updated successfully!' });
      setTimeout(() => setProfileNotice(null), 4000);
    } catch (err: any) {
      setProfileNotice({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'Too short', color: 'bg-slate-200' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
    if (score === 4) return { score: 3, label: 'Good', color: 'bg-indigo-500' };
    return { score: 4, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getPasswordStrength(newPassword);

  // Handle Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordNotice(null);

    if (!currentPassword) {
      setPasswordNotice({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordNotice({ type: 'error', text: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await profileService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      if (result.success) {
        setPasswordNotice({ type: 'success', text: result.message });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordNotice(null), 5000);
      } else {
        setPasswordNotice({ type: 'error', text: result.message });
      }
    } catch (err: any) {
      setPasswordNotice({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Handle Resume Video from Watch History
  const handleResumeLecture = (item: WatchHistoryItem) => {
    setActiveSessionId(item.session_id);
    setActiveNavView('practice');
    setTimeout(() => {
      seekTo(item.last_timestamp_sec);
    }, 150);
  };

  // Handle Logout
  const handleLogout = async () => {
    const confirm = window.confirm('Are you sure you want to log out of Lurnix?');
    if (!confirm) return;
    await profileService.logout();
    alert('You have been logged out successfully. Default demo user session active.');
    window.location.reload();
  };

  if (isLoading) {
    return (
      <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 select-none space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse flex items-center space-x-5">
          <div className="w-20 h-20 rounded-full bg-slate-200" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-200 rounded w-48" />
            <div className="h-3 bg-slate-200 rounded w-64" />
          </div>
        </div>
      </main>
    );
  }

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80';

  return (
    <main className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 select-none space-y-6">
      {/* Hidden file input for avatar upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Top Profile Hero Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-100/40 via-purple-50/20 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Avatar & Personal Identity */}
          <div className="flex items-center space-x-5">
            <div className="relative group/avatar cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={avatarPreview || profile?.avatar_url || defaultAvatar}
                alt={profile?.full_name || 'User avatar'}
                className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/20 shadow-md group-hover/avatar:opacity-85 transition-opacity"
              />
              <button
                type="button"
                className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                title="Change Profile Picture"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-semibold">Change</span>
              </button>
              <span className="absolute bottom-0 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-2 ring-white" title="Active Student" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {profile?.full_name || 'Simona Biles'}
                </h1>
                <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-indigo-100/80 flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-500" />
                  <span>Verified Learner</span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <div className="flex items-center space-x-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile?.email || 'simona@lurnix.edu'}</span>
                </div>
                {profile?.institution && (
                  <div className="flex items-center space-x-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span>{profile.institution}</span>
                  </div>
                )}
                {profile?.target_exam && (
                  <div className="flex items-center space-x-1.5 text-indigo-600 font-medium">
                    <Target className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{profile.target_exam}</span>
                  </div>
                )}
              </div>

              {profile?.bio && (
                <p className="text-xs text-slate-600 max-w-xl line-clamp-2 pt-0.5 leading-relaxed">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center space-x-2.5 shrink-0 self-end md:self-center">
            <button
              onClick={() => setActiveTab('security')}
              className="bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
            >
              <User className="w-3.5 h-3.5" />
              <span>Edit Account</span>
            </button>
            <button
              onClick={handleLogout}
              className="bg-rose-50 hover:bg-rose-100/80 text-rose-700 border border-rose-200/60 text-xs font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center space-x-1.5"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Status Banner Alert */}
      {profileNotice && (
        <div
          className={`p-3.5 rounded-2xl flex items-center space-x-2 text-xs font-medium animate-in fade-in duration-200 ${
            profileNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {profileNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{profileNotice.text}</span>
        </div>
      )}

      {/* Tab Navigation Pill Bar */}
      <div className="flex items-center space-x-2 bg-slate-100/80 p-1.5 rounded-2xl text-xs font-semibold text-slate-600 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Overview & Stats</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'history'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-purple-500" />
          <span>Recently Watched ({history.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'achievements'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Achievements ({achievements.filter((a) => a.is_unlocked).length}/{achievements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center space-x-2 ${
            activeTab === 'security'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Lock className="w-3.5 h-3.5 text-emerald-500" />
          <span>Account Settings & Security</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW & LEARNING STATS                          */}
      {/* ======================================================== */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lectures Studied</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PlayCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.total_lectures_watched}</div>
              <p className="text-[11px] text-slate-500">{stats.total_lectures_completed} lessons fully completed</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Learning Time</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.total_learning_time_formatted}</div>
              <p className="text-[11px] text-slate-500">Across {stats.active_modules_count} STEM course tracks</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Quiz Accuracy</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.average_quiz_accuracy}%</div>
              <p className="text-[11px] text-slate-500">{stats.quizzes_completed} of {stats.quizzes_attempted} checkpoints passed</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Study Streak</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Flame className="w-4 h-4 fill-amber-500" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stats.current_streak_days} Days</div>
              <p className="text-[11px] text-slate-500">Active study consistency record</p>
            </div>
          </div>

          {/* Curriculum Mastery Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Academic Curriculum Mastery</h3>
                  <p className="text-xs text-slate-400">Progression across assigned video modules and retainment checks</p>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  Top 5% Cohort
                </span>
              </div>

              {/* Progress bars */}
              <div className="space-y-3.5 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700">Engineering Chemistry: Polymers & Macromolecules</span>
                    <span className="text-indigo-600 font-bold">78%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[78%] rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700">Organic Chemistry: SN1 / SN2 Kinetics</span>
                    <span className="text-emerald-600 font-bold">100%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[100%] rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-slate-700">Classical Mechanics: Rotational Dynamics</span>
                    <span className="text-purple-600 font-bold">40%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 w-[40%] rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Resume Active Lesson Card */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold border border-indigo-400/20 mb-3">
                  <Brain className="w-3 h-3" />
                  <span>Resume Learning</span>
                </div>
                <h4 className="font-bold text-base text-white">Polymers & Macromolecules</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Stopped at checkpoint <span className="text-amber-300 font-mono">06:42</span>. Your next interactive task is waiting!
                </p>
              </div>

              <button
                onClick={() => {
                  setActiveSessionId('session-pl-04');
                  setActiveNavView('practice');
                  setTimeout(() => seekTo(402), 150);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-transform hover:scale-[1.02] cursor-pointer"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Jump to 06:42 in Lecture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: WATCH HISTORY                                      */}
      {/* ======================================================== */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recently Watched Lecture Sessions</h3>
              <p className="text-xs text-slate-400">Click any session to jump directly back to your last video timestamp.</p>
            </div>
            <span className="text-xs text-slate-500 font-mono font-medium">{history.length} recorded</span>
          </div>

          <div className="divide-y divide-slate-100">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => handleResumeLecture(item)}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2.5 rounded-2xl transition-colors cursor-pointer group"
              >
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PlayCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400">{item.course_name}</p>

                    {/* Progress Bar */}
                    <div className="w-48 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div
                        style={{ width: `${item.progress_percent}%` }}
                        className={`h-full ${item.completed ? 'bg-emerald-500' : 'bg-indigo-500'} rounded-full`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4 shrink-0 sm:text-right pl-13 sm:pl-0">
                  <div className="flex flex-col text-xs">
                    <span className="font-mono text-slate-700 font-semibold">
                      {item.last_timestamp_formatted} / {item.duration_formatted}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center sm:justify-end space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{item.updated_at_relative}</span>
                    </span>
                  </div>

                  <button
                    className="p-2 rounded-xl bg-slate-100 text-slate-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                    title="Resume"
                  >
                    <ArrowRight className="w-4 h-4 pointer-events-none" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ACHIEVEMENTS & MILESTONES                          */}
      {/* ======================================================== */}
      {activeTab === 'achievements' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Academic Milestones & Badges</h3>
              <p className="text-xs text-slate-400">Earn recognition for consistent study habits and concept retention.</p>
            </div>
            <span className="text-xs bg-amber-50 text-amber-800 font-semibold px-3 py-1 rounded-full border border-amber-200 flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span>{achievements.filter((a) => a.is_unlocked).length} Earned</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((item) => {
              const tierColor =
                item.tier === 'platinum'
                  ? 'border-purple-200 bg-purple-50/40 text-purple-700'
                  : item.tier === 'gold'
                  ? 'border-amber-200 bg-amber-50/40 text-amber-700'
                  : item.tier === 'silver'
                  ? 'border-slate-200 bg-slate-50 text-slate-700'
                  : 'border-orange-200 bg-orange-50/40 text-orange-700';

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl border transition-all ${
                    item.is_unlocked
                      ? 'bg-white shadow-sm hover:shadow-md border-slate-200/80'
                      : 'bg-slate-50/60 opacity-60 border-dashed border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md">
                      <Award className="w-5 h-5 pointer-events-none" />
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierColor}`}>
                      {item.tier}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.description}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    {item.is_unlocked ? (
                      <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Unlocked {item.unlocked_at ? formatDate(item.unlocked_at) : 'Active'}</span>
                      </span>
                    ) : (
                      <div className="w-full space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                          <span>Progress</span>
                          <span>{item.progress_percent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div style={{ width: `${item.progress_percent}%` }} className="h-full bg-slate-400 rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: ACCOUNT SETTINGS & SECURITY                        */}
      {/* ======================================================== */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Personal Information Form */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
              <p className="text-xs text-slate-400">Update your student profile visible across discussion boards.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-slate-900"
                    placeholder="e.g. Simona Biles"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile?.email || 'simona@lurnix.edu'}
                    disabled
                    className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Managed via student university domain authentication.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Institution / College</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editInstitution}
                      onChange={(e) => setEditInstitution(e.target.value)}
                      className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-slate-900"
                      placeholder="e.g. Stanford University"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Exam / Focus</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editTargetExam}
                      onChange={(e) => setEditTargetExam(e.target.value)}
                      className="w-full text-xs p-2.5 pl-9 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-slate-900"
                      placeholder="e.g. GATE 2026 / Chemistry"
                    />
                    <Target className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Bio & Learning Goals</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-slate-900 leading-relaxed"
                  placeholder="Share a short bio regarding your research focus or academic target..."
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5 pointer-events-none" />
                  <span>{isSavingProfile ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Password & Security Form */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Password & Security</h3>
              <p className="text-xs text-slate-400">Change your password with PBKDF2 cryptographic hashing.</p>
            </div>

            {passwordNotice && (
              <div
                className={`p-3 rounded-xl flex items-center space-x-2 text-xs font-medium ${
                  passwordNotice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {passwordNotice.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{passwordNotice.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full text-xs p-2.5 pl-9 pr-9 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-slate-900"
                    placeholder="Enter current password"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs p-2.5 pl-9 pr-9 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-slate-900"
                    placeholder="Minimum 8 characters with numbers & uppercase"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className="font-semibold text-slate-700">{strength.label}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 rounded-full ${
                            step <= strength.score ? strength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs p-2.5 pl-9 pr-9 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 text-slate-900"
                    placeholder="Repeat new password"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5 pointer-events-none" />
                  <span>{isUpdatingPassword ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
