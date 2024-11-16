import axios from 'axios';
import { useState } from 'react';

interface Attribute {
  trait_type: string;
  value: string | number;
}

interface UploadData {
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
  image: File,
  description: string,
  name: string,
  tags: string[]
): Promise<UploadResult> => {
  try {
    // 1. Upload image first
    const imageFormData = new FormData();
    imageFormData.append('image', image);
    
    const imageRes = await axios.post("/api/client", imageFormData);
    const imageCid = imageRes.data.cid;
    
    // 2. Create and upload metadata
    const metadata: UploadData = {
      description,
      name,
      attributes: formatAttributes(tags),
      image: `ipfs://${imageCid}`
    };

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
  return `https://ipfs.io/ipfs/${cid}`;
};

// React hook wrapper
export const useUploadToIPFS = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const upload = async (
    image: File,
    description: string,
    name: string,
    tags: string[]
  ) => {
    setIsUploading(true);
    try {
      const result = await uploadToIPFS(image, description, name, tags);
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