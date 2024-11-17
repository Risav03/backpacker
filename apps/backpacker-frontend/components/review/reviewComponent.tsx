'use client'
import React, { useEffect, useState } from 'react'
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
import axios from 'axios'
import { Search } from 'lucide-react';

interface SearchResult {
  properties: {
    id: string;
    name: string;
    label: string;
    country: string;
    region: string;
    locality?: string;
    confidence: number;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface ReviewFormData {
  name: string;
  description: string;
  tags: string[];
  image: File | null;
  rating: string;
}

const CombinedReviewSearch = () => {
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<SearchResult | null>(null);

  const { upload, isUploading } = useUploadToIPFS();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review form states
  const [formData, setFormData] = useState<ReviewFormData>({
    name: '',
    description: '',
    tags: [],
    image: null,
    rating: ''
  });

  // Wallet connection
  const { address } = useAccount();
  const { primaryWallet } = useDynamicContext();

  const handleSearch = async () => {
    if (!address) {
      setError('Please connect your wallet first');
      return;
    }

    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.geocode.earth/v1/search?api_key=ge-f18721c480b9aafe&text=${encodeURIComponent(searchQuery)}`,
        { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setSearchResults(data.features);
    } catch (error) {
      console.error('Error fetching places:', error);
      setError('Failed to fetch place data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaceSelect = (place: SearchResult) => {
    setSelectedPlace(place);
    setFormData(prev => ({ ...prev, name: place.properties.name }));
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, image: file }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validation checks
      if (!formData.image) {
        toast.error('Please select an image');
        return;
      }
      if (!address) {
        toast.error('Please connect your wallet');
        return;
      }
      if (!selectedPlace) {
        toast.error('Please select a place');
        return;
      }
      if (!formData.description || !formData.name || !formData.rating) {
        toast.error('Please fill all required fields');
        return;
      }

      // Contract setup
      const contract = await useContractSetup({
        address: contractAdds.minting,
        abi: mintingAbi,
        wallet: primaryWallet
      });

      // Upload to IPFS
      const result = await upload(
        selectedPlace.properties.id,
        formData.image,
        formData.description,
        formData.name,
        formData.tags,
        Number(formData.rating)
      );

      if (result.success) {
        // Store in localStorage
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        localStorage.setItem('reviews', JSON.stringify([
          ...reviews,
          {
            poi_id: selectedPlace.properties.id,
            poi_name: formData.name,
            transport_mode: undefined,
            visit_time: undefined,
            duration: undefined,
            budget: undefined,
          }
        ]));

        // Prepare and send data to mint endpoint
        const formDataToSend = new FormData();
        formDataToSend.append('id', selectedPlace.properties.id);
        formDataToSend.append('uri', getIPFSUrl(result.metadataCid!));
        formDataToSend.append('address', address);

        const mintResponse = await axios.post("/api/mint", formDataToSend);

        if (mintResponse.status === 200) {
          toast.success('Review submitted successfully!');
          // Reset form
          setSelectedPlace(null);
          setFormData({
            name: '',
            description: '',
            tags: [],
            image: null,
            rating: ''
          });
        } else {
          throw new Error('Minting failed');
        }
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search Section */}
      <div className="mb-8">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            placeholder="Search for a place..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isLoading ? (
              <div className="animate-spin"><Search className="h-4 w-4" /></div>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Search
              </>
            )}
          </button>
        </div>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        {searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((result, index) => (
              <div
                key={index}
                onClick={() => handlePlaceSelect(result)}
                className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <h3 className="font-semibold">{result.properties.name}</h3>
                <p className="text-gray-600 text-sm">{result.properties.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Form Section */}
      {selectedPlace && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg h-32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating (1-5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Submit Review
          </button>
        </div>
      )}
    </div>
  );
};

export default CombinedReviewSearch;