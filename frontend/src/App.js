import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Browse';
import CreateListing from './pages/CreateListing';
import ListingDetail from './pages/ListingDetail';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import FollowingFeed from './pages/FollowingFeed';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/chat/:listingId/:userId" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/following-feed" element={<FollowingFeed />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;