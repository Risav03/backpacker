'use client'
import { useRpcProviders } from '@dynamic-labs/sdk-react-core';
import React from 'react'
import { evmProvidersSelector } from '@dynamic-labs/ethereum-core'

import { getWeb3Provider,getSigner} from '@dynamic-labs/ethers-v6'
import { Contract, InterfaceAbi, ethers } from 'ethers'



export const useContractSetup = async ({address, abi, wallet}:{address:string, abi:any, wallet:any}) => {

    try {
        //@ts-ignore
        if (typeof window.ethereum !== 'undefined') {

            const provider = await getWeb3Provider(wallet)
            const signer = await getSigner(wallet)

            console.log("Provider",provider);
            console.log("Signer", signer);


            // //@ts-ignore
            const contract = new Contract(
                address,
                abi,
                signer
              )
            return contract;

        }

    }
    catch (err) {
        console.error(err);
    }

}
