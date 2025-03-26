import React, { useState } from 'react';
import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import '../styles/Register.css';

const Register = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [disabled, setDisabled] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage('Passwords do not match');
            return;
        }

        setLoading(true);
        setDisabled(true);
        try {
            await axios.post('http://localhost:8080/api/auth/register', {
                username,
                password
            });
            setMessage('Registration successful!');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setMessage(err.response?.data || 'Registration failed');
            setDisabled(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-box">
                <h2>Register Page</h2>
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
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <button type="submit" disabled={loading || disabled}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                    {message && <p>{message}</p>}
                </form>
                <p className="login-text">Have an account?
                    <span onClick={() => navigate('/login')} style={{ color: '#61dafb', cursor: 'pointer' }}> Log In</span>
                </p>
            </div>
        </div>
    );
};

export default Register;
