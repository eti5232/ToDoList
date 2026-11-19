import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import service from './service.js';

function App() {
  const [newTodo, setNewTodo] = useState("");
  const [todos, setTodos] = useState([]);
  const navigate = useNavigate();

  async function getTodos() {
    const todos = await service.getTasks();
    setTodos(todos);
  }

  async function createTodo(e) {
    e.preventDefault();
    if (!newTodo.trim()) return;//לא מוסיפים משימה ריקה
    await service.addTask(newTodo);
    setNewTodo("");//clear input
    await getTodos();//refresh tasks list (in order to see the new one)
  }

  async function updateCompleted(todo, isComplete) {
    await service.setCompleted(todo.id, isComplete);
    await getTodos();//refresh tasks list (in order to see the updated one)
  }

  async function deleteTodo(id) {
    await service.deleteTask(id);
    await getTodos();//refresh tasks list
  }

  function logout() {
    service.logout();
    navigate("/login");
  }

  useEffect(() => {
    // אין טוקן שמור = המשתמשת לא מחוברת, מעבירים להתחברות
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    getTodos();
  }, []);

  const remaining = todos.filter(t => !t.isComplete).length;

  return (
    <>
      <div className="topbar">
        <span className="brand">המשימות שלי</span>
        <button className="btn btn-logout" onClick={logout}>התנתקות</button>
      </div>

      <div className="card card-wide">
        <h1 className="title">מה עושים היום?</h1>
        <p className="subtitle">הוסיפי משימה, סמני כשסיימת, ומחקי כשכבר לא צריך</p>

        <form className="add-row" onSubmit={createTodo}>
          <input className="input" placeholder="משימה חדשה..." value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)} />
          <button type="submit" className="btn btn-primary">הוספה</button>
        </form>

        {todos.length === 0 ? (
          <p className="empty">אין משימות עדיין. זה זמן טוב להתחיל</p>
        ) : (
          <ul className="todo-list">
            {todos.map(todo => (
              <li className={todo.isComplete ? "todo-item done" : "todo-item"} key={todo.id}>
                <input className="check" type="checkbox" checked={!!todo.isComplete}
                  onChange={(e) => updateCompleted(todo, e.target.checked)} />
                <span className="todo-text">{todo.name}</span>
                <button className="delete-btn" title="מחיקה" onClick={() => deleteTodo(todo.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}

        {todos.length > 0 && (
          <p className="footer-note">
            {remaining === 0 ? "סיימת את כל המשימות!" : `נשארו ${remaining} משימות לביצוע`}
          </p>
        )}
      </div>
    </>
  );
}

export default App;
