import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Catalog from './pages/Catalog';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import AddBook from './pages/AddBook';
import EditBook from './pages/EditBook';
import UserProfile from './pages/UserProfile';
import BookDetail from './pages/BookDetail';
import Notifications from './components/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPanel from './pages/AdminPanel';
import Unauthorized from './pages/Unauthorized';
import AdminBooks from './pages/AdminBooks';
import './App.css';
import './index.css';
import { UserRole, Permission } from './types';
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
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Catalog />} />
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
          </main>
          <Notifications />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;