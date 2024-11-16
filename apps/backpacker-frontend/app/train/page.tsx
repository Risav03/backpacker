'use client'

import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, MapPin, Train, ChevronDown } from 'lucide-react';
import { useFederatedLearning, TransportMode, VisitTime } from '@/components/federated/FederatedTest';
import { toast } from 'react-toastify'
import { useReviewsByPlace } from '@/lib/hooks/reviewsByPlace.hook';

interface Review {
  poi_id: number;
  poi_name: string;
  transport_mode?: TransportMode;
  visit_time?: VisitTime;
  duration?: number;
  budget?: number;
}

interface TrainingPoint {
  poi_id: number;
  transport_mode: TransportMode;
  visit_time: VisitTime;
  duration: number;
  budget: number;
}

const ReviewManager = () => {

  const {getPosts} = useReviewsByPlace();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isTrainingEnabled, setIsTrainingEnabled] = useState(false);
  const [openSelect, setOpenSelect] = useState<{ index: number | null; field: string | null }>({ 
    index: null, 
    field: null 
  });

  // Initialize the federated learning hook
  const {
    addTrainingPoint,
    trainModel,
    modelState,
  } = useFederatedLearning();

  useEffect( () => {
    const storedReviews = JSON.parse(localStorage.getItem('reviews') || '[]') as Review[];
    setReviews(storedReviews);

    const getPublicStats = async () => {

    const reviewsWithStats = await Promise.all(
      reviews.map(async (localRev) => {
        const placeIpfsReviews = await getPosts(localRev.poi_id.toString());
    
        // Extract ratings and tags from the attributes array
        const ratings:any = [];
        const tags:any = [];
    
        placeIpfsReviews.forEach((review:any) => {
          review.attributes.forEach((attr:any) => {
            if (attr.trait_type === "rating") {
              ratings.push(attr.value); // Collect ratings
            } else {
              tags.push(attr.trait_type); // Collect non-rating tags
            }
          });
        });
    
        // Calculate the average rating
        const averageRating = ratings.reduce((sum:any, rating:any) => sum + rating, 0) / ratings.length;
    
        // Find the most frequent tag
        const tagCounts = tags.reduce((acc:any, tag:any) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        }, {});
    
        const mostFrequentTag = Object.keys(tagCounts).reduce((maxTag:any, tag:any) => {
          return tagCounts[tag] > (tagCounts[maxTag] || 0) ? tag : maxTag;
        }, null);
    
        return {
          ...localRev,
          rating: isNaN(averageRating) ? 0 : averageRating,
          tag: mostFrequentTag || "None" // Handle case where no tags are found
        };
      })
    );

    }

    getPublicStats();
    checkTrainingEnabled(storedReviews);
  }, []);

  const checkTrainingEnabled = (currentReviews: Review[]) => {
    const allComplete = currentReviews.every((review) => 
      review.transport_mode && 
      review.visit_time && 
      review.duration && 
      review.budget !== undefined
    );
    setIsTrainingEnabled(allComplete);
  };

  const handleUpdateReview = (index: number, field: keyof Review, value: any) => {
    const updatedReviews = [...reviews];
    updatedReviews[index] = {
      ...updatedReviews[index],
      [field]: value
    };
    
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
    checkTrainingEnabled(updatedReviews);
    // toast.success("Review Updated");
  };

  const handleTrainModel = async () => {
    try {
      // Convert reviews to training points
      for (const review of reviews) {
        if (
          review.transport_mode &&
          review.visit_time &&
          review.duration &&
          review.budget !== undefined
        ) {
          const trainingPoint: TrainingPoint = {
            poi_id: review.poi_id,
            transport_mode: review.transport_mode,
            visit_time: review.visit_time,
            duration: review.duration,
            budget: review.budget
          };
          
          await addTrainingPoint(trainingPoint);
        }
      }

      // Train the model with the new data
      const trainingHistory = await trainModel();
      
      console.log("tshit:", trainingHistory);
      if (trainingHistory) {
        toast.success("Training Successful");
        
        // Clear reviews after successful training
        localStorage.removeItem('reviews');
        setReviews([]);
        setIsTrainingEnabled(false);
      } else {
        throw new Error("Training failed");
      }
    } catch (error) {
      toast.error("Training Failed");
    }
  };

  const isReviewPending = (review: Review) => {
    return !review.transport_mode || 
           !review.visit_time || 
           !review.duration || 
           review.budget === undefined;
  };

  interface CustomSelectProps {
    value: string | undefined;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
    placeholder: string;
    index: number;
    field: string;
  }

  const CustomSelect = ({ 
    value, 
    options, 
    onChange, 
    placeholder, 
    index, 
    field 
  }: CustomSelectProps) => {
    const isOpen = openSelect.index === index && openSelect.field === field;
    
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpenSelect(isOpen ? { index: null, field: null } : { index, field })}
          className="w-full px-3 py-2 text-left border rounded-md bg-white flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className={value ? 'text-gray-900' : 'text-gray-500'}>
            {value || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full px-3 py-2 text-left hover:bg-blue-50 ${
                    value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setOpenSelect({ index: null, field: null });
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const transportOptions = [
    { value: TransportMode.car, label: 'Car' },
    { value: TransportMode.train, label: 'Train' },
    { value: TransportMode.bike, label: 'Bike' },
    { value: TransportMode.walk, label: 'Walk' }
  ];

  const visitTimeOptions = [
    { value: VisitTime.morning, label: 'Morning' },
    { value: VisitTime.afternoon, label: 'Afternoon' },
    { value: VisitTime.evening, label: 'Evening' },
    { value: VisitTime.night, label: 'Night' }
  ];

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Training Portal</h1>
      <h2 className="text-lg font-bold mb-3">Get rewards for contributing to the model</h2>
      
      {modelState.error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {modelState.error}
        </div>
      )}
      
      <div className="space-y-4">
        {reviews.map((review, index) => (
          <div 
            key={index}
            className={`bg-white rounded-lg border-2 ${
              isReviewPending(review) ? 'border-orange-400' : 'border-green-400'
            } shadow-sm`}
          >
            <div className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="h-5 w-5" />
                <h3 className="text-xl font-semibold">{review.poi_name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Transport Mode</label>
                  <CustomSelect
                    value={review.transport_mode}
                    onChange={(value) => handleUpdateReview(index, 'transport_mode', value as TransportMode)}
                    placeholder="Select transport mode"
                    index={index}
                    field="transport"
                    options={transportOptions}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Visit Time</label>
                  <CustomSelect
                    value={review.visit_time}
                    onChange={(value) => handleUpdateReview(index, 'visit_time', value as VisitTime)}
                    placeholder="Select visit time"
                    index={index}
                    field="visit"
                    options={visitTimeOptions}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={review.duration || ''}
                    onChange={(e) => handleUpdateReview(index, 'duration', parseInt(e.target.value))}
                    placeholder="Enter duration"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Budget
                  </label>
                  <input
                    type="number"
                    value={review.budget || ''}
                    onChange={(e) => handleUpdateReview(index, 'budget', parseInt(e.target.value))}
                    placeholder="Enter budget"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t">
              <div className="text-sm text-gray-500">
                Status: {isReviewPending(review) ? 
                  <span className="text-orange-500">Pending</span> : 
                  <span className="text-green-500">Ready</span>
                }
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 0 && (
        <div className="mt-6 text-center">
          <button
            onClick={handleTrainModel}
            disabled={!isTrainingEnabled || modelState.isTraining}
            className={`
              inline-flex items-center px-4 py-2 rounded-md text-white
              ${isTrainingEnabled && !modelState.isTraining
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-300 cursor-not-allowed'}
            `}
          >
            <Train className="mr-2 h-4 w-4" />
            {modelState.isTraining 
              ? 'Training...' 
              : `Train Model (${reviews.length} reviews)`}
          </button>
          {!isTrainingEnabled && (
            <p className="text-sm text-gray-500 mt-2">
              Complete all review fields to enable training
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewManager;