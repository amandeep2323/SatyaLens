import React from 'react';
import UploadZone from './components/UploadZone';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>SatyaLens 👁️</h1>
        <p>Digital Forensics & AI Detection System</p>
      </header>
      
      <main>
        <UploadZone />
      </main>
    </div>
  );
}

export default App;