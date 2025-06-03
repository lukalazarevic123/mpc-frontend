// HomePage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./HomePage.css";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}

interface Organization {
  name: string;
  members: string[];
}

export function HomePage() {
  const [account, setAccount] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [orgName, setOrgName] = useState<string>("");
  const [memberInput, setMemberInput] = useState<string>("");
  const [members, setMembers] = useState<string[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  const loadOrganizations = useCallback(() => {
    const stored = localStorage.getItem("organizations");
    if (stored) {
      try {
        const parsed: Organization[] = JSON.parse(stored);
        setOrganizations(parsed);
      } catch {
        setOrganizations([]);
      }
    } else {
      setOrganizations([]);
    }
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    if (location.pathname === "/") {
      loadOrganizations();
    }
  }, [location.pathname, loadOrganizations]);

  useEffect(() => {
    localStorage.setItem("organizations", JSON.stringify(organizations));
  }, [organizations]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        });

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      });
    }
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Molimo instalirajte MetaMask da biste se povezali.");
      return;
    }
    try {
      const accounts: string[] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (err) {
      console.error("Greška pri povezivanju:", err);
    }
  };

  const openForm = () => {
    setOrgName("");
    setMemberInput("");
    setMembers([]);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
  };

  const addMember = () => {
    const trimmed = memberInput.trim();
    if (trimmed && !members.includes(trimmed)) {
      setMembers((prev) => [...prev, trimmed]);
    }
    setMemberInput("");
  };

  const submitOrganization = () => {
    const nameTrimmed = orgName.trim();
    if (nameTrimmed) {
      const exists = organizations.some((org) => org.name === nameTrimmed);
      if (!exists) {
        setOrganizations((prev) => [
          ...prev,
          { name: nameTrimmed, members: [...members] },
        ]);
      }
      closeForm();
    }
  };

  const handleOrgClick = (name: string) => {
    navigate(`/${encodeURIComponent(name)}`);
  };

  return (
    <div className="home-container">
      <div className="wallet-status">
        {account ? (
          <span className="wallet-address">{account}</span>
        ) : (
          <button className="wallet-button" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>


      <section className="organization-section">
        <h2>Organizations</h2>
        <div className="organizations-list">
          {organizations.length === 0 ? (
            <p className="org-placeholder">No organizations</p>
          ) : (
            organizations.map((org, idx) => (
              <div
                key={idx}
                className="org-item"
                onClick={() => handleOrgClick(org.name)}
              >
                {org.name}
              </div>
            ))
          )}
        </div>
        <button className="create-button" onClick={openForm}>
          Create Your Organization
        </button>
      </section>

      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              width: "90%",
              maxWidth: "400px",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ marginBottom: "16px" }}>New organization</h2>
            <label style={{ display: "block", marginBottom: "8px" }}>
            Organization name
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "4px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                }}
              />
            </label>

            <label style={{ display: "block", margin: "16px 0 8px 0" }}>
              Add members
              <div style={{ display: "flex", marginTop: "4px" }}>
                <input
                  type="text"
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px 0 0 4px",
                  }}
                />
                <button
                  onClick={addMember}
                  style={{
                    backgroundColor: "#4f46e5",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "0 4px 4px 0",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </label>
            {members.length > 0 && (
              <ul
                style={{
                  listStyle: "disc inside",
                  margin: "8px 0 0 0",
                  paddingLeft: "20px",
                  maxHeight: "100px",
                  overflowY: "auto",
                }}
              >
                {members.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            )}

            <div
              style={{
                marginTop: "24px",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={closeForm}
                style={{
                  backgroundColor: "#e5e7eb",
                  color: "#1f2937",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  marginRight: "8px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitOrganization}
                style={{
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
