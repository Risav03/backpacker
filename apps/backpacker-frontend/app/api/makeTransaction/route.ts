import { contractAdds } from "@/lib/contractAdds";
import { ethers } from "ethers";
import { NextResponse } from "next/server";
import abi from "@/lib/abis/minting"

export async function POST(req:any){
    try{

        const formdata = await req.formData();

        const placeId = await formdata.get('placeId');
        const uri = await formdata.get('uri');

        if(!placeId || !uri){
            return NextResponse.json({error:"Important information not provided."},{status:404});
        }

        const provider = new ethers.JsonRpcProvider("https://flow-mainnet.g.alchemy.com/v2/CA4eh0FjTxMenSW3QxTpJ7D-vWMSHVjq");
        const wallet = new ethers.Wallet(process.env.ADMIN_PVT_KEY as string);

        const signer = wallet.connect(provider);

        const contract = new ethers.Contract(contractAdds.minting, abi, signer);

        const res = await contract.safeMint(uri, placeId);

        return NextResponse.json({txn: res},{status:200});

    }
    catch(err){
        return NextResponse.json({error:err},{status:500});
    }
}