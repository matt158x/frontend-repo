import React, { useState } from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import '../styles/Login.css';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', {
                username,
                password
            });

            onLogin(response.data);
            navigate(response.data ? '/admin' : '/campaigns');
        } catch (err) {
            setError(err.response?.status === 401
                ? "Invalid username or password"
                : "Login failed");
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Login Page</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
                <p className="register-text">Don't have an account? <span onClick={() => navigate('/register')} style={{ color: '#61dafb', cursor: 'pointer' }}>Create Account</span></p>
            </div>
        </div>
    );
};

export default Login;