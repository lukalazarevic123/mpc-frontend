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
  // 1) hooks za Civic Auth + Wagmi
  const userContext = useUser();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address: embeddedAddress, isConnected: embeddedIsConnected } = useAccount();
  const balanceResult = useBalance({
    address: embeddedIsConnected ? embeddedAddress : undefined,
  });

  // 2) state za organizacije
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [orgName, setOrgName] = useState<string>("");
  const [memberInput, setMemberInput] = useState<string>("");
  const [members, setMembers] = useState<string[]>([]);

  const navigate = useNavigate();
  const location = useLocation();

  // 3) funkcija za učitavanje iz localStorage
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

  // 3.1) učitaj svaki put kad je ruta "/" ili kad se organizations menja
  //      na ovaj način, i prilikom vraćanja sa /orgName na "/", uvijek dohvatimo podatke
  useEffect(() => {
    if (location.pathname === "/") {
      loadOrganizations();
    }
  }, [location.pathname, loadOrganizations]);

  // 4) kada se korisnik prijavi preko Civic, auto‐connect embedded wallet
  useEffect(() => {
    if (userContext.user && !embeddedIsConnected) {
      (async () => {
        if (!userHasWallet(userContext) && "createWallet" in userContext) {
          try {
            // @ts-ignore
            await (userContext as any).createWallet();
          } catch {
            // ako već ima, ignor
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

  // 5) Sign Out
  const handleSignOut = async () => {
    if (embeddedIsConnected) {
      disconnect();
    }
    await userContext.signOut();
  };

  // 6) Funkcije za formu
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
        const updated = [...organizations, { name: nameTrimmed, members: [...members] }];
        setOrganizations(updated);
        localStorage.setItem("organizations", JSON.stringify(updated)); // spremimo odmah u localStorage
      }
      closeForm();
    }
  };
  const handleOrgClick = (name: string) => navigate(`/${encodeURIComponent(name)}`);

  // 7) debug (opciono)
  useEffect(() => {
    console.log("Civic userContext.user =", userContext.user);
    console.log("Wagmi embeddedIsConnected =", embeddedIsConnected);
    console.log("Wagmi embeddedAddress =", embeddedAddress);
  }, [userContext.user, embeddedIsConnected, embeddedAddress]);

  return (
    <div className="home-container">
      {/* 8.1) Header / Wallet status */}
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

      {/* 8.2) Hero / Intro sekcija */}
      <section className="hero-section">
        <div className="hero-overlay" />
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

      {/* 8.3) Centrirani sadržaj (lista organizacija) */}
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

      {/* 8.4) Modal za kreiranje nove organizacije */}
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
