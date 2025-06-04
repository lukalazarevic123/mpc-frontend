// HomePage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserButton, useUser } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";
import { useAccount, useConnect, useBalance, useDisconnect } from "wagmi";
import "./HomePage.css";

interface Organization {
  name: string;
  members: string[];
}

export function HomePage() {
  // ---------- 1) Civic Auth + Embedded Wallet Hooks ----------
  const userContext = useUser();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address: embeddedAddress, isConnected: embeddedIsConnected } = useAccount();
  const balanceResult = useBalance({
    address: embeddedIsConnected ? embeddedAddress : undefined,
  });

  // ---------- 2) State za organizacije ----------
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [orgName, setOrgName] = useState<string>("");
  const [memberInput, setMemberInput] = useState<string>("");
  const [members, setMembers] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // ---------- 3) Učitavanje / čuvanje organizacija iz localStorage ----------
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
    // Učitaj odmah kad HomePage mounta
    loadOrganizations();
  }, [loadOrganizations]);

  useEffect(() => {
    // Svaki put kad se vratimo na "/", učitaj ponovno
    if (location.pathname === "/") {
      loadOrganizations();
    }
  }, [location.pathname, loadOrganizations]);

  useEffect(() => {
    // Spremi u localStorage kad god se organizacije promijene
    localStorage.setItem("organizations", JSON.stringify(organizations));
  }, [organizations]);

  // ---------- 4) Create + connect embedded wallet nakon Civic Auth ----------
  useEffect(() => {
    if (userContext.user && !embeddedIsConnected) {
      (async () => {
        if (!userHasWallet(userContext) && "createWallet" in userContext) {
          try {
            // @ts-ignore
            await (userContext as any).createWallet();
          } catch {
            // Ako wallet već postoji, ignoriramo
          }
        }
        try {
          await connect({ connector: connectors[0] });
        } catch (e) {
          console.error("Auto‐connect failed:", e);
        }
      })();
    }
  }, [userContext.user, embeddedIsConnected, connect, connectors]);

  // ---------- 5) Sign Out (diskonekcija + Civic signOut) ----------
  const handleSignOut = async () => {
    if (embeddedIsConnected) {
      disconnect();
    }
    await userContext.signOut();
  };

  // ---------- 6) Funkcije za formu organizacija ----------
  const openForm = () => {
    setOrgName("");
    setMemberInput("");
    setMembers([]);
    setShowForm(true);
  };
  const closeForm = () => setShowForm(false);
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
  const handleOrgClick = (name: string) => navigate(`/${encodeURIComponent(name)}`);

  // ---------- 7) Debug log (opciono) ----------
  useEffect(() => {
    console.log("Civic userContext.user =", userContext.user);
    console.log("Wagmi embeddedIsConnected =", embeddedIsConnected);
    console.log("Wagmi embeddedAddress =", embeddedAddress);
  }, [userContext.user, embeddedIsConnected, embeddedAddress]);

  // ---------- 8) Render ----------
  return (
    <div className="home-container">
      {/* ------ 8.1) Header / Wallet status ------ */}
      <header className="wallet-status">
        {!userContext.user && <UserButton />}
        {userContext.user && !embeddedIsConnected && (
          <span className="connecting">Connecting…</span>
        )}
        {embeddedIsConnected && embeddedAddress && (
          <div className="wallet-info">
            <span className="wallet-address">{embeddedAddress}</span>
            {balanceResult.data && (
              <span className="wallet-balance">
                {parseFloat(balanceResult.data.formatted).toFixed(4)}{" "}
                {balanceResult.data.symbol}
              </span>
            )}
            <button className="btn-signout" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        )}
      </header>

      {/* ---------- 8.2) Hero / Intro sekcija sa laganim animiranim background‐om ---------- */}
      <section className="hero-section">
        <div className="hero-overlay" />
        <div className="hero-waves">
          <svg
            className="wave wave1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 240"
          >
            <path
              fill="rgba(255,255,255,0.15)"
              d="M0,192L48,202.7C96,213,192,235,288,234.7C384,235,480,213,576,197.3C672,181,768,171,864,181.3C960,192,1056,224,1152,240C1248,256,1344,256,1392,256L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            ></path>
          </svg>
          <svg
            className="wave wave2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 240"
          >
            <path
              fill="rgba(255,255,255,0.10)"
              d="M0,128L48,133.3C96,139,192,149,288,149.3C384,149,480,139,576,122.7C672,107,768,85,864,96C960,107,1056,149,1152,165.3C1248,181,1344,171,1392,165.3L1440,160L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            ></path>
          </svg>
          <svg
            className="wave wave3"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 240"
          >
            <path
              fill="rgba(255,255,255,0.05)"
              d="M0,64L48,74.7C96,85,192,107,288,122.7C384,139,480,149,576,128C672,107,768,53,864,42.7C960,32,1056,64,1152,101.3C1248,139,1344,181,1392,202.7L1440,224L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            ></path>
          </svg>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">Welcome to MPC Dashboard</h1>
          <p className="hero-subtitle">
            Manage your multi‐party organizations and collect signatures seamlessly.
          </p>
          <button className="hero-cta" onClick={openForm}>
            + Create Organization
          </button>
        </div>
      </section>

      {/* ---------- 8.3) Centrirani sadržaj (lista organizacija) ---------- */}
      <main className="content-wrapper">
        <div className="organizations-header">
          <h2>Organizations</h2>
          <button className="small-create-btn" onClick={openForm}>
            + New Org
          </button>
        </div>

        <div className="organizations-list">
          {organizations.length === 0 ? (
            <p className="org-placeholder">No organizations yet</p>
          ) : (
            organizations.map((org, idx) => (
              <div
                key={idx}
                className="org-card"
                onClick={() => handleOrgClick(org.name)}
              >
                <span className="org-name">{org.name}</span>
              </div>
            ))
          )}
        </div>
      </main>

      {/* ---------- 8.4) Modal za kreiranje nove organizacije ---------- */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">New Organization</h2>

            <label className="modal-label">
              Organization Name
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="modal-input"
                placeholder="Enter org name"
              />
            </label>

            <label className="modal-label">
              Add Members
              <div className="modal-add-member">
                <input
                  type="text"
                  value={memberInput}
                  onChange={(e) => setMemberInput(e.target.value)}
                  placeholder="Member address"
                  className="modal-input"
                />
                <button onClick={addMember} className="modal-add-btn">
                  Add
                </button>
              </div>
            </label>

            {members.length > 0 && (
              <ul className="modal-members-list">
                {members.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            )}

            <div className="modal-actions">
              <button className="modal-btn-cancel" onClick={closeForm}>
                Cancel
              </button>
              <button className="modal-btn-save" onClick={submitOrganization}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
