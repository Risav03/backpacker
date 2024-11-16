import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import React, { useState } from 'react'
import { useContractSetup } from './contractSetup.hook'
import { contractAdds } from '../contractAdds'
import abi from "@/lib/abis/minting"

export const useReviewsByPlace = () => {

  const { primaryWallet } = useDynamicContext()
  const[reviews, setReviews] = useState<any>([]);
  
  async function getReviews(placeId:string){
    try{
      const contract = await useContractSetup({address: contractAdds.minting, abi, wallet:primaryWallet});
      const res = await contract?.returnURIsByPlace(placeId);
      console.log(res);
      setReviews(res);
    }
    catch(err){
      console.log(err);
    }

}

  return {getReviews, reviews}

}