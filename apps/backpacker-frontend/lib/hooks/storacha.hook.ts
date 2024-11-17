import axios from 'axios';
import { useState } from 'react';

interface Attribute {
  trait_type: string;
  value: string | number;
}

interface UploadData {
  id:string;
  description: string;
  image: string; // IPFS URL
  name: string;
  attributes: Attribute[];
}

interface UploadResult {
  success: boolean;
  imageCid?: string;
  metadataCid?: string;
  error?: string;
}

const formatAttributes = (tags: string[]): Attribute[] => {
  return tags.map(tag => ({
    trait_type: tag,
    value: "true"
  }));
};

const uploadToIPFS = async (
  id: string,
  image: File,
  description: string,
  name: string,
  tags: string[],
  rating:number
): Promise<UploadResult> => {
  try {
    // 1. Upload image first
    const imageFormData = new FormData();
    imageFormData.append('image', image);
    
    const imageRes = await axios.post("/api/client", imageFormData);
    const imageCid = imageRes.data.cid;
    
    // 2. Create and upload metadata
    const metadata: UploadData = {
      id: id,
      description,
      name,
      attributes: formatAttributes(tags),
      image: `ipfs://${imageCid}`
    };

    metadata.attributes.push({trait_type: "rating", value: rating})

    // Convert metadata to File object
    const metadataBlob = new Blob([JSON.stringify(metadata)], { 
      type: 'application/json' 
    });
    const metadataFile = new File([metadataBlob], 'metadata.json', { 
      type: 'application/json' 
    });

    const metadataFormData = new FormData();
    metadataFormData.append('image', metadataFile);
    
    const metadataRes = await axios.post("/api/client", metadataFormData);
    const metadataCid = metadataRes.data.cid;

    console.log('Image CID:', imageCid);
    console.log('Metadata CID:', metadataCid);

    return {
      success: true,
      imageCid,
      metadataCid
    };

  } catch (error) {
    console.error('Error uploading:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper to get gateway URL
export const getIPFSUrl = (cid: string): string => {
  return `https://${cid}.ipfs.w3s.link`;
};

// React hook wrapper
export const useUploadToIPFS = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const upload = async (
    id: string,
    image: File,
    description: string,
    name: string,
    tags: string[],
    rating:number
  ) => {
    setIsUploading(true);
    try {
      const result = await uploadToIPFS(id, image, description, name, tags, rating);
      setUploadResult(result);
      return result;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    upload,
    isUploading,
    uploadResult
  };
};