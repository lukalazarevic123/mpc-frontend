// App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider,
  createConfig,
  http,
} from "wagmi";
import { mainnet } from "wagmi/chains";
import { embeddedWallet } from "@civic/auth-web3/wagmi";
import { CivicAuthProvider } from "@civic/auth-web3/react";

import { HomePage } from "./features/home/HomePage";
import { OrganizationPage } from "./features/organization/OrganizationPage";
import { PublicSend } from "./features/public-send/PublicSend";

const queryClient = new QueryClient();

// Konfigurišemo Wagmi za Embedded Wallet iz Civic Auth Web3 SDK-a
const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  connectors: [embeddedWallet()],
});

export default function App() {
  const civicClientId = "2887c97b-75fe-439a-9add-b554c01c1750";

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId={civicClientId} chains={[mainnet]} initialChain={mainnet} >
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/organization/:orgName" element={<OrganizationPage />} />
              <Route path="/send" element={<PublicSend />} />
            </Routes>
          </Router>
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
