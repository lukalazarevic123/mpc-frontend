// OrganizationPage.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccount, useBalance } from "wagmi";

interface Organization {
    name: string;
    members: `0x${string}`[]; // Članovi organizacije (bez inicijatora)
}

interface TxRequest {
    id: string;
    from: `0x${string}`;
    to: `0x${string}`;
    amount: string;
    token: string;
    network: string;
    initiator: `0x${string}`;
    signatures: `0x${string}`[]; // Koji su članovi potpisali
}

export function OrganizationPage() {
    const { orgName } = useParams<{ orgName: string }>();
    const navigate = useNavigate();

    // Wagmi račun i stanje konekcije
    const { address: accountRaw, isConnected } = useAccount();
    const account = accountRaw ? (accountRaw as `0x${string}`) : null;

    // Stanje organizacije i pending transakcija
    const [org, setOrg] = useState<Organization | null>(null);
    const [txRequests, setTxRequests] = useState<TxRequest[]>([]);

    // Za demo: hardkodirane stealth adrese
    const [stealthAddresses] = useState<`0x${string}`[]>([
        "0xAaBbCcDdEeFf0011223344556677889900AaBbCc" as `0x${string}`,
        "0x11223344556677889900AaBbCcDdEeFf00112233" as `0x${string}`,
        "0x1234567890abcdef1234567890abcdef12345678" as `0x${string}`,
    ]);

    // UI stanja
    const [loading, setLoading] = useState<boolean>(true);
    const [showAddresses, setShowAddresses] = useState<boolean>(false);
    const [sendingAddress, setSendingAddress] = useState<`0x${string}` | null>(null);

    // Polja forme za slanje
    const [sendTo, setSendTo] = useState<string>("");
    const [sendAmount, setSendAmount] = useState<string>("");
    const [sendToken, setSendToken] = useState<string>("ETH");
    const [sendNetwork, setSendNetwork] = useState<string>("Ethereum");

    // Učitaj organizaciju i postojeće pending transakcije iz localStorage
    useEffect(() => {
        if (!orgName) {
            setOrg(null);
            setLoading(false);
            return;
        }
        const decodedName = decodeURIComponent(orgName);

        // 1) Učitaj organizaciju iz localStorage
        const storedOrgs = localStorage.getItem("organizations");
        if (storedOrgs) {
            try {
                const parsedOrgs: Organization[] = JSON.parse(storedOrgs);
                const found = parsedOrgs.find((o) => o.name === decodedName);
                setOrg(found || null);
            } catch {
                setOrg(null);
            }
        } else {
            setOrg(null);
        }

        // 2) Učitaj pending transakcije za ovu organizaciju
        const txKey = `txRequests_${decodedName}`;
        const storedTx = localStorage.getItem(txKey);
        if (storedTx) {
            try {
                setTxRequests(JSON.parse(storedTx) as TxRequest[]);
            } catch {
                setTxRequests([]);
            }
        } else {
            setTxRequests([]);
        }

        setLoading(false);
    }, [orgName]);

    const goBack = () => {
        navigate("/");
    };

    // Kreiranje nove transakcije i čuvanje u localStorage
    const handleRequestSend = () => {
        if (!org || !account || !sendingAddress) return;

        const from = sendingAddress;
        const to = sendTo.trim() as `0x${string}`;
        const amount = sendAmount.trim();
        const token = sendToken;
        const network = sendNetwork;

        if (!to || !amount) {
            return; // Ne radi ako nema adrese ili iznosa
        }

        // Initiator odmah potpisuje
        const newReq: TxRequest = {
            id: Date.now().toString(),
            from,
            to,
            amount,
            token,
            network,
            initiator: account,
            signatures: [account],
        };

        const updated = [...txRequests, newReq];
        setTxRequests(updated);
        localStorage.setItem(`txRequests_${org.name}`, JSON.stringify(updated));

        // Reset forme i zatvori je
        setSendingAddress(null);
        setSendTo("");
        setSendAmount("");
        setSendToken("ETH");
        setSendNetwork("Ethereum");
    };

    // Dodavanje potpisa na transakciju
    const handleSignTx = (id: string) => {
        if (!account || !org) return;

        const updated = txRequests.map((req) => {
            if (req.id === id) {
                const normalized = account.toLowerCase() as `0x${string}`;
                if (!req.signatures.map((s) => s.toLowerCase()).includes(normalized)) {
                    return {
                        ...req,
                        signatures: [...req.signatures, account],
                    };
                }
            }
            return req;
        });
        setTxRequests(updated);
        localStorage.setItem(`txRequests_${org.name}`, JSON.stringify(updated));
    };

    if (loading) {
        return (
            <div
                style={{
                    padding: "40px 20px",
                    minHeight: "100vh",
                    background: "transparent",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    fontSize: "1.25rem",
                    color: "#64748b",
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
                    background: "transparent",
                }}
            >
                <button
                    onClick={goBack}
                    style={{
                        backgroundColor: "#5b4bdb",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        marginBottom: "20px",
                    }}
                >
                    ← Back
                </button>
                <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>
                    Nepoznata organizacija
                </h1>
                <p style={{ color: "#64748b" }}>
                    Organizacija "{decodeURIComponent(orgName || "")}" nije pronađena.
                </p>
            </div>
        );
    }

    // Ukupan broj članova (members + initiator)
    const totalMembers = org.members.length + 1;

    return (
        <div
            style={{
                padding: "40px 20px",
                minHeight: "100vh",
                background: "transparent",
            }}
        >
            <button
                onClick={goBack}
                style={{
                    backgroundColor: "#5b4bdb",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    marginBottom: "20px",
                }}
            >
                ← Back
            </button>

            <h1 style={{ fontSize: "2rem", marginBottom: "16px" }}>
                {org.name}
            </h1>

            <h2 style={{ fontSize: "1.25rem", marginBottom: "12px" }}>Members:</h2>
            {org.members.length === 0 ? (
                <p style={{ color: "#64748b" }}>
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

            {/* ---------- Sekcija stealth adresa ---------- */}
            <div style={{ marginTop: "32px" }}>
                <button
                    onClick={() => setShowAddresses((prev) => !prev)}
                    style={{
                        backgroundColor: "#5b4bdb",
                        color: "#ffffff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        cursor: "pointer",
                    }}
                >
                    {showAddresses ? "Hide Address" : "Show Address"}
                </button>

                {showAddresses && (
                    <div style={{ marginTop: "20px" }}>
                        {stealthAddresses.length === 0 ? (
                            <p style={{ color: "#64748b" }}>Nema stealth adresa.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                                {stealthAddresses.map((addr) => (
                                    <div
                                        key={addr}
                                        style={{
                                            padding: "16px",
                                            border: "1px solid #cbd2d8",
                                            borderRadius: "8px",
                                            backgroundColor: "#f9fafb",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                        }}
                                    >
                                        <span style={{ fontFamily: "monospace" }}>{addr}</span>
                                        <span style={{ color: "#1e293b", fontWeight: 500 }}>
                                            <BalanceDisplay address={addr} />
                                        </span>
                                        <button
                                            onClick={() =>
                                                setSendingAddress((prev) => (prev === addr ? null : addr))
                                            }
                                            style={{
                                                backgroundColor: "#a24eea",
                                                color: "#ffffff",
                                                border: "none",
                                                padding: "6px 14px",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Send
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Forma slanja nakon klika na adresu */}
                        {sendingAddress && (
                            <div
                                style={{
                                    marginTop: "20px",
                                    padding: "20px",
                                    border: "1px solid #cbd2d8",
                                    borderRadius: "8px",
                                    backgroundColor: "#edeff2",
                                    maxWidth: "500px",
                                }}
                            >
                                <h3 style={{ marginBottom: "12px" }}>
                                    Sending from {sendingAddress}
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    <label style={{ fontWeight: 500 }}>Reciever address:</label>
                                    <input
                                        type="text"
                                        placeholder="0x..."
                                        value={sendTo}
                                        onChange={(e) => setSendTo(e.target.value)}
                                        style={{
                                            padding: "10px 14px",
                                            border: "1px solid #cbd2d8",
                                            borderRadius: "6px",
                                            fontSize: "1rem",
                                        }}
                                    />

                                    <label style={{ fontWeight: 500 }}>Amount:</label>
                                    <input
                                        type="text"
                                        placeholder="npr. 0.1"
                                        value={sendAmount}
                                        onChange={(e) => setSendAmount(e.target.value)}
                                        style={{
                                            padding: "10px 14px",
                                            border: "1px solid #cbd2d8",
                                            borderRadius: "6px",
                                            fontSize: "1rem",
                                        }}
                                    />

                                    <label style={{ fontWeight: 500 }}>Token:</label>
                                    <select
                                        value={sendToken}
                                        onChange={(e) => setSendToken(e.target.value)}
                                        style={{
                                            padding: "10px 14px",
                                            border: "1px solid #cbd2d8",
                                            borderRadius: "6px",
                                            fontSize: "1rem",
                                        }}
                                    >
                                        <option value="ETH">ETH</option>
                                        <option value="USDT">USDT</option>
                                        <option value="DOT">DOT</option>
                                    </select>

                                    <label style={{ fontWeight: 500 }}>Network:</label>
                                    <select
                                        value={sendNetwork}
                                        onChange={(e) => setSendNetwork(e.target.value)}
                                        style={{
                                            padding: "10px 14px",
                                            border: "1px solid #cbd2d8",
                                            borderRadius: "6px",
                                            fontSize: "1rem",
                                        }}
                                    >
                                        <option value="Ethereum">Ethereum</option>
                                        <option value="Polygon">Polygon</option>
                                        <option value="BSC">BSC</option>
                                    </select>

                                    <button
                                        onClick={handleRequestSend}
                                        style={{
                                            marginTop: "12px",
                                            backgroundColor: "#5b4bdb",
                                            color: "#ffffff",
                                            border: "none",
                                            padding: "10px 20px",
                                            borderRadius: "6px",
                                            cursor: "pointer",
                                            alignSelf: "flex-start",
                                        }}
                                    >
                                        Send Request
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ---------- Pending transakcije ---------- */}
            <div style={{ marginTop: "40px" }}>
                <h2 style={{ fontSize: "1.25rem", marginBottom: "12px" }}>
                    Transaction pending:
                </h2>
                {txRequests.length === 0 ? (
                    <p style={{ color: "#64748b" }}>N/A</p>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {txRequests.map((req) => {
                            const signedCount = req.signatures.length;
                            const percent = Math.floor((signedCount / totalMembers) * 100);
                            const alreadySigned = account
                                ? req.signatures
                                    .map((s) => s.toLowerCase())
                                    .includes(account.toLowerCase())
                                : false;

                            return (
                                <div
                                    key={req.id}
                                    style={{
                                        padding: "20px",
                                        border: "1px solid #cbd2d8",
                                        borderRadius: "8px",
                                        backgroundColor: "#edeff2",
                                    }}
                                >
                                    <p>
                                        <strong>From:</strong> {req.from}
                                    </p>
                                    <p>
                                        <strong>To:</strong> {req.to}
                                    </p>
                                    <p>
                                        <strong>Amount:</strong> {req.amount} {req.token}
                                    </p>
                                    <p>
                                        <strong>Network:</strong> {req.network}
                                    </p>
                                    <p>
                                        <strong>Initiator:</strong> {req.initiator}
                                    </p>

                                    {/* Progress bar */}
                                    <div style={{ margin: "12px 0" }}>
                                        <div
                                            style={{
                                                backgroundColor: "#e5e7eb",
                                                borderRadius: "4px",
                                                overflow: "hidden",
                                                height: "16px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${percent}%`,
                                                    backgroundColor: "#5b4bdb",
                                                    height: "100%",
                                                }}
                                            />
                                        </div>
                                        <p style={{ marginTop: "8px", color: "#1e293b" }}>
                                            {percent}% potpisano ({signedCount}/{totalMembers})
                                        </p>
                                    </div>

                                    {!alreadySigned && isConnected && account && (
                                        <button
                                            onClick={() => handleSignTx(req.id)}
                                            style={{
                                                marginTop: "12px",
                                                backgroundColor: "#5b4bdb",
                                                color: "#ffffff",
                                                border: "none",
                                                padding: "8px 16px",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Sign This Tx
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// Pomoćna komponenta za prikaz balansa
function BalanceDisplay({ address }: { address: `0x${string}` }) {
    const balance = useBalance({ address });

    if (!balance.data) {
        return <span>Loading...</span>;
    }

    return (
        <span>
            {parseFloat(balance.data.formatted).toFixed(4)} {balance.data.symbol}
        </span>
    );
}

