import { contractAdds } from "@/lib/contractAdds";
import { ethers } from "ethers";
import { NextResponse } from "next/server";
import abi from "@/lib/abis/minting";

export async function POST(req: any) {
    try {
        const formdata = await req.formData();
        const placeId = await formdata.get('placeId');
        const uri = await formdata.get('uri');
        const address = await formdata.get('address');

        console.log("Inputs:", { placeId, uri, address });

        if (!placeId || !uri || !address) {
            return NextResponse.json(
                { error: "Important information not provided." },
                { status: 404 }
            );
        }

        // Create custom network configuration for Flow
        const customNetwork = {
            name: 'Flow Mainnet',
            chainId: 1, // Replace with actual Flow chainId
            ensAddress: null,
            _defaultProvider: null
        };

        // Initialize provider with network configuration
        const provider = new ethers.providers.JsonRpcProvider(
            "https://flow-mainnet.g.alchemy.com/v2/CA4eh0FjTxMenSW3QxTpJ7D-vWMSHVjq"
        );

        // Verify network connection
        try {
            await provider.getNetwork();
        } catch (error) {
            console.error("Network connection failed:", error);
            return NextResponse.json(
                { error: "Failed to connect to Flow network" },
                { status: 503 }
            );
        }

        // Create wallet
        const privateKey = process.env.ADMIN_PVT_KEY;
        if (!privateKey) {
            throw new Error("Private key not found in environment variables");
        }

        // Create wallet and connect to provider
        const wallet = new ethers.Wallet(privateKey, provider);

        // Create contract instance
        const contract = new ethers.Contract(
            contractAdds.minting,
            abi,
            wallet
        );

        // Get the current gas price with retry mechanism
        const getGasPrice = async (retries = 3): Promise<ethers.BigNumber> => {
            try {
                const gasPrice = await provider.getGasPrice();
                return gasPrice;
            } catch (error) {
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return getGasPrice(retries - 1);
                }
                throw new Error("Failed to fetch gas price after multiple attempts");
            }
        };

        const gasPrice = await getGasPrice();
        
        // Estimate gas for the transaction with retry mechanism
        const estimateGas = async (retries = 3): Promise<ethers.BigNumber> => {
            try {
                return await contract.estimateGas.safeMint(
                    uri, 
                    placeId, 
                    address
                );
            } catch (error) {
                if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    return estimateGas(retries - 1);
                }
                throw new Error("Failed to estimate gas after multiple attempts");
            }
        };

        const gasEstimate = await estimateGas();

        // Prepare transaction with gas parameters
        const tx = await contract.safeMint(
            uri, 
            placeId, 
            address,
            {
                gasLimit: gasEstimate.mul(120).div(100), // Add 20% buffer
                gasPrice: gasPrice
            }
        );

        console.log("Transaction sent:", tx.hash);

        // Wait for transaction confirmation with timeout
        const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Transaction confirmation timeout")), 60000)
            )
        ]);

        console.log("Transaction confirmed:", receipt);

        return NextResponse.json(
            { 
                txn: tx.hash, 
                receipt,
                gasUsed: receipt.gasUsed.toString(),
                blockNumber: receipt.blockNumber
            },
            { status: 200 }
        );

    } catch (err: any) {
        console.error("Error details:", err);
        
        // Enhanced error handling
        const errorResponse = {
            message: err.message || "Unknown error occurred",
            code: err.code,
            details: err.error
        };

        // Specific error cases
        switch (err.code) {
            case 'INSUFFICIENT_FUNDS':
                return NextResponse.json(
                    { ...errorResponse, error: "Insufficient funds for transaction" },
                    { status: 400 }
                );
            case 'UNPREDICTABLE_GAS_LIMIT':
                return NextResponse.json(
                    { ...errorResponse, error: "Unable to estimate gas limit. The transaction might fail." },
                    { status: 400 }
                );
            case 'NETWORK_ERROR':
                return NextResponse.json(
                    { ...errorResponse, error: "Network connection error. Please check your network configuration." },
                    { status: 503 }
                );
            default:
                // Check if the error is from the RPC
                if (err.error && err.error.code === -32000) {
                    return NextResponse.json(
                        { 
                            ...errorResponse,
                            error: "Transaction failed at RPC level. This might be due to incorrect parameters or network congestion.",
                            details: err.error.message
                        },
                        { status: 400 }
                    );
                }

                return NextResponse.json(
                    errorResponse,
                    { status: 500 }
                );
        }
    }
}