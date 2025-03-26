import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from 'react-select';
import '../styles/CampaignForm.css';

const CampaignForm = ({ selectedCampaign, onSave, user, onBalanceUpdate }) => {
    const [campaign, setCampaign] = useState({
        name: "",
        keywords: "",
        bidAmount: "",
        campaignFund: "",
        status: false,
        town: "",
        radius: ""
    });
    const isEditing = !!selectedCampaign;
    const [townOptions, setTownOptions] = useState([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [keywordSuggestions, setKeywordSuggestions] = useState([]);
    const [selectedKeywords, setSelectedKeywords] = useState([]);
    const [loading, setLoading] = useState({
        towns: false,
        keywords: false,
        submit: false
    });
    const [errors, setErrors] = useState({
        towns: null,
        keywords: null,
        balance: null,
        bidAmount: null,
        network: null
    });

    useEffect(() => {
        if (!selectedCampaign) {
            resetForm();
        }
    }, [selectedCampaign]);

    useEffect(() => {
        if (selectedCampaign) {
            const initialKeywords = selectedCampaign.keywords
                ? selectedCampaign.keywords.split(", ")
                : [];

            setCampaign({
                ...selectedCampaign,
                status: selectedCampaign.status,
                town: selectedCampaign.town || ""
            });
            setSelectedKeywords(initialKeywords);
        }
        loadTowns()
    }, [selectedCampaign]);

    const loadTowns = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/towns");

            const townsData = response.data
                .map(town => {
                    const townName = String(town.name || '');
                    return {
                        value: townName,
                        label: townName
                    };
                })
                .filter(option => option.value);

            setTownOptions(townsData);
        } catch (error) {
            console.error("Error loading towns:", error);
            setErrors(prev => ({ ...prev, towns: "Failed to load towns" }));
        }
    };

    const fetchKeywordSuggestions = async (input) => {
        setLoading(prev => ({ ...prev, keywords: true }));
        try {
            const response = await axios.get(
                `http://localhost:8080/api/keywords?search=${input}`
            );
            setKeywordSuggestions(response.data);
        } catch (error) {
            console.error("Error fetching keywords:", error);
            setErrors(prev => ({ ...prev, keywords: "Failed to load keyword suggestions" }));
        } finally {
            setLoading(prev => ({ ...prev, keywords: false }));
        }
    };

    useEffect(() => {
        if (keywordInput.length > 1) {
            const timer = setTimeout(() => {
                fetchKeywordSuggestions(keywordInput);
            }, 300);

            return () => clearTimeout(timer);
        } else {
            setKeywordSuggestions([]);
        }
    }, [keywordInput]);

    const handleKeywordSelect = (keyword) => {
        if (!selectedKeywords.includes(keyword)) {
            const newKeywords = [...selectedKeywords, keyword];
            setSelectedKeywords(newKeywords);
            setCampaign(prev => ({
                ...prev,
                keywords: newKeywords.join(", ")
            }));
        }
        setKeywordInput("");
        setKeywordSuggestions([]);
    };

    const removeKeyword = (keywordToRemove) => {
        const newKeywords = selectedKeywords.filter(k => k !== keywordToRemove);
        setSelectedKeywords(newKeywords);
        setCampaign(prev => ({
            ...prev,
            keywords: newKeywords.join(", ")
        }));
    };

    const handleKeywordAdd = () => {
        if (keywordInput.trim() && !selectedKeywords.includes(keywordInput.trim())) {
            const newKeywords = [...selectedKeywords, keywordInput.trim()];
            setSelectedKeywords(newKeywords);
            setCampaign(prev => ({
                ...prev,
                keywords: newKeywords.join(", ")
            }));
            setKeywordInput("");
        }
    };

    const handleKeywordInputChange = (e) => {
        setKeywordInput(e.target.value);
    };

    const handleKeywordKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleKeywordAdd();
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === "bidAmount" && campaign.campaignFund && parseFloat(value) > parseFloat(campaign.campaignFund)) {
            setErrors(prev => ({ ...prev, bidAmount: "Bid amount cannot be greater than campaign fund" }));
        } else if (name === "bidAmount") {
            setErrors(prev => ({ ...prev, bidAmount: null }));
        }

        setCampaign({
            ...campaign,
            [name]: name === "status" ? value === "true" : value
        });
    };

    const handleChangeStatus = (e) => {
        const value = e.target.value === "true";
        setCampaign(prev => ({
            ...prev,
            status: value
        }));
    };

    const handleTownChange = (selectedOption) => {
        setCampaign({
            ...campaign,
            town: selectedOption ? selectedOption.value : ""
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(prev => ({ ...prev, submit: true }));
        setErrors(prev => ({ ...prev, balance: null, bidAmount: null, network: null }));

        try {

            if (!campaign.name || !selectedKeywords.length || !campaign.town) {
                throw new Error("Please fill all required fields");
            }

            const campaignData = {
                ...campaign,
                bidAmount: parseFloat(campaign.bidAmount),
                campaignFund: parseFloat(campaign.campaignFund),
                radius: parseInt(campaign.radius),
                status: campaign.status,
                userId: user.id
            };

            if (!isEditing) {
                const bidAmount = parseFloat(campaign.bidAmount);
                const campaignFund = parseFloat(campaign.campaignFund);

                if (bidAmount > campaignFund) {
                    setErrors(prev => ({ ...prev, bidAmount: "Bid amount cannot be greater than campaign fund" }));
                    throw new Error("Bid amount cannot be greater than campaign fund");
                }

                if (user && user.accountBalance < campaignFund) {
                    setErrors(prev => ({ ...prev, balance: "Insufficient account balance. Cannot go below 0." }));
                    throw new Error("Insufficient account balance. Cannot go below 0.");
                }

                const newBalance = user.accountBalance - campaignFund;
                await axios.put(
                    `http://localhost:8080/api/users/${user.id}/update-balance`,
                    { accountBalance: newBalance }
                );

                if (onBalanceUpdate) {
                    onBalanceUpdate(newBalance);
                }
            }

            const method = campaign.id ? "put" : "post";
            const url = campaign.id
                ? `http://localhost:8080/api/campaigns/${campaign.id}`
                : "http://localhost:8080/api/campaigns";

            const response = await axios[method](url, campaignData);
            console.log("Save response:", response.data);

            onSave();
            if (!isEditing) resetForm();
        } catch (error) {
            console.error("Detailed error:", error);

            if (error.response) {
                alert(`Error: ${error.response.data.message || error.message}`);
            } else if (error.request) {
                setErrors(prev => ({ ...prev, network: "Cannot connect to server. Please check your connection." }));
                alert("Cannot connect to server. Please check your connection.");
            } else {
                alert(`Error: ${error.message}`);
            }
        } finally {
            setLoading(prev => ({ ...prev, submit: false }));
        }
    };

    const resetForm = () => {
        setCampaign({
            name: "",
            keywords: "",
            bidAmount: "",
            campaignFund: "",
            status: "false",
            town: "",
            radius: ""
        });
        setSelectedKeywords([]);
        setKeywordInput("");
    };

    return (
        <form onSubmit={handleSubmit} className="campaign-form">
            <div className="form-group">
                <label htmlFor="name">Campaign Name *</label>
                <input
                    id="name"
                    name="name"
                    type="text"
                    value={campaign.name}
                    onChange={handleChange}
                    placeholder="Enter campaign name"
                    required
                />
            </div>

            <div className="form-group">
                <label>Keywords *</label>
                <div className="keywords-input-wrapper">
                    <div className="keywords-input-container">
                        <input
                            type="text"
                            value={keywordInput}
                            onChange={handleKeywordInputChange}
                            onKeyDown={handleKeywordKeyDown}
                            placeholder="Type to search or add keyword..."
                            className="keyword-input"
                        />
                        <button
                            type="button"
                            onClick={handleKeywordAdd}
                            className="add-keyword-btn"
                        >
                            Add
                        </button>
                    </div>

                    {loading.keywords && <div className="spinner-small"></div>}

                    {keywordSuggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {keywordSuggestions.map((keyword, index) => (
                                <li
                                    key={index}
                                    onClick={() => handleKeywordSelect(keyword)}
                                    className="suggestion-item"
                                >
                                    {keyword}
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="selected-keywords">
                        {selectedKeywords.map((keyword, index) => (
                            <span key={index} className="keyword-tag">
                                {keyword}
                                <button
                                    type="button"
                                    onClick={() => removeKeyword(keyword)}
                                    className="remove-keyword"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
                <input
                    type="hidden"
                    name="keywords"
                    value={campaign.keywords}
                    required
                />
                {errors.keywords && (
                    <div className="error-message">{errors.keywords}</div>
                )}
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label title=" How much can you pay for one view?" htmlFor="bidAmount">Bid Amount *</label>
                    <div className={`input-with-symbol ${isEditing ? 'disabled-input' : ''}`}>
                        <input
                            id="bidAmount"
                            name="bidAmount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={campaign.bidAmount}
                            onChange={handleChange}
                            placeholder="0.00"
                            required
                            disabled={isEditing}
                            readOnly={isEditing}
                        />
                        <span className="currency-symbol">$</span>
                    </div>
                    {errors.bidAmount && (
                        <div className="error-message">{errors.bidAmount}</div>
                    )}
                </div>

                <div className="form-group">
                    <label title="How much do you want to spend on the campaign?" htmlFor="campaignFund">Campaign Fund *</label>
                    <div className={`input-with-symbol ${isEditing ? 'disabled-input' : ''}`}>
                        <input
                            id="campaignFund"
                            name="campaignFund"
                            type="number"
                            min="0"
                            step="0.01"
                            value={campaign.campaignFund}
                            onChange={handleChange}
                            placeholder="0.00"
                            required
                            disabled={isEditing}
                            readOnly={isEditing}
                        />
                        <span className="currency-symbol">$</span>
                    </div>
                    {errors.balance && (
                        <div className="error-message">{errors.balance}</div>
                    )}
                </div>
            </div>

            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="status">Status *</label>
                    <select
                        id="status"
                        name="status"
                        value={campaign.status.toString()}
                        onChange={handleChangeStatus}
                        required
                    >
                        <option value="true">On</option>
                        <option value="false">Off</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="radius">Radius (km) *</label>
                    <input
                        id="radius"
                        name="radius"
                        type="number"
                        min="1"
                        value={campaign.radius}
                        onChange={handleChange}
                        placeholder="Enter radius"
                        required
                    />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="town">Town *</label>
                <Select
                    inputId="town"
                    options={townOptions}
                    value={townOptions.find(option =>
                        option.value === String(campaign.town || '')
                    )}
                    onChange={handleTownChange}
                    isClearable
                    isSearchable
                    placeholder="Select town..."
                    noOptionsMessage={() => "No towns available"}
                    className="town-select"
                    classNamePrefix="select"
                    required
                />
                {errors.towns && (
                    <div className="error-message">{errors.towns}</div>
                )}
            </div>

            <div className="form-actions">
                <button
                    type="submit"
                    disabled={loading.submit}
                    className="submit-btn"
                >
                    {loading.submit ? (
                        <span className="spinner"></span>
                    ) : (
                        campaign.id ? "Update Campaign" : "Create Campaign"
                    )}
                </button>
            </div>
        </form>
    );
};

export default CampaignForm;