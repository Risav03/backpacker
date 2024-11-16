import { contractAdds } from "@/lib/contractAdds";
import { ethers } from "ethers";
import { NextResponse } from "next/server";
import abi from "@/lib/abis/minting";

export async function POST(req) {
    try {
        const formdata = await req.formData();
        const placeId = await formdata.get('id');
        const uri = await formdata.get('uri');
        const address = await formdata.get('address');

        console.log("Inputs:", { placeId, uri, address });

        if (!placeId || !uri || !address) {
            return NextResponse.json(
                { error: "Important information not provided." },
                { status: 404 }
            );
        }

        // Initialize provider with ethers v6 syntax
        const provider = new ethers.getDefaultProvider(
            `https://flow-mainnet.g.alchemy.com/v2/CA4eh0FjTxMenSW3QxTpJ7D-vWMSHVjq`
        );

        // Initialize wallet
        const privateKey = process.env.ADMIN_PVT_KEY;
        if (!privateKey) {
            throw new Error("Private key not found in environment variables");
        }
        const wallet = new ethers.Wallet(privateKey);

        const signer = wallet.connect(provider);

        // Create contract instance
        const contract = new ethers.Contract(
            contractAdds.minting,
            abi,
            signer
        );

        // Prepare transaction with explicit parameters
        const tx = await contract.safeMint(
            uri,
            placeId,
            address,
        );

        console.log("Transaction sent:", tx.hash);

        // Wait for confirmation with timeout and specific confirmation count
        const receipt = await Promise.race([
            tx.wait(1),  // Wait for 1 confirmation
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Transaction timeout")), 60000)
            )
        ]);

        return NextResponse.json(
            {
                txn: tx.hash,
                
            },
            { status: 200 }
        );

    } catch (err) {
        console.error("Error details:", err);

        // Handle internal RPC errors
        if (err.error?.code === -32000) {
            if (err.error.message.includes("insufficient funds")) {
                return NextResponse.json(
                    { error: "Insufficient funds for transaction" },
                    { status: 400 }
                );
            }
            if (err.error.message.includes("nonce")) {
                return NextResponse.json(
                    { error: "Nonce too low or already used" },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                {
                    error: "Transaction failed at RPC level",
                    details: err.error.message
                },
                { status: 400 }
            );
        }

        // Handle ethers-specific errors
        if (err.code === "UNPREDICTABLE_GAS_LIMIT") {
            return NextResponse.json(
                { error: "Failed to estimate gas. The transaction might fail." },
                { status: 400 }
            );
        }

        if (err.code === "UNKNOWN_ERROR") {
            return NextResponse.json(
                {
                    error: "Transaction failed",
                    details: err.shortMessage || err.message,
                    payload: err.payload
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                error: err.shortMessage || err.message || "Unknown error occurred",
                code: err.code,
                details: err.error
            },
            { status: 500 }
        );
    }
}