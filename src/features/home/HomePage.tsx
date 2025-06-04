// HomePage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserButton, useUser } from "@civic/auth-web3/react";
import { userHasWallet } from "@civic/auth-web3";
import { useAccount, useConnect, useBalance, useDisconnect } from "wagmi";
import "./HomePage.css";

// Uvezi logo (pretpostavljamo da se nalazi u src/assets/logo.png)
import logo from "../../assets/CurvyMPC.png";
import { toast } from "sonner";

interface Organization {
  name: string;
  members: string[];
}

export function HomePage() {
  // ---------- 1) Civic Auth + Embedded Wallet Hooks ----------
  const userContext = useUser();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address: embeddedAddress, isConnected: embeddedIsConnected } =
    useAccount();
  const balanceResult = useBalance({
    address: embeddedIsConnected ? embeddedAddress : undefined,
  });

  // ---------- 2) Stealth adrese za animaciju u Hero ----------
  const stealthAddresses = [
    "0xAaBbCcDdEeFf0011223344556677889900AaBbCc",
    "0x11223344556677889900AaBbCcDdEeFf00112233",
    "0x1234567890abcdef1234567890abcdef12345678",
    "0xDeadBeefDeadBeefDeadBeefDeadBeefDeadBeef",
    "0xFeedFaceFeedFaceFeedFaceFeedFaceFeedFace",
  ];

  // ---------- 3) State za organizacije ----------
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [orgName, setOrgName] = useState<string>("");
  const [memberInput, setMemberInput] = useState<string>("");
  const [members, setMembers] = useState<string[]>([]);
  const navigate = useNavigate();

  const acceptInvitation = (organizationName: string) => {
    console.log(`Invitation accepted for organization: ${organizationName}`);

    fetchOrganizations();
  };

  const fetchOrganizations = async () => {
    if (!embeddedAddress) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_BACKEND}/organizations/${embeddedAddress}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (!data) {
          setOrganizations([]);
          return;
        }

        setOrganizations(data);
      } else {
        console.error("Failed to fetch organizations");
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [embeddedAddress]);

  useEffect(() => {
    if (!embeddedAddress) return;

    // Use a dedicated env for WebSocket URL or fallback to VITE_APP_BACKEND
    const wsUrl = `${
      import.meta.env.VITE_APP_BACKEND_WS
    }/ws/${embeddedAddress}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connection opened at", wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Assuming the backend sends an object with an OrganizationName and Message properties.
        if (data.organization_name && data.message) {
          toast.custom(
            (toastId) => (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.5rem 1rem",
                  border: "1px solid #a24eea",
                  borderRadius: "15px"
                }}
              >
                <span>{data.message}</span>
                <button
                className="btn-signout"
                  onClick={() => {
                    acceptInvitation(data.organization_name);
                    toast.dismiss(toastId)
                  }}
                >
                  Accept Invitation
                </button>
              </div>
            ),
            { duration: 10000, dismissible: true }
          );
        } else {
          console.log("WebSocket message received:", data);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    // Clean up the connection when the component unmounts or embeddedAddress changes
    return () => {
      ws.close();
    };
  }, [embeddedAddress]);

  // ---------- 5) Create + connect embedded wallet nakon Civic Auth ----------
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

  // ---------- 6) Sign Out ----------
  const handleSignOut = async () => {
    if (embeddedIsConnected) {
      disconnect();
    }
    await userContext.signOut();
  };

  // ---------- 7) Funkcije za formu organizacija ----------
  const openForm = () => {
    setOrgName("");
    setMemberInput("");
    setMembers(embeddedAddress ? [embeddedAddress] : []);
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

  const submitOrganization = async () => {
    const nameTrimmed = orgName.trim();
    if (!nameTrimmed) {
      toast.error("Something went wrong");
      return;
    }

    const formattedMembers = members.map((address) => ({ address }));

    const createOrgReq = {
      name: nameTrimmed,
      threshold: formattedMembers.length,
      participants: formattedMembers,
    };

    const req = await fetch(
      `${import.meta.env.VITE_APP_BACKEND}/organizations`,
      {
        method: "POST",
        body: JSON.stringify(createOrgReq),
      }
    );

    if (req.ok) {
      closeForm();
    }
  };

  const handleOrgClick = (name: string) =>
    navigate(`/${encodeURIComponent(name)}`);

  // ---------- 8) Debug log (opciono) ----------
  useEffect(() => {
    console.log("Civic userContext.user =", userContext.user);
    console.log("Wagmi embeddedIsConnected =", embeddedIsConnected);
    console.log("Wagmi embeddedAddress =", embeddedAddress);
  }, [userContext.user, embeddedIsConnected, embeddedAddress]);

  // ---------- 9) Render ----------
  return (
    <div className="home-container">
      {/* 9.1) Header / Wallet status */}
      <header className="wallet-status">
        {/* Logo u gornjem lijevom kutu */}
        <img src={logo} alt="Logo" className="logo" />

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

      {/* 9.2) Hero / Intro sekcija sa animiranim stealth adresama */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Welcome to MPC Dashboard</h1>
          <p className="hero-subtitle">
            Manage your multi‐party organizations and collect signatures
            seamlessly.
          </p>
          <button className="hero-cta" onClick={openForm}>
            + Create Organization
          </button>
        </div>

        {/* Animirane stealth adrese */}
        {stealthAddresses.map((addr, idx) => {
          const topPos = `${10 + Math.random() * 60}%`;
          const delay = `${(Math.random() * 8).toFixed(2)}s`;
          return (
            <span
              key={addr + idx}
              className="stealth-item"
              style={
                {
                  "--top": topPos,
                  "--delay": delay,
                } as React.CSSProperties
              }
            >
              {addr}
            </span>
          );
        })}
      </section>

      {/* 9.3) Centrirani sadržaj (lista organizacija) */}
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

      {/* 9.4) Modal za kreiranje nove organizacije */}
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
