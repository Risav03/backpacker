import * as Client from '@web3-storage/w3up-client'
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory'
import * as Proof from '@web3-storage/w3up-client/proof'
import { Signer } from '@web3-storage/w3up-client/principal/ed25519'
import * as DID from '@ipld/dag-ucan/did'
import { NextResponse } from 'next/server'
 
export async function POST(req:any) {

  try{

    const formdata = await req.formData();

    const image = formdata.get('image');

    if(!image){
      return NextResponse.json({error:"No image attached!"},{status:404})
    }

    const principal = Signer.parse(process.env.KEY as string)
    const store = new StoreMemory()
    const client = await Client.create({ principal, store })
   
    const proof = await Proof.parse(process.env.PROOF as string)
    const space = await client.addSpace(proof)
  
    await client.setCurrentSpace(space.did());

    const directoryCid = await client.uploadFile(image as File);
  
    return NextResponse.json({cid: directoryCid.toString()},{status:200})
  }
  catch(err){
    return NextResponse.json({error:err}, {status:500});
  }
  
}