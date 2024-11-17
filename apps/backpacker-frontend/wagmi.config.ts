import hardhatDeploy from "@sunodo/wagmi-plugin-hardhat-deploy";
import { defineConfig } from "@wagmi/cli";
import { react } from "@wagmi/cli/plugins";
import { erc20Abi, erc721Abi } from "viem";

export default defineConfig({
  out: "lib/hooks/generated.ts", // Specifies the output file for the hooks
  contracts: [
    {
      abi: erc20Abi,
      name: "erc20",
    },
    { abi: erc721Abi, name: "erc721" },
  ],
  plugins: [
    hardhatDeploy({
        directory: "node_modules/@cartesi/rollups/export/abi",
    }),
    react(),
],
});