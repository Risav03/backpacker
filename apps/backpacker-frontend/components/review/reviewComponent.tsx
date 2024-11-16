'use client'
import React, { useEffect } from 'react'
import { TextInput } from '../UI/textInput'
import { useReviewHooks } from '@/lib/hooks/reviewComp.hook'
import { ImageInput } from '../UI/imageInput'
import { AreaInput } from '../UI/areaInput'
import { getIPFSUrl, useUploadToIPFS } from '@/lib/hooks/storacha.hook'
import { MultiSelect } from '../UI/dropdown'
import { toast } from 'react-toastify'
import { useAccount } from 'wagmi'
import { useContractSetup } from '@/lib/hooks/contractSetup.hook'
import mintingAbi from '@/lib/abis/minting'
import { contractAdds } from '@/lib/contractAdds'
import Navbar from "@/components/UI/navbar"
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useGlobalContext } from '@/context/MainContext'


export const ReviewComponent = () => {
    const {name, setName, description, setDescription, tags, setTags, image, setImage, handleImageChange} = useReviewHooks();

    const { place, setPlace } = useGlobalContext();
    const { primaryWallet } = useDynamicContext()

    const { upload, isUploading, uploadResult } = useUploadToIPFS();
    const {address} = useAccount();

    useEffect(() => {
      if(!place) return;
      console.log("place", place);
      setName(place?.properties.name);
    }, [place])
  
    const handleUpload = async () => {

      if (!image) {
        toast.error('Please select an image');
        return;
      }
      if(!address){
        toast.error('Please connect your wallet');
        return;
      }

      console.log(contractAdds.minting, mintingAbi)
      const contract = await useContractSetup({address: contractAdds.minting, abi: mintingAbi, wallet:primaryWallet});

      const result = await upload(image, description, name, tags);
      if (result.success) {
        console.log('Image URL:', getIPFSUrl(result.imageCid!));
        console.log('Metadata URL:', getIPFSUrl(result.metadataCid!));

        const tx = await contract?.safeMint(getIPFSUrl(result.metadataCid!));
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      

      } else {
        console.error('Upload failed:', result.error);
      }

    };

  return (
    <div className='flex flex-col items-center h-screen bg-white'>
      <div className='w-full flex items-center justify-center'>
        <Navbar />
      </div>
      
     
      <div className='w-full px-4 md:px-0 md:w-[80%] flex flex-col md:flex-row items-center justify-center gap-10 md:gap-20'>
       
        <div className='w-full max-w-md flex justify-center md:w-auto'>
          <ImageInput handleChange={handleImageChange} image={image as File} />
        </div>
        
      
        <div className='w-full  flex flex-col gap-10 items-center justify-center md:w-auto'>
          <div className='w-full'>
            <TextInput 
              content={name} 
              heading='Name' 
              placeholder='Name your review' 
              required={true} 
              setContent={setName} 
              limit={30} 
            />
          </div>
          <div className='w-full'>
            <AreaInput 
              content={description} 
              heading='Description' 
              limit={200} 
              placeholder='Enter a description' 
              required={true}  
              setContent={setDescription}  
            />
          </div>
          <div className='w-full'>
            <MultiSelect
              selectedTags={tags}
              setSelectedTags={setTags}
              required={true}
            />
          </div>
        </div>
      </div>
       
      <div className='pt-10'>
        <button 
          className="bg-white border border-[#6495ED] text-[#6495ED] rounded-md text-sm font-medium hover:bg-[#6495ED] hover:text-white transition duration-150 ease-in-out px-6 py-2"  
          onClick={handleUpload}
        >
         <h1 className='text-xl'>Submit</h1>
        </button>
        {isUploading && <h3>Loading...</h3>}
      </div>
    </div>
  )
}