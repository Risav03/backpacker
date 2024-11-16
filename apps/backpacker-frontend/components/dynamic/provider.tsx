'use client'
import {
    DynamicContextProvider,
    DynamicWidget,
  } from "@dynamic-labs/sdk-react-core";
  import { DynamicWagmiConnector } from "@dynamic-labs/wagmi-connector";
  import {
    createConfig,
    WagmiProvider,
  } from 'wagmi';
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
  import { http } from 'viem';
  import { mainnet } from 'viem/chains';
  
  import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
  import { FlowWalletConnectors } from "@dynamic-labs/flow";
  
  const config = createConfig({
    chains: [mainnet],
    multiInjectedProviderDiscovery: false,
    transports: {
      [mainnet.id]: http(),
    },
  });
    
  const queryClient = new QueryClient();

const DynamicProvider = ({children}: { children:React.ReactNode }) => {
  return (
    <DynamicContextProvider
        settings={{
            environmentId: "c3ea1f51-58ba-4011-8038-13610169c724",
            
            walletConnectors: [
            EthereumWalletConnectors,
            FlowWalletConnectors
            ],
        }}
    >
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <DynamicWagmiConnector>
                  <DynamicWidget />
                  {children}
                </DynamicWagmiConnector>
            </QueryClientProvider>
        </WagmiProvider> 
  </DynamicContextProvider>
  )
}

export default DynamicProvider