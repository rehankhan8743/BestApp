import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, Mail, Bell, Shield, Eye, EyeOff, Trash2, 
  Save, Key, Globe, Moon, Sun, AlertTriangle 
} from 'lucide-react';

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  const { put } = useApi();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  
  // Account Settings
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    replyNotifications: true,
    mentionNotifications: true,
    likeNotifications: true,
    followNotifications: true,
    digestEmail: false,
    pushNotifications: true
  });

  // Privacy Settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showActivity: true,
    allowMessages: 'all',
    showOnlineStatus: true
  });

  // Appearance Settings
  const [appearance, setAppearance] = useState({
    theme: 'auto',
    language: 'en',
    timezone: 'UTC'
  });

  // Danger Zone
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (res?.success) {
        alert('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        alert(res?.message || 'Failed to change password');
      }
    } catch (error) {
      alert('Current password is incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    setLoading(true);
    try {
      const res = await put('/users/settings', { notifications });
      if (res?.success) {
        alert('Notification settings saved!');
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacySave = async () => {
    setLoading(true);
    try {
      const res = await put('/users/settings', { privacy });
      if (res?.success) {
        alert('Privacy settings saved!');
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceSave = async () => {
    setLoading(true);
    try {
      const res = await put('/users/settings', { appearance });
      if (res?.success) {
        alert('Appearance settings saved!');
        if (appearance.theme !== 'auto') {
          localStorage.setItem('theme', appearance.theme);
        }
      }
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== user.username) {
      alert('Username does not match!');
      return;
    }

    if (!confirm('This action cannot be undone. Are you absolutely sure?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await put('/users/delete-account');
      if (res?.success) {
        logout();
        navigate('/');
        alert('Account deleted successfully');
      } else {
        alert(res?.message || 'Failed to delete account');
      }
    } catch (error) {
      alert('Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Moon },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="w-7 h-7" />
            Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {/* Account Tab */}
            {activeTab === 'account' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Key className="w-6 h-6" />
                  Change Password
                </h2>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Change Password'}
                  </button>
                </form>

                {/* Account Info */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Username</span>
                      <span className="font-medium text-gray-800">{user?.username}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium text-gray-800">{user?.email}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Member Since</span>
                      <span className="font-medium text-gray-800">
                        {new Date(user?.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Role</span>
                      <span className="font-medium text-gray-800 capitalize">{user?.role}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Bell className="w-6 h-6" />
                  Notification Preferences
                </h2>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-700">Email Notifications</h3>
                    
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-800">Reply Notifications</p>
                        <p className="text-sm text-gray-500">Get notified when someone replies to your posts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.replyNotifications}
                        onChange={(e) => setNotifications({...notifications, replyNotifications: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-800">Mention Notifications</p>
                        <p className="text-sm text-gray-500">Get notified when someone mentions you</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.mentionNotifications}
                        onChange={(e) => setNotifications({...notifications, mentionNotifications: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-800">Like Notifications</p>
                        <p className="text-sm text-gray-500">Get notified when someone likes your posts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.likeNotifications}
                        onChange={(e) => setNotifications({...notifications, likeNotifications: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-800">Follow Notifications</p>
                        <p className="text-sm text-gray-500">Get notified when someone follows you</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.followNotifications}
                        onChange={(e) => setNotifications({...notifications, followNotifications: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-800">Weekly Digest Email</p>
                        <p className="text-sm text-gray-500">Receive a weekly summary of top posts</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications.digestEmail}
                        onChange={(e) => setNotifications({...notifications, digestEmail: e.target.checked})}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleNotificationSave}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  Privacy Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={privacy.profileVisibility}
                      onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="members">Members Only - Logged in users</option>
                      <option value="private">Private - Only you</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Who can send you messages?
                    </label>
                    <select
                      value={privacy.allowMessages}
                      onChange={(e) => setPrivacy({...privacy, allowMessages: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Everyone</option>
                      <option value="following">People I follow</option>
                      <option value="none">No one</option>
                    </select>
                  </div>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-800">Show Email Address</p>
                      <p className="text-sm text-gray-500">Display email on your profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.showEmail}
                      onChange={(e) => setPrivacy({...privacy, showEmail: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-800">Show Online Status</p>
                      <p className="text-sm text-gray-500">Let others see when you're online</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.showOnlineStatus}
                      onChange={(e) => setPrivacy({...privacy, showOnlineStatus: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-800">Show Activity</p>
                      <p className="text-sm text-gray-500">Display your recent activity on profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacy.showActivity}
                      onChange={(e) => setPrivacy({...privacy, showActivity: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>

                  <button
                    onClick={handlePrivacySave}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Privacy Settings'}
                  </button>
                </div>
              </div>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Moon className="w-6 h-6" />
                  Appearance Settings
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Theme
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        onClick={() => setAppearance({...appearance, theme: 'light'})}
                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                          appearance.theme === 'light' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <Sun className="w-6 h-6 text-yellow-500" />
                        <span className="text-sm font-medium">Light</span>
                      </button>
                      <button
                        onClick={() => setAppearance({...appearance, theme: 'dark'})}
                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                          appearance.theme === 'dark' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <Moon className="w-6 h-6 text-blue-500" />
                        <span className="text-sm font-medium">Dark</span>
                      </button>
                      <button
                        onClick={() => setAppearance({...appearance, theme: 'auto'})}
                        className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 ${
                          appearance.theme === 'auto' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex gap-1">
                          <Sun className="w-6 h-6 text-yellow-500" />
                          <Moon className="w-6 h-6 text-blue-500" />
                        </div>
                        <span className="text-sm font-medium">Auto</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={appearance.language}
                      onChange={(e) => setAppearance({...appearance, language: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="bn">বাংলা (Bengali)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timezone
                    </label>
                    <select
                      value={appearance.timezone}
                      onChange={(e) => setAppearance({...appearance, timezone: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Asia/Dhaka">Bangladesh (GMT+6)</option>
                      <option value="Asia/Kolkata">India (GMT+5:30)</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="Europe/London">London</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAppearanceSave}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {loading ? 'Saving...' : 'Save Appearance'}
                  </button>
                </div>
              </div>
            )}

            {/* Danger Zone Tab */}
            {activeTab === 'danger' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Danger Zone
                </h2>

                <div className="space-y-6">
                  {/* Delete Account */}
                  <div className="border border-red-200 rounded-xl p-6 bg-red-50">
                    <h3 className="text-lg font-bold text-red-800 mb-2">Delete Account</h3>
                    <p className="text-red-700 mb-4">
                      Once you delete your account, there is no going back. All your data, posts, and 
                      profile information will be permanently removed.
                    </p>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-red-800 mb-2">
                        Type your username to confirm: <strong>{user?.username}</strong>
                      </label>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        className="w-full px-4 py-3 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        placeholder="Enter your username"
                      />
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading || deleteConfirm !== user?.username}
                      className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      {loading ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>

                  {/* Export Data */}
                  <div className="border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Export Your Data</h3>
                    <p className="text-gray-600 mb-4">
                      Download all your data including posts, profile information, and activity history.
                    </p>
                    <button className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Request Data Export
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
