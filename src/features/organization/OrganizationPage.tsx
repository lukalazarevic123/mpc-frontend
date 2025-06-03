import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

interface Organization {
  name: string;
  members: string[];
}

export function OrganizationPage() {
  const { orgName } = useParams<{ orgName: string }>();
  const navigate = useNavigate();

  const [account, setAccount] = useState<string | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [signatures, setSignatures] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            setAccount(accounts[0]);
          }
        })
        .finally(() => {
          loadOrgAndSignatures();
        });

      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setAccount(accounts.length > 0 ? accounts[0] : null);
      });
    } else {
      loadOrgAndSignatures();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgName]);

  const loadOrgAndSignatures = () => {
    if (!orgName) {
      setLoading(false);
      return;
    }

    const storedOrgs = localStorage.getItem("organizations");
    if (storedOrgs) {
      try {
        const parsed: Organization[] = JSON.parse(storedOrgs);
        const found = parsed.find(
          (o) => o.name === decodeURIComponent(orgName)
        );
        setOrg(found || null);
      } catch {
        setOrg(null);
      }
    }

    const key = `signatures_${decodeURIComponent(orgName)}`;
    const storedSigs = localStorage.getItem(key);
    if (storedSigs) {
      try {
        setSignatures(JSON.parse(storedSigs));
      } catch {
        setSignatures([]);
      }
    } else {
      setSignatures([]);
    }

    setLoading(false);
  };

  const goBack = () => {
    navigate("/");
  };

  const handleSign = () => {
    if (!account || !org) return;

    const normalized = account.toLowerCase();
    if (!signatures.map((s) => s.toLowerCase()).includes(normalized)) {
      const updated = [...signatures, account];
      setSignatures(updated);
      localStorage.setItem(
        `signatures_${org.name}`,
        JSON.stringify(updated)
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: "40px 20px",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "1.25rem",
          color: "#6b7280",
        }}
      >
        Učitavanje...
      </div>
    );
  }

  if (!org) {
    return (
      <div
        style={{
          padding: "40px 20px",
          minHeight: "100vh",
          backgroundColor: "#f3f4f6",
        }}
      >
        <button
          onClick={goBack}
          style={{
            backgroundColor: "#4f46e5",
            color: "#ffffff",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "20px",
          }}
        >
          ← Nazad
        </button>
        <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>
          Nepoznata organizacija
        </h1>
        <p style={{ color: "#6b7280" }}>
          Organizacija "{decodeURIComponent(orgName || "")}" nije pronađena.
        </p>
      </div>
    );
  }

  const totalMembers = org.members.length + 1; // +1 za kreatora
  const signedCount = signatures.length;
  const percent = Math.floor((signedCount / totalMembers) * 100);

  return (
    <div
      style={{
        padding: "40px 20px",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
      }}
    >
      <button
        onClick={goBack}
        style={{
          backgroundColor: "#4f46e5",
          color: "#ffffff",
          border: "none",
          padding: "8px 16px",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px",
        }}
      >
        ← Nazad
      </button>

      <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>
        {org.name}
      </h1>

      <h2 style={{ fontSize: "1.25rem", marginBottom: "12px" }}>Članovi:</h2>
      {org.members.length === 0 ? (
        <p style={{ color: "#6b7280" }}>
          Ova organizacija trenutno nema dodatnih članova.
        </p>
      ) : (
        <ul style={{ paddingLeft: "20px", listStyle: "disc inside" }}>
          {org.members.map((member, idx) => (
            <li key={idx} style={{ marginBottom: "8px" }}>
              {member}
            </li>
          ))}
        </ul>
      )}

      <div style={{ margin: "20px 0" }}>
        <div
          style={{
            backgroundColor: "#e5e7eb",
            borderRadius: "4px",
            overflow: "hidden",
            height: "20px",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              backgroundColor: "#4f46e5",
              height: "100%",
            }}
          />
        </div>
        <p style={{ marginTop: "8px", color: "#1f2937" }}>
          {percent}% potpisali ({signedCount}/{totalMembers})
        </p>
      </div>

      {account && !signatures
        .map((s) => s.toLowerCase())
        .includes(account.toLowerCase()) && (
        <button
          onClick={handleSign}
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
          Sign
        </button>
      )}
    </div>
  );
}
