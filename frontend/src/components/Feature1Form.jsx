import React, { useState } from 'react';
import { apiFetch } from '../api';

const css = `
  @keyframes modalReveal {
    from { opacity:0; transform:translateY(24px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes overlayFade { from { opacity:0; } to { opacity:1; } }
  @keyframes resultPop {
    0%   { opacity:0; transform:scale(0.85); }
    70%  { transform:scale(1.04); }
    100% { opacity:1; transform:scale(1); }
  }
  @keyframes spin { to { transform:rotate(360deg); } }

  .f1-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(2,13,26,0.82);
    backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
    animation: overlayFade 0.25s ease both;
  }

  .f1-modal {
    position: relative;
    background: linear-gradient(150deg, rgba(0,20,50,0.97) 0%, rgba(8,4,30,0.98) 100%);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 4px;
    width: min(560px, 100%);
    max-height: 90vh;
    overflow-y: auto;
    animation: modalReveal 0.35s cubic-bezier(0.16,1,0.3,1) both;
    box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,229,255,0.06);
  }
  .f1-modal::-webkit-scrollbar { width: 4px; }
  .f1-modal::-webkit-scrollbar-track { background: transparent; }
  .f1-modal::-webkit-scrollbar-thumb { background: rgba(0,229,255,0.2); border-radius: 2px; }

  /* Corner brackets */
  .f1-modal::before, .f1-modal::after {
    content:''; position:absolute; width:20px; height:20px; pointer-events:none;
  }
  .f1-modal::before { top:-1px; left:-1px; border-top:2px solid #00e5ff; border-left:2px solid #00e5ff; }
  .f1-modal::after  { bottom:-1px; right:-1px; border-bottom:2px solid #00e5ff; border-right:2px solid #00e5ff; }

  .f1-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 22px 28px 16px;
    border-bottom: 1px solid rgba(0,229,255,0.1);
  }
  .f1-title-wrap { display:flex; flex-direction:column; gap:3px; }
  .f1-eyebrow {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.6rem; font-weight:600;
    letter-spacing: 0.4em; text-transform: uppercase;
    color: rgba(0,229,255,0.4);
  }
  .f1-title {
    font-family: 'Orbitron', monospace;
    font-size: 1rem; font-weight: 700;
    letter-spacing: 0.08em;
    color: #fff;
    filter: drop-shadow(0 0 8px rgba(0,229,255,0.3));
  }
  .f1-close {
    background: transparent; border: 1px solid rgba(0,229,255,0.15);
    color: rgba(160,210,255,0.5); font-size: 1rem; cursor: pointer;
    width: 32px; height: 32px; border-radius: 3px;
    display:flex; align-items:center; justify-content:center;
    transition: all 0.2s; flex-shrink:0;
  }
  .f1-close:hover { border-color:rgba(255,80,80,0.4); color:rgba(255,140,140,0.8); background:rgba(255,40,40,0.06); }

  .f1-body { padding: 24px 28px; display:flex; flex-direction:column; gap:16px; }

  /* Field rows */
  .f1-field { display:flex; flex-direction:column; gap:6px; }
  .f1-label {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: none;       /* keep Greek letters lowercase */
    color: rgba(160,210,255,0.55);
    display: flex; align-items: center; gap: 8px;
  }
  .f1-greek {
    font-family: 'Georgia', serif;
    font-size: 1.05rem; font-weight: 700;
    color: rgba(0,229,255,0.8);
    letter-spacing: 0;
    filter: drop-shadow(0 0 6px rgba(0,229,255,0.4));
    font-style: italic;
    text-transform: none;       /* belt-and-suspenders: never uppercase Greek */
  }
  .f1-result-table .f1-greek {
    font-size: 0.95rem;
  }
  .f1-label-badge {
    font-size: 0.55rem; letter-spacing:0.1em;
    background: rgba(0,229,255,0.08); border:1px solid rgba(0,229,255,0.18);
    border-radius:2px; padding:1px 6px;
    color: rgba(0,229,255,0.45);
  }

  .f1-input, .f1-select {
    width: 100%;
    background: rgba(0,10,30,0.7);
    border: 1px solid rgba(0,229,255,0.15);
    border-radius: 3px;
    padding: 11px 14px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.9rem; font-weight:500;
    letter-spacing: 0.05em;
    color: rgba(255,255,255,0.9);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    -webkit-appearance: none;
  }
  .f1-input:focus, .f1-select:focus {
    border-color: rgba(0,229,255,0.55);
    box-shadow: 0 0 0 3px rgba(0,229,255,0.08);
  }
  .f1-input:hover, .f1-select:hover { border-color: rgba(0,229,255,0.3); }
  .f1-input::placeholder { color: rgba(160,210,255,0.2); }

  .f1-select option {
    background: #030f22; color: #fff;
  }

  /* Two-column grid for number fields */
  .f1-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }

  /* Divider */
  .f1-divider {
    height:1px;
    background:linear-gradient(90deg,transparent,rgba(0,229,255,0.12),transparent);
    margin: 4px 0;
  }

  /* Submit button */
  .f1-submit {
    position:relative; overflow:hidden;
    background: linear-gradient(135deg, rgba(0,50,90,0.7), rgba(20,10,50,0.7));
    border: 1px solid rgba(0,229,255,0.35);
    color: #fff; padding: 14px 32px;
    font-family: 'Orbitron', monospace;
    font-size: 0.75rem; font-weight:700; letter-spacing:0.25em; text-transform:uppercase;
    cursor:pointer; width:100%; border-radius:2px;
    clip-path: polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%);
    transition: border-color 0.25s, box-shadow 0.25s;
    display:flex; align-items:center; justify-content:center; gap:10px;
  }
  .f1-submit:hover:not(:disabled) {
    border-color: rgba(0,229,255,0.7);
    box-shadow: 0 0 24px rgba(0,229,255,0.2);
  }
  .f1-submit:disabled { opacity:0.5; cursor:not-allowed; }
  .f1-submit::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent);
    transition: left 0.45s;
  }
  .f1-submit:hover:not(:disabled)::after { left:150%; }

  .f1-spinner {
    width:16px; height:16px; border-radius:50%;
    border:2px solid rgba(0,229,255,0.2);
    border-top-color:#00e5ff;
    animation: spin 0.7s linear infinite;
  }

  /* ── Result panel ── */
  .f1-result {
    border: 1px solid rgba(0,229,255,0.28);
    border-radius: 3px;
    overflow: hidden;
    animation: resultPop 0.4s cubic-bezier(0.16,1,0.3,1) both;
  }

  /* Top band — the computed number */
  .f1-result-hero {
    background: linear-gradient(135deg, rgba(0,40,80,0.7), rgba(10,4,40,0.75));
    padding: 20px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    border-bottom: 1px solid rgba(0,229,255,0.15);
  }
  .f1-result-label {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.6rem; font-weight: 600;
    letter-spacing: 0.4em; text-transform: uppercase;
    color: rgba(0,229,255,0.45);
  }
  .f1-result-value {
    font-family: 'Orbitron', monospace;
    font-size: 2.4rem; font-weight: 900; line-height: 1;
    background: linear-gradient(135deg, #fff 0%, #a8e6ff 35%, #00e5ff 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: drop-shadow(0 0 18px rgba(0,229,255,0.55));
  }

  /* Inputs table below the result */
  .f1-result-inputs {
    background: rgba(0,10,28,0.5);
    padding: 14px 20px;
  }
  .f1-result-inputs-title {
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.58rem; font-weight: 600;
    letter-spacing: 0.35em; text-transform: uppercase;
    color: rgba(0,229,255,0.3);
    margin-bottom: 10px;
  }
  .f1-result-table {
    width: 100%;
    border-collapse: collapse;
  }
  .f1-result-table tr {
    border-bottom: 1px solid rgba(0,229,255,0.06);
  }
  .f1-result-table tr:last-child { border-bottom: none; }
  .f1-result-table td {
    padding: 6px 0;
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.8rem; letter-spacing: 0.05em;
    vertical-align: middle;
  }
  .f1-result-table td:first-child {
    color: rgba(160,210,255,0.45);
    font-weight: 600; letter-spacing: 0.12em;
    width: 50%;
  }
  .f1-result-table td:last-child {
    color: rgba(255,255,255,0.85);
    font-family: 'Orbitron', monospace;
    font-size: 0.75rem;
    text-align: right;
  }
  .f1-badge-type {
    display: inline-block;
    background: rgba(0,229,255,0.1);
    border: 1px solid rgba(0,229,255,0.2);
    border-radius: 2px; padding: 1px 8px;
    font-family: 'Rajdhani', sans-serif;
    font-size: 0.72rem; letter-spacing: 0.1em;
    color: rgba(0,229,255,0.7);
  }

  /* Error */
  .f1-error {
    background:rgba(255,60,60,0.07); border:1px solid rgba(255,80,80,0.25);
    border-radius:3px; padding:10px 14px;
    font-family:'Rajdhani',sans-serif; font-size:0.78rem; letter-spacing:0.05em;
    color:rgba(255,160,160,0.8);
  }
`;

