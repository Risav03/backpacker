import { useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';

// Enhanced type definitions
interface TrainingPoint {
  poi_id: number;
  transport_mode: number;
  visit_time: string;
  duration: number;
  budget: number;
}

interface NormalizedTrainingPoint {
  poi_id: number;
  transport_mode: number;
  visit_time: number;  // Normalized time value
  duration: number;
  budget: number;
  timestamp: number;
}

interface PublicPoiData {
  rating: number;
  tags: string[];
}

interface Prediction {
  visit_likelihood: number;
  best_time: string;
  recommended_duration: number;
  recommended_budget: number;
  confidence_score: number;
}

interface ModelState {
  isTraining: boolean;
  modelVersion: number;
  error: string | null;
  lastTrainingTime: number | null;
}

export const useFederatedLearning = (initialPublicData: Record<number, PublicPoiData> = {}) => {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [localData, setLocalData] = useState<NormalizedTrainingPoint[]>([]);
  const [modelState, setModelState] = useState<ModelState>({
    isTraining: false,
    modelVersion: 0,
    error: null,
    lastTrainingTime: null,
  });
  const [publicData, setPublicData] = useState(initialPublicData);

  // Initialize model
  const createModel = useCallback(() => {
    const newModel = tf.sequential();
    
    newModel.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [10]
    }));
    
    newModel.add(tf.layers.dropout({ rate: 0.2 }));
    
    newModel.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    newModel.add(tf.layers.dense({
      units: 5,
      activation: 'sigmoid'
    }));

    newModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['accuracy']
    });

    return newModel;
  }, []);

  // Initialize model on mount
  useEffect(() => {
    const initModel = async () => {
      const newModel = createModel();
      setModel(newModel);
      await loadLocalData();
    };

    initModel();
  }, [createModel]);

  // Data normalization utilities
  const normalizeTime = useCallback((time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60 + minutes) / 1440;
  }, []);

  const denormalizeTime = useCallback((normalizedTime: number): string => {
    const minutes = Math.round(normalizedTime * 1440);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }, []);

  const normalizeBudget = useCallback((budget: number): number => {
    return budget / 1000;
  }, []);

  // Local storage operations
  const saveLocalData = useCallback(async (data: NormalizedTrainingPoint[]) => {
    localStorage.setItem('userTrainingData', JSON.stringify(data));
  }, []);

  const loadLocalData = useCallback(async () => {
    const stored = localStorage.getItem('userTrainingData');
    const data = stored ? JSON.parse(stored) as NormalizedTrainingPoint[] : [];
    setLocalData(data);
    return data;
  }, []);

  // Add training point
  const addTrainingPoint = useCallback(async (poiData: TrainingPoint) => {
    const normalizedPoint: NormalizedTrainingPoint = {
      poi_id: poiData.poi_id,
      transport_mode: poiData.transport_mode,
      visit_time: normalizeTime(poiData.visit_time),
      duration: poiData.duration / 60,
      budget: normalizeBudget(poiData.budget),
      timestamp: Date.now()
    };

    const newLocalData = [...localData, normalizedPoint];
    setLocalData(newLocalData);
    await saveLocalData(newLocalData);
  }, [localData, normalizeTime, normalizeBudget, saveLocalData]);

  // Prepare training data
  const prepareTrainingData = useCallback((data: NormalizedTrainingPoint[]) => {
    const features: number[][] = [];
    const labels: number[][] = [];

    for (const point of data) {
      const poiPublicData = publicData[point.poi_id] || {};
      
      // Process tags
      const tagFeatures = new Array(4).fill(0);
      (poiPublicData.tags || []).slice(0, 4).forEach((_, i) => {
        tagFeatures[i] = 1;
      });

      features.push([
        point.poi_id,
        point.transport_mode,
        point.visit_time,
        point.duration,
        point.budget,
        poiPublicData.rating || 0,
        ...tagFeatures
      ]);

      labels.push([
        1,
        point.visit_time,
        point.duration,
        point.budget,
        0.8
      ]);
    }

    return {
      xs: tf.tensor2d(features),
      ys: tf.tensor2d(labels)
    };
  }, [publicData]);

  // Train model
  const trainModel = useCallback(async () => {
    if (!model || localData.length < 5) {
      setModelState(prev => ({
        ...prev,
        error: 'Insufficient data or model not ready'
      }));
      return null;
    }

    setModelState(prev => ({ ...prev, isTraining: true, error: null }));

    try {
      const trainData = prepareTrainingData(localData);
      
      const history = await model.fit(
        trainData.xs,
        trainData.ys,
        {
          epochs: 10,
          batchSize: 32,
          validationSplit: 0.2,
          shuffle: true
        }
      );

      setModelState(prev => ({
        ...prev,
        isTraining: false,
        modelVersion: prev.modelVersion + 1,
        lastTrainingTime: Date.now()
      }));

      return history;
    } catch (error) {
      setModelState(prev => ({
        ...prev,
        isTraining: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
      return null;
    }
  }, [model, localData, prepareTrainingData]);

  // Get model weights
  const getModelWeights = useCallback(async () => {
    if (!model) return null;
    const weights = model.getWeights();
    const weightArrays = await Promise.all(
      weights.map(w => w.array())
    );
    return weightArrays;
  }, [model]);

  // Update model weights
  const updateModelWeights = useCallback(async (newWeights: number[][][]) => {
    if (!model) return;
    
    const weightTensors = newWeights.map(w => tf.tensor(w));
    await model.setWeights(weightTensors);
    
    setModelState(prev => ({
      ...prev,
      modelVersion: prev.modelVersion + 1
    }));
  }, [model]);

  // Generate predictions
  const predict = useCallback(async (input: TrainingPoint): Promise<Prediction | null> => {
    if (!model) return null;

    const poiPublicData = publicData[input.poi_id] || {};
    const tagFeatures = new Array(4).fill(0);
    (poiPublicData.tags || []).slice(0, 4).forEach((_, i) => {
      tagFeatures[i] = 1;
    });

    const features = [
      input.poi_id,
      input.transport_mode,
      normalizeTime(input.visit_time),
      input.duration / 60,
      normalizeBudget(input.budget),
      poiPublicData.rating || 0,
      ...tagFeatures
    ];

    const inputTensor = tf.tensor2d([features]);
    const predictionTensor = model.predict(inputTensor) as tf.Tensor;
    const prediction = await predictionTensor.array() as number[];
    
    // Clean up tensor to prevent memory leaks
    inputTensor.dispose();
    predictionTensor.dispose();
    
    return {
      visit_likelihood: prediction[0],
      best_time: denormalizeTime(prediction[1]),
      recommended_duration: Math.round(prediction[2] * 60),
      recommended_budget: Math.round(prediction[3] * 1000),
      confidence_score: prediction[4]
    };
  }, [model, publicData, normalizeTime, normalizeBudget, denormalizeTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (model) {
        model.dispose();
      }
    };
  }, [model]);

  return {
    addTrainingPoint,
    trainModel,
    predict,
    getModelWeights,
    updateModelWeights,
    modelState,
    localData,
    setPublicData
  };
};