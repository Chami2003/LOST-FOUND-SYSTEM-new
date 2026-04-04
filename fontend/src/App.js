import './App.css';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import Home from './Component/Home';
import LoginPage from './Component/login_page';
import CreatePage from './Component/Create_page';
import OtpPage from './Component/Otp_page';
import UpdatePage from './Component/Update_page';
import Matching from './Component/Matching';
import ProfilePage from './Component/Profile_page';
import ReportPage from './Component/Report_page';
import ReportItemsPage from './Component/Report_items_page';
import AuctionPage from './Component/Auction_page';
import HelpPage from './Component/Help_page';
import AdminDashboard from './Component/AdminDashboard';
import MyClaimsPage from './Component/My_claims_page';

const PUBLIC_PAGES = new Set(['home', 'login', 'create', 'otp', 'update']);

function App() {
  const [page, setPage] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [navSearch, setNavSearch] = useState('');
  const [navCategory, setNavCategory] = useState('');

  const handlePageChange = (nextPage, emailToSet) => {
    if (emailToSet !== undefined) setCurrentEmail(emailToSet);
    if (nextPage === 'login') {
      setIsAuthenticated(false);
      setPage('login');
      return;
    }
    if (!isAuthenticated && !PUBLIC_PAGES.has(nextPage)) {
      setPage('login');
      return;
    }
    setPage(nextPage);
  };

  const handleAuthSuccess = (landingPage = 'matching') => {
    setIsAuthenticated(true);
    setPage(landingPage);
  };

  const renderPage = () => {
    switch (page) {
      case 'home':
        return (
          <Home
            onTogglePage={handlePageChange}
            isAuthenticated={isAuthenticated}
            navSearch={navSearch}
            onNavSearchChange={setNavSearch}
            navCategory={navCategory}
            onNavCategoryChange={setNavCategory}
          />
        );
      case 'matching':
        return (
          <Matching
            onTogglePage={handlePageChange}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            navSearch={navSearch}
            onNavSearchChange={setNavSearch}
            navCategory={navCategory}
            onNavCategoryChange={setNavCategory}
          />
        );
      case 'report':
        return (
          <ReportPage
            onTogglePage={handlePageChange}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            navSearch={navSearch}
            onNavSearchChange={setNavSearch}
            navCategory={navCategory}
            onNavCategoryChange={setNavCategory}
          />
        );
      case 'report-items':
        return (
          <ReportItemsPage
            onTogglePage={handlePageChange}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            navSearch={navSearch}
            onNavSearchChange={setNavSearch}
            navCategory={navCategory}
            onNavCategoryChange={setNavCategory}
          />
        );
      case 'auction':
        return (
          <AuctionPage
            onTogglePage={handlePageChange}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            currentEmail={currentEmail}
            navSearch={navSearch}
            onNavSearchChange={setNavSearch}
            navCategory={navCategory}
            onNavCategoryChange={setNavCategory}
          />
        );
      case 'help':
        return (
          <HelpPage
            onTogglePage={handlePageChange}
            isAuthenticated={isAuthenticated}
            navSearch={navSearch}
            onNavSearchChange={setNavSearch}
            navCategory={navCategory}
            onNavCategoryChange={setNavCategory}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            onTogglePage={handlePageChange}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            currentEmail={currentEmail}
            navSearch={navSearch}
            onNavSearchChange={setNavSearch}
            navCategory={navCategory}
            onNavCategoryChange={setNavCategory}
          />
        );
      case 'admin-dashboard':
        return (
          <AdminDashboard
            onTogglePage={handlePageChange}
            currentUser={currentUser}
            currentEmail={currentEmail}
          />
        );
      case 'claims':
        return (
          <MyClaimsPage
            onTogglePage={handlePageChange}
            isAuthenticated={isAuthenticated}
            currentUser={currentUser}
            currentEmail={currentEmail}
            navSearch={navSearch}
            onNavSearchChange={setNavSearch}
            navCategory={navCategory}
            onNavCategoryChange={setNavCategory}
          />
        );
      case 'login':
        return (
          <LoginPage
            onTogglePage={handlePageChange}
            setCurrentEmail={setCurrentEmail}
            setCurrentUser={setCurrentUser}
            onAdminLogin={() => {
              flushSync(() => {
                setIsAuthenticated(true);
              });
              setPage('admin-dashboard');
            }}
          />
        );
      case 'otp':
        return <OtpPage onTogglePage={handlePageChange} onAuthSuccess={handleAuthSuccess} email={currentEmail} />;
      case 'update':
        return <UpdatePage onTogglePage={handlePageChange} setCurrentEmail={setCurrentEmail} />;
      case 'create':
        return <CreatePage onTogglePage={handlePageChange} setCurrentEmail={setCurrentEmail} />;
      default:
        return <Home onTogglePage={handlePageChange} isAuthenticated={isAuthenticated} navSearch={navSearch} onNavSearchChange={setNavSearch} navCategory={navCategory} onNavCategoryChange={setNavCategory} />;
    }
  };

  return renderPage();
}

export default App;

