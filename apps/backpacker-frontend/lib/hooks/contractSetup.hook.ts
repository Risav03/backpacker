import React from 'react'

export const useContractSetup = ({address, abi}:{address:string, abi:any}) => {

    try {
        //@ts-ignore
        if (typeof window.ethereum !== 'undefined') {

            //@ts-ignore
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            //@ts-ignore
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            //@ts-ignore
            const contract = new ethers.Contract(address, abi, signer);
            return contract;

        }

    }
    catch (err) {
        console.error(err);
    }

}
