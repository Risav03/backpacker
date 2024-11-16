'use client'
import React from 'react'
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

export const ReviewComponent = () => {

    const {name, setName, description, setDescription, tags, setTags, image, setImage, handleImageChange} = useReviewHooks();

    const { upload, isUploading, uploadResult } = useUploadToIPFS();
    const {address} = useAccount();
  
    const handleUpload = async () => {

      if (!image) {
        toast.error('Please select an image');
        return;
      }
      if(!address){
        toast.error('Please connect your wallet');
        return;
      }

      const setup = useContractSetup({address: contractAdds.minting, abi: mintingAbi});
      console.log("setup:", setup);

      const result = await upload(image, description, name, tags);
      if (result.success) {
        console.log('Image URL:', getIPFSUrl(result.imageCid!));
        console.log('Metadata URL:', getIPFSUrl(result.metadataCid!));
      } else {
        console.error('Upload failed:', result.error);
      }
    };

  return (
    <div className='flex flex-col items-center justify-center'>
        <TextInput content={name} heading='Name' placeholder='Name your review' required={true} setContent={setName} limit={30} />
        <AreaInput content={description} heading='Description' limit={200} placeholder='Enter a description' required={true}  setContent={setDescription}  />
        <MultiSelect
            selectedTags={tags}
            setSelectedTags={setTags}
            required={true}
          />
        <button onClick={handleUpload}>GO</button>
        {isUploading && <h3>Loading...</h3>}
        <ImageInput handleChange={handleImageChange} image={image as File} />
    </div>
  )
}