import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';

// Components
import Navbar from './components/Navbar.jsx';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ModeratorDashboard from './pages/ModeratorDashboard';
import SettingsPage from './pages/SettingsPage';
import ReputationPage from './pages/ReputationPage';
import CategoriesPage from './pages/CategoriesPage';
import ThreadPage from './pages/ThreadPage';
import NewThreadPage from './pages/NewThreadPage';
import UserProfilePage from './pages/UserProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import MessagesPage from './pages/MessagesPage';
import TrendingPage from './pages/TrendingPage';
import LatestPage from './pages/LatestPage';
import SearchPage from './pages/SearchPage';
import EditPostPage from './pages/EditPostPage';
import BookmarksPage from './pages/BookmarksPage';
import UploadManager from './pages/UploadManager';
import UserDashboard from './pages/UserDashboard';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Moderator Route Component (Admin or Moderator)
const ModeratorRoute = ({ children }) => {
  const { user, loading, isAdmin, isModerator } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || (!isAdmin && !isModerator)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/category/:slug" element={<CategoriesPage />} />
          <Route path="/categories/:id" element={<CategoriesPage />} />
          <Route path="/thread/:slug" element={<ThreadPage />} />
          <Route path="/trending" element={<TrendingPage />} />
          <Route path="/latest" element={<LatestPage />} />
          <Route path="/user/:username" element={<UserProfilePage />} />
          <Route path="/search" element={<SearchPage />} />

          {/* Protected Routes */}
          <Route path="/new-thread" element={
            <ProtectedRoute>
              <NewThreadPage />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute>
              <MessagesPage />
            </ProtectedRoute>
          } />
          <Route path="/bookmarks" element={
            <ProtectedRoute>
              <BookmarksPage />
            </ProtectedRoute>
          } />
          <Route path="/post/:postId/edit" element={
            <ProtectedRoute>
              <EditPostPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/user/:username/reputation" element={
            <ProtectedRoute>
              <ReputationPage />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/threads" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/posts" element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/uploads" element={
            <ProtectedRoute>
              <UploadManager />
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/categories" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/users" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/reports" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />
          <Route path="/admin/settings" element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          } />

          {/* Moderator Routes */}
          <Route path="/moderator" element={
            <ModeratorRoute>
              <ModeratorDashboard />
            </ModeratorRoute>
          } />
          <Route path="/moderator/reports" element={
            <ModeratorRoute>
              <ModeratorDashboard />
            </ModeratorRoute>
          } />
          <Route path="/moderator/threads" element={
            <ModeratorRoute>
              <ModeratorDashboard />
            </ModeratorRoute>
          } />
          <Route path="/moderator/users" element={
            <ModeratorRoute>
              <ModeratorDashboard />
            </ModeratorRoute>
          } />

          {/* 404 */}
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</h1>
                <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">Page not found</p>
                <a href="/" className="text-blue-600 hover:underline">Go home</a>
              </div>
            </div>
          } />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>&copy; 2024 BestApp Forum. All rights reserved.</p>
            <div className="mt-4 space-x-4">
              <a href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400">Terms</a>
              <a href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400">Privacy</a>
              <a href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
