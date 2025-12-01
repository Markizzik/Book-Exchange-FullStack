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
import './App.css';
import './index.css';

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
              <Route path="/profile" element={<Profile />} />
              <Route path="/add-book" element={<AddBook />} />
              <Route path="/edit-book/:id" element={<EditBook />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/book/:id" element={<BookDetail />} />
            </Routes>
          </main>
          <Notifications />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;