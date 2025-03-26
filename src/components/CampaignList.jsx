import React from "react";
import axios from "axios";
import '../styles/CampaignList.css';

const CampaignList = ({ campaigns, onEdit, onUpdateCampaigns, isEditing }) => {

    const handleDelete = (id) => {
        if (isEditing) {
            alert("You can't delete a campaign while it's being edited. Save Changes");
            return;
        }

        if (window.confirm("Are you sure to delete campaign ?")) {
            axios.delete(`http://localhost:8080/api/campaigns/${id}`)
                .then(() => {
                    onUpdateCampaigns();
                })
                .catch(error => console.error("Delete error", error));
        }
    };

    return (
        <div className="campaign-container-list">
            <h2>Campaign List</h2>
            <table>
                <thead>
                <tr>
                    <th>Campaign Name</th>
                    <th>Town</th>
                    <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {campaigns.map(campaign => (
                    <tr key={campaign.id}>
                        <td>{campaign.name}</td>
                        <td>{campaign.town}</td>
                        <td>
                            <button onClick={() => onEdit(campaign)}>Edit</button>
                            <button
                                onClick={() => handleDelete(campaign.id)}
                                disabled={isEditing}
                                title={isEditing ? "You can't delete a campaign while it's being edited. Save Changes" : ""}
                            >
                                Delete
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default CampaignList;