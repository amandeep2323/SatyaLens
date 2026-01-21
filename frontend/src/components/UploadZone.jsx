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
      {/* --- UPLOAD AREA --- */}
      <div className="drop-zone">
        <input type="file" onChange={handleFileChange} accept="image/*" />
        <p>{file ? `Selected: ${file.name}` : "Drag & Drop Image or Click to Upload"}</p>
      </div>

      <button onClick={handleUpload} disabled={!file || loading} className="analyze-btn">
        {loading ? "Scanning Bitstream & Physics..." : "Analyze Authenticity"}
      </button>

      {/* --- ERROR MESSAGE --- */}
      {error && <div className="error-box">⚠️ {error}</div>}

      {/* --- RESULTS DISPLAY --- */}
      {result && (
        <div className="results-box">
          <h2 className="verdict-header">
            Global Verdict: <span className={result.final_verdict === "Clean" || result.final_verdict.includes("Real") ? "green" : "red"}>
              {result.final_verdict}
            </span> ({result.final_score}%)
          </h2>
          
          {/* DYNAMIC LAYER GENERATION */}
          {Object.values(result.layers).map((layer, index) => (
            <div key={index} className="layer-card">
              
              {/* LEFT COLUMN: Summary (Flags & Images) */}
              <div className="layer-left">
                <h3>{layer.layer_name.replace(/_/g, ' ')}</h3>
                <div className="score-badge">Score: {layer.score}/100</div>
                
                {/* Flags List */}
                {layer.flags.length > 0 ? (
                  <ul className="flags-list">
                    {layer.flags.map((flag, i) => <li key={i}>🚩 {flag}</li>)}
                  </ul>
                ) : (
                  <p className="clean-note">✅ No anomalies detected.</p>
                )}

                {/* Visual Evidence (ELA / Spectrum) */}
                {layer.ela_image && (
                  <div className="visual-evidence">
                    <p>ELA Heatmap (White = Error/Edit)</p>
                    <img src={`data:image/jpeg;base64,${layer.ela_image}`} alt="ELA Analysis" />
                  </div>
                )}
                {layer.spectrum_image && (
                  <div className="visual-evidence">
                    <p>Fourier Spectrum (Grid = GAN)</p>
                    <img src={`data:image/jpeg;base64,${layer.spectrum_image}`} alt="Frequency Analysis" />
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Deep Details (Telemetry) */}
              <div className="layer-right">
                <h4>📊 Technical Telemetry</h4>
                <div className="details-grid">
                  {layer.details && Object.entries(layer.details).length > 0 ? (
                    Object.entries(layer.details).map(([key, value]) => (
                      <div key={key} className="detail-item">
                        <span className="detail-key">{key.replace(/_/g, ' ')}</span>
                        <span className="detail-value">{value}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">No metrics available</p>
                  )}
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UploadZone;