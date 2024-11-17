'use client'
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useGlobalContext } from '@/context/MainContext';
import { useRouter } from 'next/navigation';

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

const SearchInput = ({ value, onChange, onKeyPress }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}) => (
  <input
    type="text"
    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
    placeholder="Search for a place..."
    value={value}
    onChange={onChange}
    onKeyPress={onKeyPress}
  />
);

const SearchButton = ({ onClick, isLoading }: {
  onClick: () => void;
  isLoading: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
  >
    {isLoading ? (
      <div className="animate-spin">
        <Search className="h-4 w-4" />
      </div>
    ) : (
      <>
        <Search className="h-4 w-4 mr-2" />
        Search
      </>
    )}
  </button>
);

const ResultCard = ({ result }: { result: SearchResult }) => {

    const { place, setPlace } = useGlobalContext(); 
    const router = useRouter();

    return(
    <div onClick={()=>{
        setPlace(result);
        router.push('/review');
    }} className="p-4 border rounded-lg mb-2 hover:bg-gray-50">
    <h3 className="font-semibold">{result.properties.name}</h3>
    <p className="text-gray-600 text-sm">{result.properties.label}</p>
    <div className="mt-2 flex gap-4 text-sm text-gray-500">
      <span>Confidence: {(result.properties.confidence * 100).toFixed(0)}%</span>
      <span>Coordinates: {result.geometry.coordinates[1].toFixed(4)}, {result.geometry.coordinates[0].toFixed(4)}</span>
    </div>
  </div>)
};

const PlacesSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://api.geocode.earth/v1/search?api_key=ge-f18721c480b9aafe&text=${encodeURIComponent(searchQuery)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResults(data.features);
      console.log('Geocode.earth API Response:', data);
      
    } catch (error) {
      console.error('Error fetching places:', error);
      setError('Failed to fetch place data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Place Search</h2>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <SearchButton 
            onClick={handleSearch}
            isLoading={isLoading}
          />
        </div>

        {error && (
          <div className="mt-4 text-red-500 text-sm">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Search Results</h3>
            {results.map((result, index) => (
              <ResultCard key={index} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacesSearch;