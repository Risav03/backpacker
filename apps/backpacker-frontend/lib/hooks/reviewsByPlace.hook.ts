import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import React from 'react'
import { useContractSetup } from './contractSetup.hook'
import { contractAdds } from '../contractAdds'
import abi from "@/lib/abis/minting"

export const useReviewsByPlace = () => {

  const { primaryWallet } = useDynamicContext()
  
  async function getPosts(placeId:string){
    try{
      const contract = await useContractSetup({address: contractAdds.minting, abi, wallet:primaryWallet});
      const res = await contract?.returnURIsByPlace(placeId);

      return res;
    }
    catch(err){
      console.log(err);
    }
  }

  return {
    getPosts
  }
}
