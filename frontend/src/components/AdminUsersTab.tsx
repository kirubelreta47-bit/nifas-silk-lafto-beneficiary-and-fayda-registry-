import React, { useState, useEffect, useCallback } from 'react';
import { AdminUser } from '../types/registry';
import { fetchUsersApi, createUserApi, deleteUserApi } from '../services/api';
import { WOREDA_OPTIONS } from '../data/initialRecords';
import {
  Users,
  UserPlus,
  ShieldCheck,
  User,
  Trash2,
  Mail,
  MapPin,
  Lock,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  Calendar,
  X
} from 'lucide-react';

interface AdminUsersTabProps {
  currentAdmin: AdminUser | null;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ currentAdmin }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [woreda, setWoreda] = useState(WOREDA_OPTIONS[0] || 'ለቡ 01');

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchUsersApi();
      setUsers(data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.message || 'ተጠቃሚዎችን ማምጣት አልተቻለም');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim() || !username.trim() || !email.trim() || !password) {
      setFormError('እባክዎ ሁሉንም መስኮች በትክክል ይሙሉ (All fields are required)');
      return;
    }

    if (password.length < 6) {
      setFormError('የይለፍ ቃል ቢያንስ 6 ፊደላት/ቁጥሮች መሆን አለበት (Password must be at least 6 characters)');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createUserApi({
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password,
        role,
        woreda
      });

      setUsers((prev) => [...prev, created]);
      setSuccessMsg(`አዲስ ተጠቃሚ "${created.fullName}" በተሳካ ሁኔታ ተፈጥሯል`);
      setTimeout(() => setSuccessMsg(null), 5000);

      // Reset form
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setRole('user');
      setWoreda(WOREDA_OPTIONS[0] || 'ለቡ 01');
      setIsAddModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'ተጠቃሚውን መመዝገብ አልተቻለም');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userToDelete: AdminUser) => {
    if (userToDelete.id === currentAdmin?.id) {
      alert('ራስዎን መሰረዝ አይችሉም (You cannot delete your own account)');
      return;
    }

    if (!window.confirm(`እርግጠኛ ነዎት ተጠቃሚውን "${userToDelete.fullName} (${userToDelete.username})" መሰረዝ ይፈልጋሉ?`)) {
      return;
    }

    setDeletingId(userToDelete.id);
    try {
      await deleteUserApi(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setSuccessMsg(`ተጠቃሚ "${userToDelete.fullName}" ተሰርዟል`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'ተጠቃሚውን መሰረዝ አልተቻለም');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.woreda && u.woreda.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesRole =
      roleFilter === 'all'
        ? true
        : roleFilter === 'admin'
        ? u.role === 'admin' || u.role === 'super_admin'
        : u.role === 'user';

    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length;
  const userCount = users.filter((u) => u.role === 'user').length;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-blue-900 text-yellow-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">የሲስተም ተጠቃሚዎች አስተዳደር (User Management)</h2>
              <p className="text-xs text-slate-500">
                መረጃ መዝጋቢ ተጠቃሚዎችን እና የስርዓት አስተዳዳሪዎችን ይፍጠሩ፣ ይቆጣጠሩ
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-950 hover:bg-blue-900 text-white shadow-sm hover:shadow transition-all cursor-pointer border border-blue-900"
        >
          <UserPlus className="w-4 h-4 text-yellow-400" />
          <span>አዲስ ተጠቃሚ መዝግብ (Add User)</span>
        </button>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">ጠቅላላ ተጠቃሚዎች (Total)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">መረጃ መዝጋቢዎች (User Role)</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">{userCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-100/70 text-blue-900 flex items-center justify-center font-bold">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">አስተዳዳሪዎች (Admin Role)</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{adminCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold border border-yellow-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            className="flex items-center gap-1 font-bold underline hover:text-rose-950 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> እንደገና ሞክር
          </button>
        </div>
      )}

      {/* Controls: Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="በስም፣ የተጠቃሚ ስም ወይም ወረዳ..."
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 bg-slate-50 focus:bg-white transition-all font-medium"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto p-1 bg-slate-100 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              roleFilter === 'all'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ሁሉም ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('user')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              roleFilter === 'user'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            መዝጋቢዎች ({userCount})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              roleFilter === 'admin'
                ? 'bg-white text-blue-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            አስተዳዳሪዎች ({adminCount})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-8 h-8 border-3 border-blue-900/30 border-t-blue-900 rounded-full animate-spin mx-auto" />
            <p className="text-xs">ተጠቃሚዎችን በመጫን ላይ...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <User className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">ምንም ተጠቃሚ አልተገኘም</p>
            <p className="text-xs text-slate-400">የፍለጋ ቃሉን ይቀይሩ ወይም አዲስ ተጠቃሚ ይመዝግቡ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4 font-bold">ተጠቃሚ (Full Name & Username)</th>
                  <th className="py-3.5 px-4 font-bold">ሚና (System Role)</th>
                  <th className="py-3.5 px-4 font-bold">ኢሜይል (Email)</th>
                  <th className="py-3.5 px-4 font-bold">ወረዳ (Woreda)</th>
                  <th className="py-3.5 px-4 font-bold">የተመዘገበበት (Created)</th>
                  <th className="py-3.5 px-4 font-bold text-right">ድርጊት (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'admin' || u.role === 'super_admin';
                  const isCurrent = u.id === currentAdmin?.id;

                  return (
                    <tr key={u.id} className="hover:bg-blue-50/40 transition-colors">
                      {/* Name & Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isAdmin
                                ? 'bg-yellow-500/15 text-yellow-800 border border-yellow-500/30'
                                : 'bg-blue-900/10 text-blue-900 border border-blue-900/20'
                            }`}
                          >
                            {isAdmin ? 'A' : 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold">
                                  አሁን የገባህበት (You)
                                </span>
                              )}
                            </div>
                            <div className="text-slate-400 font-mono text-[11px]">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-900 border border-yellow-300">
                            <ShieldCheck className="w-3 h-3 text-yellow-700" />
                            <span>አስተዳዳሪ (Admin)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-950 border border-blue-200">
                            <User className="w-3 h-3 text-blue-700" />
                            <span>መዝጋቢ (User)</span>
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      {/* Woreda */}
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.woreda || 'ዋና መ/ቤት'}</span>
                        </div>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        {isCurrent ? (
                          <span className="text-slate-400 text-[11px] italic">ዋና አካውንት</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            disabled={deletingId === u.id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer disabled:opacity-50"
                            title="ተጠቃሚውን ሰርዝ (Delete User)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-blue-950 text-white p-5 border-b-2 border-yellow-500 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <UserPlus className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">አዲስ ተጠቃሚ መመዝገቢያ</h3>
                  <p className="text-xs text-blue-200">የመረጃ መዝጋቢ ወይም አስተዳዳሪ አካውንት መፍጠር</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ሙሉ ስም (Full Name) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ለምሳሌ፡ አቶ ዳዊት በቀለ"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 font-medium"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    የተጠቃሚ ስም (Username) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="dawit12"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 font-medium lowercase font-mono"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ኢሜይል (Email) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dawit@nslsubcity.gov.et"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 font-medium"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    የይለፍ ቃል (Password) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ቢያንስ 6 ቁምፊዎች"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 font-medium"
                  />
                </div>

                {/* Role */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    የስርዓት ሚና (Role) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 font-medium bg-white"
                  >
                    <option value="user">መዝጋቢ ተጠቃሚ (User - Data Entry)</option>
                    <option value="admin">አስተዳዳሪ (Admin - Full Access)</option>
                  </select>
                </div>

                {/* Woreda */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    የተመደበበት ወረዳ (Assigned Woreda)
                  </label>
                  <select
                    value={woreda}
                    onChange={(e) => setWoreda(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 font-medium bg-white"
                  >
                    <option value="ዋና መ/ቤት">ዋና መ/ቤት (Sub-City Main HQ)</option>
                    {WOREDA_OPTIONS.filter((w) => w !== 'ሁሉም ወረዳዎች').map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  ሰርዝ (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>በመፍጠር ላይ...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 text-yellow-400" />
                      <span>ተጠቃሚውን ፍጠር (Create User)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
