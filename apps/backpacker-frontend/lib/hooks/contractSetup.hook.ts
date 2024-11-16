'use client'
import { ethers } from "ethers"  // Fix 1: Correct import syntax

export const useContractSetup = async ({address, abi}:{address:string, abi:any}) => {
    try {
        // Fix 2: No need to check window.ethereum since we're using a direct provider
        if (typeof window.ethereum !== 'undefined'){

            const provider = new ethers.providers.Web3Provider(window?.ethereum);
            
            // Fix 3: Add error handling for private key
            const privateKey = process.env.NEXT_PUBLIC_PVT;
            if (!privateKey) {
                throw new Error("Private key not found in environment variables");
            }
    
            // Fix 4: Create wallet and connect to provider
            const wallet = new ethers.Wallet(privateKey, provider);
            // Remove unnecessary .connect() since wallet is already connected to provider
    
            // Fix 5: Create contract instance
            const contract = new ethers.Contract(
                address,
                abi,
                wallet  // Use wallet directly as it's already connected to provider
            );
    
            // Fix 6: Explicitly return the contract
            return contract;
        }
    }
    catch (err) {
        console.error("Contract setup failed:", err);
        throw err; // Re-throw the error to handle it in the calling code
    }
}

// Example usage:
/*
const getContract = async () => {
    try {
        const contract = await useContractSetup({
            address: "YOUR_CONTRACT_ADDRESS",
            abi: YOUR_CONTRACT_ABI
        });
        
        // Now you can use the contract
        const result = await contract.someMethod();
    } catch (error) {
        console.error("Failed to setup contract:", error);
    }
}
*/