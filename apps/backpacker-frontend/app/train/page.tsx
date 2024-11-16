'use client'
import React, { useState, useEffect } from 'react';
import { Clock, DollarSign, MapPin, Train, ChevronDown } from 'lucide-react';

const ReviewManager = () => {
  const [reviews, setReviews] = useState<any>([]);
  const [isTrainingEnabled, setIsTrainingEnabled] = useState(false);
  const [openSelect, setOpenSelect] = useState({ index: null, field: null });

  useEffect(() => {
    const storedReviews = JSON.parse(localStorage.getItem('reviews') || '[]');
    setReviews(storedReviews);
    checkTrainingEnabled(storedReviews);
  }, []);

  const checkTrainingEnabled = (currentReviews:any) => {
    const allComplete = currentReviews.every((review:any) => 
      review.transport_mode && 
      review.visit_time && 
      review.duration && 
      review.budget !== undefined
    );
    setIsTrainingEnabled(allComplete);
  };

  const handleUpdateReview = (index:any, field:any, value:any) => {
    console.log(`Updating review ${index}, field: ${field}, value: ${value}`);
    const updatedReviews:any = [...reviews];
    updatedReviews[index] = {
      ...updatedReviews[index],
      [field]: value
    };
    
    setReviews(updatedReviews);
    localStorage.setItem('reviews', JSON.stringify(updatedReviews));
    checkTrainingEnabled(updatedReviews);
    // Show toast message (implement your preferred way)
    console.log(`Updated ${field} successfully`);
  };

  const handleTrainModel = () => {
    console.log('Training model with reviews:', reviews);
    // Here you would typically send the data to your training endpoint
    console.log('Training started successfully');
    
    localStorage.removeItem('reviews');
    setReviews([]);
    setIsTrainingEnabled(false);
  };

  const isReviewPending = (review:any) => {
    return !review.transport_mode || 
           !review.visit_time || 
           !review.duration || 
           review.budget === undefined;
  };

  const CustomSelect = ({ value, options, onChange, placeholder, index, field }:any) => {
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
              {options.map((option:any) => (
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

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Training Portal</h1>
      <h2 className="text-lg font-bold mb-3">Get rewards for contributing to the model</h2>
      
      <div className="space-y-4">
        {reviews.map((review:any, index:any) => (
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
                    onChange={(value:any) => handleUpdateReview(index, 'transport_mode', value)}
                    placeholder="Select transport mode"
                    index={index}
                    field="transport"
                    options={[
                      { value: 'walking', label: 'Walking' },
                      { value: 'cycling', label: 'Cycling' },
                      { value: 'driving', label: 'Driving' },
                      { value: 'public', label: 'Public Transport' }
                    ]}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Visit Time</label>
                  <CustomSelect
                    value={review.visit_time}
                    onChange={(value:any) => handleUpdateReview(index, 'visit_time', value)}
                    placeholder="Select visit time"
                    index={index}
                    field="visit"
                    options={[
                      { value: 'morning', label: 'Morning' },
                      { value: 'afternoon', label: 'Afternoon' },
                      { value: 'evening', label: 'Evening' },
                      { value: 'night', label: 'Night' }
                    ]}
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
            disabled={!isTrainingEnabled}
            className={`
              inline-flex items-center px-4 py-2 rounded-md text-white
              ${isTrainingEnabled 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-300 cursor-not-allowed'}
            `}
          >
            <Train className="mr-2 h-4 w-4" />
            Train Model ({reviews.length} reviews)
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