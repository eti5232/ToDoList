import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import service from './service.js';

function Register() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await service.register(userName, password);
      await service.login(userName, password);//מתחברים אוטומטית עם הפרטים שהרגע נרשמו
      navigate("/");
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError("שם המשתמש כבר קיים");
      } else {
        setError("ההרשמה נכשלה");
      }
    }
  }

  return (
    <div className="card">
      <h1 className="title">יצירת חשבון</h1>
      <p className="subtitle">כמה פרטים קטנים ומתחילים</p>

      <form className="form" onSubmit={handleSubmit}>
        <input className="input" placeholder="שם משתמש" value={userName}
          onChange={(e) => setUserName(e.target.value)} />
        <input className="input" type="password" placeholder="סיסמה" value={password}
          onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn btn-primary">הרשמה</button>
      </form>

      <p className="divider">כבר יש לך חשבון?</p>
      <Link to="/login" className="btn btn-secondary">התחברות</Link>
    </div>
  );
}

export default Register;
