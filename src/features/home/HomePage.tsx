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

  // ---------- 4) Kada se korisnik prijavi u Civic Auth, odmah kreiramo i povežemo embedded wallet ----------
  useEffect(() => {
    if (userContext.user && !embeddedIsConnected) {
      (async () => {
        // 4.1) Ako korisnik nema embedded wallet, kreiramo ga
        if (!userHasWallet(userContext) && "createWallet" in userContext) {
          try {
            // @ts-ignore
            await (userContext as any).createWallet();
          } catch {
            // Ako createWallet baci grešku (wallet već postoji), ignorisemo i nastavljamo
          }
        }
        // 4.2) Wagmi connect
        try {
          await connect({ connector: connectors[0] });
        } catch (e) {
          console.error("Auto‐connect failed:", e);
        }
      })();
    }
  }, [userContext.user, embeddedIsConnected, connect, connectors]);

  // ---------- 5) Dugme za Sign Out (diskonektuje wallet i odjavljuje Civic Auth) ----------
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

  // ---------- 7) Debug log (opciono) ----------
  useEffect(() => {
    console.log("Civic userContext.user =", userContext.user);
    console.log("Wagmi embeddedIsConnected =", embeddedIsConnected);
    console.log("Wagmi embeddedAddress =", embeddedAddress);
  }, [userContext.user, embeddedIsConnected, embeddedAddress]);

  // ---------- 8) Render ----------
  return (
    <div className="home-container">
      {/* ------ 8.1) Sekcija za wallet-status ------ */}
      <div className="wallet-status">
        {/* Ako NIJE Civic Auth, prikazujemo UserButton */}
        {!userContext.user && <UserButton />}

        {/* 
          Ako jeste Civic Auth (userContext.user) ali embedded wallet NIJE povezan,
          prikazujemo poruku “Connecting…” dok se auto‐connect završava
        */}
        {userContext.user && !embeddedIsConnected && (
          <span style={{ fontStyle: "italic", color: "#6b7280" }}>
            Connecting…
          </span>
        )}

        {/* Kada je embedded wallet povezan, prikazujemo adresu, balans i dugme Sign Out */}
        {embeddedIsConnected && embeddedAddress && (
          <div
            className="wallet-info"
            style={{ display: "flex", alignItems: "center" }}
          >
            {/* Prikaz adrese */}
            <span
              className="wallet-address"
              style={{
                fontFamily: "monospace",
                backgroundColor: "#eef2ff",
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #4f46e5",
              }}
            >
              {embeddedAddress}
            </span>

            {/* Prikaz balansa */}
            {balanceResult.data && (
              <span
                style={{
                  marginLeft: "12px",
                  fontSize: "0.9rem",
                  color: "#6b7280",
                }}
              >
                {parseFloat(balanceResult.data.formatted).toFixed(4)}{" "}
                {balanceResult.data.symbol}
              </span>
            )}

            {/* Dugme Sign Out */}
            <button
              onClick={handleSignOut}
              style={{
                marginLeft: "12px",
                backgroundColor: "#718096",
                color: "#ffffff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <h1 className="page-title">Home Page</h1>

      {/* ------ 8.2) Sekcija za organizacije ------ */}
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
                style={{
                  padding: "8px 12px",
                  margin: "4px 0",
                  borderRadius: "4px",
                  backgroundColor: "#f3f4f6",
                  cursor: "pointer",
                }}
              >
                {org.name}
              </div>
            ))
          )}
        </div>
        <button
          className="create-button"
          onClick={openForm}
          style={{
            marginTop: "16px",
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Create Your Organization
        </button>
      </section>

      {/* ------ 8.3) Modal za kreiranje nove organizacije ------ */}
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
            <h2 style={{ marginBottom: "16px" }}>New Organization</h2>
            <label style={{ display: "block", marginBottom: "8px" }}>
              Organization Name
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
              Add Members
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
