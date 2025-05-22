import React from 'react';
import './App.css';
import QuizConverterXLSMainContainer from './components/QuizConverterXLSMainContainer';

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol">*</span> QuizConverterXLS
            </div>
          </div>
        </div>
      </nav>

      <main>
        <div className="container">
          <QuizConverterXLSMainContainer />
        </div>
      </main>
    </div>
  );
}

export default App;