import React, {useEffect, useState} from 'react';
import axios from 'axios';
import CampaignForm from './CampaignForm';
import '../styles/AdminPanel.css';

const AdminPanel = ({ user, onBalanceUpdate }) => {
    const [users, setUsers] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [amount, setAmount] = useState('');
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchCampaigns();
    }, []);

    const fetchUsers = () => {
        axios.get('http://localhost:8080/api/users')
            .then(res => {
                console.log("Users from API:", res.data);
                setUsers(res.data);
            })
            .catch(err => console.error(err));
    };

    const fetchCampaigns = () => {
        axios.get('http://localhost:8080/api/campaigns')
            .then(res => setCampaigns(res.data))
            .catch(err => console.error(err));
    };

    const addFunds = (userId) => {
        axios.put(`http://localhost:8080/api/users/${userId}/update-balance`, { accountBalance: parseFloat(amount) })
            .then(() => {
                alert('Funds added');
                setUsers(users.map(u =>
                    u.id === userId ? { ...u, accountBalance: u.accountBalance + parseFloat(amount) } : u
                ));

                if (userId === user.id) {
                    const newBalance = user.accountBalance + parseFloat(amount);
                    onBalanceUpdate(newBalance);
                }

                setAmount('');
                setSelectedUser(null);
            })
            .catch(err => {
                console.error(err);
                alert('Failed to add funds');
            });
    };

    const handleCampaignSave = () => {
        fetchCampaigns();
        setSelectedCampaign(null);
        setIsEditing(false);
    };

    const handleEditCampaign = (campaign) => {
        setSelectedCampaign(campaign);
        setIsEditing(true);
    };

    const deleteCampaign = (campaignId) => {
        if (isEditing) {
            alert("You can't delete a campaign while it's being edited. Save changes first.");
            return;
        }

        if (window.confirm('Are you sure you want to delete this campaign?')) {
            axios.delete(`http://localhost:8080/api/campaigns/${campaignId}`)
                .then(() => {
                    alert('Campaign deleted successfully');
                    fetchCampaigns();
                })
                .catch(err => {
                    console.error(err);
                    alert('Failed to delete campaign');
                });
        }
    };

    return (
        <div className="admin-panel-container">
            <CampaignForm
                selectedCampaign={selectedCampaign}
                onSave={handleCampaignSave}
                user={user}
                onBalanceUpdate={onBalanceUpdate}
            />
            <h2>Existing Campaigns</h2>
            <table>
                <thead>
                <tr>
                    <th>Campaign Name</th>
                    <th>Town</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {campaigns.map(campaign => (
                    <tr key={campaign.id}>
                        <td>{campaign.name}</td>
                        <td>{campaign.town}</td>
                        <td>{campaign.status ? "Active" : "Inactive"}</td>
                        <td>
                            <button onClick={() => handleEditCampaign(campaign)}>Edit</button>
                            <button
                                onClick={() => deleteCampaign(campaign.id)}
                                disabled={isEditing}
                                title={isEditing ? "You can't delete a campaign while it's being edited. Save changes first." : ""}
                                className="delete-button"
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <h2>User List</h2>
            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Balance</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {users.map(user => (
                    <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.username}</td>
                        <td>${user.accountBalance.toFixed(2)}</td>
                        <td>
                            <button
                                onClick={() => setSelectedUser(user)}
                                className="update-balance-button"
                            >
                                Update Balance
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            {selectedUser && (
                <div className="balance-update-section">
                    <h2>Update Balance for {selectedUser.username}</h2>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter amount of Emerald Funds to add"
                    />
                    <button onClick={() => addFunds(selectedUser.id)}>Add Funds</button>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;