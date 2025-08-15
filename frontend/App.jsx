import { useState } from "react";
import Login from "./auth/Login";
import Register from "./auth/Register";
import JudgePanel from "./components/JudgePanel";

export default function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);
  const [showRegister, setShowRegister] = useState(false);

  function handleLogin(token, username) {
    setToken(token);
    setUsername(username);
  }

  function handleLogout() {
    setToken(null);
    setUsername(null);
  }

  function handleRegister(username) {
    setShowRegister(false);
  }

  if (!token) {
    return (
      <>
        {showRegister ? (
          <>
            <Register onRegister={handleRegister} />
            <div className="flex justify-center mt-2">
              <button className="text-blue-600 underline" onClick={() => setShowRegister(false)}>
                Already have an account? Login
              </button>
            </div>
          </>
        ) : (
          <>
            <Login onLogin={handleLogin} />
            <div className="flex justify-center mt-2">
              <button className="text-blue-600 underline" onClick={() => setShowRegister(true)}>
                New user? Register
              </button>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <>
      <button
        className="absolute top-4 right-4 py-1 px-3 rounded bg-gray-300 text-gray-800 font-semibold hover:bg-gray-400"
        onClick={handleLogout}
      >Logout</button>
      <JudgePanel token={token} username={username} />
    </>
  );
}
