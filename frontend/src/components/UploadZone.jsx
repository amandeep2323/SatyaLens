import React, { useState } from 'react';

const UploadZone = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null); // Reset previous results
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // Connect to your Python Backend
      const response = await fetch("http://127.0.0.1:4242/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed. Is Python running?");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

return (
    <div className="upload-container">
      <div className="drop-zone">
        <input type="file" onChange={handleFileChange} accept="image/*" />
        <p>{file ? `Selected: ${file.name}` : "Drag & Drop Image or Click to Upload"}</p>
      </div>

      <button onClick={handleUpload} disabled={!file || loading} className="analyze-btn">
        {loading ? "Analyzing Bitstream & Metadata..." : "Analyze Authenticity"}
      </button>

      {error && <div className="error-box">⚠️ {error}</div>}

      {result && (
        <div className="results-box">
          <h2>Global Verdict: <span className={result.final_verdict === "Clean" ? "green" : "red"}>{result.final_verdict}</span> ({result.final_score}%)</h2>
          
          {/* --- LAYER 0 CARD --- */}
          <div className="layer-card">
            <h3>Layer 0: Bitstream Reality</h3>
            <p><strong>Score:</strong> {result.layers.l0_bitstream.score}/100</p>
            {result.layers.l0_bitstream.flags.length > 0 ? (
              <ul className="flags-list">
                {result.layers.l0_bitstream.flags.map((flag, index) => <li key={index}>🚩 {flag}</li>)}
              </ul>
            ) : <p className="clean-note">✅ Structure looks original.</p>}
          </div>

          {/* --- LAYER 1 CARD (NEW) --- */}
          <div className="layer-card">
            <h3>Layer 1: Metadata & Provenance</h3>
            <p><strong>Score:</strong> {result.layers.l1_metadata.score}/100</p>
            {result.layers.l1_metadata.flags.length > 0 ? (
              <ul className="flags-list">
                {result.layers.l1_metadata.flags.map((flag, index) => <li key={index}>🚩 {flag}</li>)}
              </ul>
            ) : <p className="clean-note">✅ No suspicious tags found.</p>}
          </div>
          {/* --- LAYER 2 FORENSICS CARD --- */}
          <div className="layer-card">
            <h3>Layer 2: Digital Forensics</h3>
            <p><strong>Score:</strong> {result.layers.l2_forensics.score}/100</p>
            
            {result.layers.l2_forensics.flags.length > 0 ? (
              <ul className="flags-list">
                {result.layers.l2_forensics.flags.map((flag, index) => <li key={index}>🚩 {flag}</li>)}
              </ul>
            ) : <p className="clean-note">✅ Noise patterns look natural.</p>}

            {/* ELA IMAGE DISPLAY */}
            {result.layers.l2_forensics.ela_image && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '0.9rem', color: '#888' }}>Error Level Analysis (White = Edited/Fake):</p>
                <img 
                  src={`data:image/jpeg;base64,${result.layers.l2_forensics.ela_image}`} 
                  alt="ELA Heatmap" 
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #444' }}
                />
              </div>
            )}
          </div>
          {/* --- LAYER 3 FREQUENCY CARD --- */}
          <div className="layer-card">
            <h3>Layer 3: Frequency Analysis</h3>
            <p><strong>Score:</strong> {result.layers.l3_frequency.score}/100</p>
            
            {result.layers.l3_frequency.flags.length > 0 ? (
              <ul className="flags-list">
                {result.layers.l3_frequency.flags.map((flag, index) => <li key={index}>🚩 {flag}</li>)}
              </ul>
            ) : <p className="clean-note">✅ Frequency spectrum follows natural decay.</p>}

            {/* FFT IMAGE DISPLAY */}
            {result.layers.l3_frequency.spectrum_image && (
              <div style={{ marginTop: '10px' }}>
                <p style={{ fontSize: '0.9rem', color: '#888' }}>Fourier Spectrum  (Artificial peaks look like bright stars):</p>
                <img 
                  src={`data:image/jpeg;base64,${result.layers.l3_frequency.spectrum_image}`} 
                  alt="FFT Spectrum" 
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #444' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadZone;