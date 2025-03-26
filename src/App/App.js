import React, {useEffect, useState} from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import CampaignList from "../components/CampaignList";
import CampaignForm from "../components/CampaignForm";
import Login from "../components/Login";
import Register from "../components/Register";
import AdminPanel from "../components/AdminPanel";
import "./App.css";
import axios from "axios";

function App() {
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    useEffect(() => {
        if (user) {
            loadCampaigns();
        }
    }, [user]);

    const [campaigns, setCampaigns] = useState([]);

    const handleBalanceUpdate = (newBalance) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;

            const updatedUser = {
                ...prevUser,
                accountBalance: newBalance
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        });
    };


    const handleLogin = (userData) => {
        const normalizedUser = {
            id: userData.id,
            username: userData.username,
            isAdmin: userData.admin,
            accountBalance: userData.accountBalance
        };
        setUser(normalizedUser);
        localStorage.setItem('user', JSON.stringify(normalizedUser));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    const loadCampaigns = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/campaigns");
            setCampaigns(response.data);
        } catch (error) {
            console.error("Campaign download error", error);
        }
    };


    const handleSaveCampaign = () => {
        setSelectedCampaign(null);
        loadCampaigns();
    };

    return (
        <Router>
            {user && (
                <header className="app-header">
                    <div className="user-greeting">
                        <span>Welcome, {user.username}</span>
                    </div>
                    <div className="app-title-container">
                        <h1 className="app-title">Campaign Management System</h1>
                    </div>
                    <div className="user-actions">
                        <div className="emerald-funds">
                            <span>Emerald Funds: </span>
                            <span className="emerald-amount">${user.accountBalance.toFixed(2)}</span>
                        </div>
                        {user.isAdmin && (
                            <button onClick={() => window.location.href = '/admin'}>Admin Panel</button>
                        )}
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                </header>
            )}

            <main className="main-content">
                <Routes>
                    <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to={user.isAdmin ? "/admin" : "/campaigns"} />} />
                    <Route path="/register" element={!user ? <Register onRegister={handleLogin} /> : <Navigate to="/" />} />
                    <Route path="/campaigns" element={
                        user ? (
                            <div className="campaigns-container">
                                <CampaignForm selectedCampaign={selectedCampaign}  onSave={handleSaveCampaign} user={user} onBalanceUpdate={handleBalanceUpdate} />
                                <CampaignList onEdit={setSelectedCampaign} user={user}  campaigns={campaigns} onUpdateCampaigns={loadCampaigns} isEditing={!!selectedCampaign}/>
                            </div>
                        ) : <Navigate to="/login" />
                    } />
                    <Route path="/admin" element={user?.isAdmin ? <AdminPanel user={user} onBalanceUpdate={handleBalanceUpdate} /> : <Navigate to="/login" />} />
                    <Route path="/" element={<Navigate to={user ? (user.isAdmin ? "/admin" : "/campaigns") : "/login"} />} />
                </Routes>
            </main>
        </Router>
    );
}

export default App;
