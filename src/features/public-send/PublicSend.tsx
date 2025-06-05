import { userHasWallet } from "@civic/auth-web3";
import { UserButton, useUser } from "@civic/auth-web3/react";
import { parseEther } from "ethers";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAccount, useBalance, useConnect, useDisconnect, useSendTransaction } from "wagmi";

export function PublicSend() {
  const [sendTo, setSendTo] = useState<string>("");
  const [sendToHandle, setSendToHandle] = useState<string>("");
  const [sendAmount, setSendAmount] = useState<string>("");
  const [sendToken, setSendToken] = useState<string>("ETH");
  const [sendNetwork, setSendNetwork] = useState<string>("Ethereum");

  const { address: accountRaw } = useAccount();
  const { sendTransactionAsync } = useSendTransaction()

  const handleRequestSend = async () => {
    if (!accountRaw) {
        alert("No sender account connected.");
        return;
    }
    if (!sendTo) {
        alert("Please enter a recipient address.");
        return;
    }
    if (!sendAmount || isNaN(Number(sendAmount))) {
        alert("Please enter a valid amount.");
        return;
    }

    try {
        const tx = await sendTransactionAsync({
            to: sendTo,
            value: parseEther(sendAmount)
        }) 

        toast.success(`Transaction sent! Hash: ${tx}`);
    } catch (error: any) {
        toast.error(`Transaction failed: ${error?.message || error}`);
    }
  };

  useEffect(() => {}, [accountRaw]);

  const { address: embeddedAddress, isConnected: embeddedIsConnected } =
    useAccount();
  const balanceResult = useBalance({
    address: embeddedIsConnected ? embeddedAddress : undefined,
  });
  const userContext = useUser();

  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleSignOut = async () => {
    if (embeddedIsConnected) {
      disconnect();
    }
    await userContext.signOut();
  };

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

  return (
    <>
      <div
        style={{
          display: "flex",
          paddingTop: "1rem",
          paddingRight: "1rem",
        }}
      >
        <div
          style={{
            marginLeft: "auto",
          }}
        >
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
        </div>
      </div>
      <div
        style={{
          display: "flex",
        }}
      >
        <div
          style={{
            margin: "auto",
            marginTop: "10rem",
            padding: "20px",
            border: "1px solid #cbd2d8",
            borderRadius: "8px",
            backgroundColor: "#edeff2",
            width: "35vw",
          }}
        >
          <h3 style={{ marginBottom: "12px" }}>Sending from {accountRaw}</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <label style={{ fontWeight: 500 }}>Reciever handle:</label>
            <div style={{ display: "flex" }}>
              <input
                type="text"
                placeholder="curvy.name"
                value={sendToHandle}
                onChange={(e) => setSendToHandle(e.target.value)}
                style={{
                  padding: "10px 14px",
                  marginRight: "20px",
                  border: "1px solid #cbd2d8",
                  borderRadius: "6px",
                  fontSize: "1rem",
                }}
              />

              <button className="btn-signout" onClick={() => setSendTo("0x1617C22D68C7f2E2ABC433f7ba4F67C952905989")}>Generate</button>
            </div>

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
              placeholder="e.g. 0.1"
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
      </div>
    </>
  );
}
