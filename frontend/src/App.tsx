import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import { UserRole, Permission } from './types';
import './App.css';
import './index.css';
import { HelmetProvider } from 'react-helmet-async';

// Lazy Loading страниц
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Catalog = lazy(() => import('./pages/Catalog'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const AddBook = lazy(() => import('./pages/AddBook'));
const EditBook = lazy(() => import('./pages/EditBook'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const BookDetail = lazy(() => import('./pages/BookDetail'));
const Notifications = lazy(() => import('./components/Notifications'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const AdminBooks = lazy(() => import('./pages/AdminBooks'));
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: var(--text-primary);
    line-height: 1.6;
  }
`;

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          <div className="App">
            <Header />
            <main>
              <Suspense fallback={<div className="loading">Загрузка...</div>}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/catalog" element={<Catalog />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/user/:userId" element={<UserProfile />} />
                  <Route path="/book/:id" element={<BookDetail />} />

                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute requiredRole={UserRole.USER}>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/add-book"
                    element={
                      <ProtectedRoute requiredPermissions={[Permission.BOOKS_CREATE]}>
                        <AddBook />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/edit-book/:id"
                    element={
                      <ProtectedRoute requiredPermissions={[Permission.BOOKS_EDIT]}>
                        <EditBook />
                      </ProtectedRoute>
                    }
                  />
                  
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole={UserRole.ADMIN}>
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute 
                        requiredRole={UserRole.ADMIN}
                        requiredPermissions={[Permission.ROLES_MANAGE]}
                      >
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/books"
                    element={
                      <ProtectedRoute 
                        requiredRole={UserRole.ADMIN}
                        requiredPermissions={[Permission.BOOKS_EDIT_ANY]}
                      >
                        <AdminBooks />
                      </ProtectedRoute>
                    }
                  />

                  <Route path="/unauthorized" element={<Unauthorized />} />
                  
                </Routes>
              </Suspense>
            </main>
            <footer style={{ textAlign: 'center', padding: '2rem', color: 'white', fontSize: '0.875rem' }}>
              <p>© {new Date().getFullYear()} Book Exchange. Все права защищены.</p>
            </footer>
            <Notifications />
          </div>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;