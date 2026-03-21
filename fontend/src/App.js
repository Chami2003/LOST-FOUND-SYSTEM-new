import './App.css';
import React, { useState } from 'react';
import LoginPage from './Component/login_page';
import CreatePage from './Component/Create_page';
import OtpPage from './Component/Otp_page';
import UpdatePage from './Component/Update_page';

function App() {
  const [page, setPage] = useState('create');
  const [currentEmail, setCurrentEmail] = useState('');

  const handlePageChange = (nextPage, emailToSet) => {
    if (emailToSet !== undefined) setCurrentEmail(emailToSet);
    setPage(nextPage);
  };

  const renderPage = () => {
    switch (page) {
      case 'login':
        return <LoginPage onTogglePage={handlePageChange} setCurrentEmail={setCurrentEmail} />;
      case 'otp':
        return <OtpPage onTogglePage={handlePageChange} email={currentEmail} />;
      case 'update':
        return <UpdatePage onTogglePage={handlePageChange} setCurrentEmail={setCurrentEmail} />;
      default:
        return <CreatePage onTogglePage={handlePageChange} setCurrentEmail={setCurrentEmail} />;
    }
  };

  return renderPage();
}

export default App;

