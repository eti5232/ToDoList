import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import service from './service.js';

function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await service.login(userName, password);
      navigate("/");
    } catch {
      setError("שם משתמש או סיסמה שגויים");
    }
  }

  return (
    <div className="card">
      <h1 className="title">ברוכה השבה</h1>
      <p className="subtitle">התחברי כדי לראות את המשימות שלך</p>

      <form className="form" onSubmit={handleSubmit}>
        <input className="input" placeholder="שם משתמש" value={userName}
          onChange={(e) => setUserName(e.target.value)} />
        <input className="input" type="password" placeholder="סיסמה" value={password}
          onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">התחברות</button>
      </form>

      <p className="divider">עדיין אין לך חשבון?</p>
      <Link to="/register" className="btn btn-secondary">הרשמה</Link>
    </div>
  );
}

export default Login;