const INITIAL = {
  alpha:     '',
  beta:      '',
  sigma_sqr: '',
  mu_0:      '',
  mu_1:      '',
  test_type: '1',
};

export default function Feature1Form({ token, onClose }) {
  const [fields,     setFields]     = useState(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);   // { inputs, result }
  const [error,      setError]      = useState(null);

  const handleChange = (e) => {
    setFields(f => ({ ...f, [e.target.name]: e.target.value }));
    setResult(null); // clear previous result on edit
    setError(null);
  };

  const handleSubmit = async () => {
    // Basic validation — all number fields must be filled
    const numFields = ['alpha','beta','sigma_sqr','mu_0','mu_1'];
    for (const k of numFields) {
      if (fields[k] === '' || isNaN(Number(fields[k]))) {
        setError(`"${k}" must be a valid number.`);
        return;
      }
    }

    setSubmitting(true); setError(null); setResult(null);
    try {
      const payload = {
        alpha:     parseFloat(fields.alpha),
        beta:      parseFloat(fields.beta),
        sigma_sqr: parseFloat(fields.sigma_sqr),
        mu_0:      parseFloat(fields.mu_0),
        mu_1:      parseFloat(fields.mu_1),
        test_type: parseInt(fields.test_type, 10),
      };

      const data = await apiFetch('/feature1', {
        method: 'POST',
        body:   payload,
        token,
      });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      <style>{css}</style>
      <div className="f1-overlay" onClick={handleOverlayClick}>
        <div className="f1-modal">

          {/* ── Header ── */}
          <div className="f1-header">
            <div className="f1-title-wrap">
              <span className="f1-eyebrow">Module Alpha</span>
              <span className="f1-title">Feature 1</span>
            </div>
            <button className="f1-close" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* ── Body ── */}
          <div className="f1-body">

            {/* Number fields — 2-column grid */}
            <div className="f1-grid-2">
              <div className="f1-field">
                <label className="f1-label">
                  <span className="f1-greek">α</span> Alpha <span className="f1-label-badge">step 0.01</span>
                </label>
                <input className="f1-input" type="number" name="alpha"
                  step="0.01" placeholder="0.00"
                  value={fields.alpha} onChange={handleChange} />
              </div>

              <div className="f1-field">
                <label className="f1-label">
                  <span className="f1-greek">β</span> Beta <span className="f1-label-badge">step 0.01</span>
                </label>
                <input className="f1-input" type="number" name="beta"
                  step="0.01" placeholder="0.00"
                  value={fields.beta} onChange={handleChange} />
              </div>

              <div className="f1-field">
                <label className="f1-label">
                  <span className="f1-greek">σ²</span> Sigma² <span className="f1-label-badge">step 1</span>
                </label>
                <input className="f1-input" type="number" name="sigma_sqr"
                  step="1" placeholder="0"
                  value={fields.sigma_sqr} onChange={handleChange} />
              </div>

              <div className="f1-field">
                <label className="f1-label">
                  <span className="f1-greek">μ₀</span> mu_0 <span className="f1-label-badge">step 1</span>
                </label>
                <input className="f1-input" type="number" name="mu_0"
                  step="1" placeholder="0"
                  value={fields.mu_0} onChange={handleChange} />
              </div>

              <div className="f1-field">
                <label className="f1-label">
                  <span className="f1-greek">μ₁</span> mu_1 <span className="f1-label-badge">step 1</span>
                </label>
                <input className="f1-input" type="number" name="mu_1"
                  step="1" placeholder="0"
                  value={fields.mu_1} onChange={handleChange} />
              </div>

              <div className="f1-field">
                <label className="f1-label"><span className="f1-greek">τ</span> Test Type</label>
                <select className="f1-select" name="test_type"
                  value={fields.test_type} onChange={handleChange}>
                  <option value="1">Type 1</option>
                  <option value="2">Type 2</option>
                </select>
              </div>
            </div>

            <div className="f1-divider" />

            {/* Error */}
            {error && <div className="f1-error">⚠ {error}</div>}

            {/* Result panel */}
            {result && (
              <div className="f1-result">

                {/* ── Computed result ── */}
                <div className="f1-result-hero">
                  <span className="f1-result-label">Computed Result</span>
                  <span className="f1-result-value">{result.result.toFixed(4)}</span>
                </div>

                {/* ── Input echo table ── */}
                <div className="f1-result-inputs">
                  <div className="f1-result-inputs-title">Inputs Used</div>
                  <table className="f1-result-table">
                    <tbody>
                      <tr>
                        <td><span className="f1-greek">α</span> Alpha</td>
                        <td>{result.inputs.alpha}</td>
                      </tr>
                      <tr>
                        <td><span className="f1-greek">β</span> Beta</td>
                        <td>{result.inputs.beta}</td>
                      </tr>
                      <tr>
                        <td><span className="f1-greek">σ²</span> Sigma²</td>
                        <td>{result.inputs.sigma_sqr}</td>
                      </tr>
                      <tr>
                        <td><span className="f1-greek">μ₀</span>&nbsp; mu₀</td>
                        <td>{result.inputs.mu_0}</td>
                      </tr>
                      <tr>
                        <td><span className="f1-greek">μ₁</span>&nbsp; mu₁</td>
                        <td>{result.inputs.mu_1}</td>
                      </tr>
                      <tr>
                        <td><span className="f1-greek">τ</span> Test Type</td>
                        <td>
                          <span className="f1-badge-type">
                            Type {result.inputs.test_type}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* Submit */}
            <button className="f1-submit" onClick={handleSubmit} disabled={submitting}>
              {submitting
                ? <><div className="f1-spinner" /> Computing…</>
                : '⟁  Calculate'
              }
            </button>

          </div>
        </div>
      </div>
    </>
  );
}
