// App.tsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider,
  createConfig,
  useAccount,
  useConnect,
  useBalance,
  http,
} from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { embeddedWallet } from "@civic/auth-web3/wagmi";
import { CivicAuthProvider, UserButton, useUser } from "@civic/auth-web3/react";

import { HomePage } from "./features/home/HomePage";
import { OrganizationPage } from "./features/organization/OrganizationPage";

const queryClient = new QueryClient();

// Konfigurišemo Wagmi za Embedded Wallet iz Civic Auth Web3 SDK-a
const wagmiConfig = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  connectors: [embeddedWallet()],
});

export default function App() {
  // Obavezno zamenite ovo sa vašim stvarnim Civic Auth Client ID-jem iz Civic kontrolne table.
  const civicClientId = "892aa2db-eb75-4c70-afbc-53ac26def3f3";

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <CivicAuthProvider clientId={civicClientId}>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/:orgName" element={<OrganizationPage />} />
            </Routes>
          </Router>
        </CivicAuthProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
