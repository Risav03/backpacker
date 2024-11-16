import { useState, useEffect, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";

export enum TransportMode {
  car = "car",
  train = "train",
  bike = "bike",
  walk = "walk",
}

export enum VisitTime {
  morning = "morning",
  afternoon = "afternoon",
  evening = "evening",
  night = "night",
}

export enum PoiTag {
  Historical = "Historical",
  Natural = "Natural",
  Cultural = "Cultural",
  Archaeological = "Archaeological",
  Architectural = "Architectural",
  Artistic = "Artistic",
  Religious = "Religious",
  Industrial = "Industrial",
  Modern = "Modern",
  Traditional = "Traditional",
  Educational = "Educational",
}

interface TrainingPoint {
  poi_id: number;
  transport_mode: TransportMode;
  visit_time: VisitTime;
  duration: number;
  budget: number;
}

interface NormalizedTrainingPoint {
  poi_id: number;
  transport_mode: TransportMode;
  visit_time: VisitTime;
  duration: number;
  budget: number;
  timestamp: number;
}

interface PublicPoiData {
  rating: number;
  tag: PoiTag;
}

interface PoiPrediction {
  poi_id: number;
  visit_likelihood: number;
  best_time: VisitTime;
  recommended_duration: number;
  recommended_budget: number;
  confidence_score: number;
}

interface RankedPredictions {
  rankings: PoiPrediction[];
  error?: string;
}

interface ModelState {
  isTraining: boolean;
  modelVersion: number;
  error: string | null;
  lastTrainingTime: number | null;
}

interface RankedPrediction {
  poi_id: number;
  tag: PoiTag;
  visit_likelihood: number;
  best_visit_time: VisitTime;
  recommended_duration: number;
  recommended_budget: number;
  confidence_score: number;
}

interface BatchPredictionInput {
  poi_data: {
    poi_id: number;
    tag: PoiTag;
  }[];
}

const encodeTransportMode = (mode: TransportMode): number[] => {
  const encoding = new Array(4).fill(0);
  const index = Object.values(TransportMode).indexOf(mode);
  encoding[index] = 1;
  return encoding;
};

const encodeVisitTime = (time: VisitTime): number[] => {
  const encoding = new Array(4).fill(0);
  const index = Object.values(VisitTime).indexOf(time);
  encoding[index] = 1;
  return encoding;
};

const encodeTag = (tag: PoiTag): number[] => {
  const encoding = new Array(11).fill(0);
  const index = Object.values(PoiTag).indexOf(tag);
  encoding[index] = 1;
  return encoding;
};

export const useFederatedLearning = (
  initialPublicData: Record<number, PublicPoiData> = {}
) => {
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [localData, setLocalData] = useState<NormalizedTrainingPoint[]>([]);
  const [modelState, setModelState] = useState<ModelState>({
    isTraining: false,
    modelVersion: 0,
    error: null,
    lastTrainingTime: null,
  });
  const [publicData, setPublicData] = useState(initialPublicData);

  const createModel = useCallback(() => {
    const newModel = tf.sequential();

    // Input shape: 20 features
    // - 4 for transport mode (one-hot)
    // - 4 for visit time (one-hot)
    // - 11 for tag (one-hot)
    // - 1 for rating

    newModel.add(
      tf.layers.dense({
        units: 64,
        activation: "relu",
        inputShape: [20],
      })
    );

    newModel.add(tf.layers.dropout({ rate: 0.2 }));

    newModel.add(
      tf.layers.dense({
        units: 32,
        activation: "relu",
      })
    );

    newModel.add(
      tf.layers.dense({
        units: 5,
        activation: "sigmoid",
      })
    );

    newModel.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["accuracy"],
    });

    return newModel;
  }, []);

  useEffect(() => {
    const initModel = async () => {
      const newModel = createModel();
      setModel(newModel);
      await loadLocalData();
    };

    initModel();
  }, [createModel]);

  const normalizeBudget = useCallback((budget: number): number => {
    return budget / 1000;
  }, []);

  const saveLocalData = useCallback(async (data: NormalizedTrainingPoint[]) => {
    localStorage.setItem("userTrainingData", JSON.stringify(data));
  }, []);

  const loadLocalData = useCallback(async () => {
    const stored = localStorage.getItem("userTrainingData");
    const data = stored
      ? (JSON.parse(stored) as NormalizedTrainingPoint[])
      : [];
    setLocalData(data);
    return data;
  }, []);

  const addTrainingPoint = useCallback(
    async (poiData: TrainingPoint) => {
      const normalizedPoint: NormalizedTrainingPoint = {
        poi_id: poiData.poi_id,
        transport_mode: poiData.transport_mode,
        visit_time: poiData.visit_time,
        duration: poiData.duration / 60, // Convert to hours
        budget: normalizeBudget(poiData.budget),
        timestamp: Date.now(),
      };

      const newLocalData = [...localData, normalizedPoint];
      setLocalData(newLocalData);
      await saveLocalData(newLocalData);
    },
    [localData, normalizeBudget, saveLocalData]
  );

  const prepareTrainingData = useCallback(
    (data: NormalizedTrainingPoint[]) => {
      const features: number[][] = [];
      const labels: number[][] = [];

      for (const point of data) {
        const poiPublicData = publicData[point.poi_id] || {
          rating: 0,
          tag: PoiTag.Historical,
        };

        // Combine all features
        const combinedFeatures = [
          ...encodeTransportMode(point.transport_mode),
          ...encodeVisitTime(point.visit_time),
          ...encodeTag(poiPublicData.tag),
          poiPublicData.rating || 0,
        ];

        features.push(combinedFeatures);

        labels.push([
          1, // visit likelihood
          Object.values(VisitTime).indexOf(point.visit_time) / 3, // normalize time to 0-1
          point.duration,
          point.budget,
          0.8, // confidence score
        ]);
      }

      return {
        xs: tf.tensor2d(features),
        ys: tf.tensor2d(labels),
      };
    },
    [publicData]
  );

  const trainModel = useCallback(async () => {
    if (!model || localData.length < 5) {
      setModelState((prev) => ({
        ...prev,
        error: "Insufficient data or model not ready",
      }));
      return null;
    }

    setModelState((prev) => ({ ...prev, isTraining: true, error: null }));

    try {
      const trainData = prepareTrainingData(localData);

      const history = await model.fit(trainData.xs, trainData.ys, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
      });

      setModelState((prev) => ({
        ...prev,
        isTraining: false,
        modelVersion: prev.modelVersion + 1,
        lastTrainingTime: Date.now(),
      }));

      return history;
    } catch (error) {
      setModelState((prev) => ({
        ...prev,
        isTraining: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }));
      return null;
    }
  }, [model, localData, prepareTrainingData]);

  const getModelWeights = useCallback(async () => {
    if (!model) return null;
    const weights = model.getWeights();
    const weightArrays = await Promise.all(weights.map((w) => w.array()));
    return [weightArrays];
  }, [model]);

  const updateModelWeights = useCallback(
    async (newWeights: number[][][]) => {
      if (!model) return;

      const weightTensors = newWeights.map((w) => tf.tensor(w));
      await model.setWeights(weightTensors);

      setModelState((prev) => ({
        ...prev,
        modelVersion: prev.modelVersion + 1,
      }));
    },
    [model]
  );

  const predict = useCallback(
    async (
      poiIds: number[],
      userContext: Omit<TrainingPoint, "poi_id">
    ): Promise<RankedPredictions> => {
      if (!model) {
        return {
          rankings: [],
          error: "Model not initialized",
        };
      }

      try {
        // Generate predictions for each POI
        const predictions = await Promise.all(
          poiIds.map(async (poi_id) => {
            const poiPublicData = publicData[poi_id] || {
              rating: 0,
              tag: PoiTag.Historical,
            };

            // Prepare features
            const features = [
              ...encodeTransportMode(userContext.transport_mode),
              ...encodeVisitTime(userContext.visit_time),
              ...encodeTag(poiPublicData.tag),
              poiPublicData.rating || 0,
            ];

            const inputTensor = tf.tensor2d([features]);
            const predictionTensor = model.predict(inputTensor) as tf.Tensor;
            const prediction = (await predictionTensor.array()) as number[];

            // Clean up tensors
            inputTensor.dispose();
            predictionTensor.dispose();

            // Convert the visit time index back to enum
            const timeIndex = Math.round(prediction[1] * 3); // denormalize from 0-1 to 0-3
            const visitTimes = Object.values(VisitTime);
            const bestTime = visitTimes[
              Math.min(timeIndex, visitTimes.length - 1)
            ] as VisitTime;

            return {
              poi_id,
              visit_likelihood: prediction[0],
              best_time: bestTime,
              recommended_duration: Math.round(prediction[2] * 60), // convert back to minutes
              recommended_budget: Math.round(prediction[3] * 1000), // convert back to actual currency
              confidence_score: prediction[4],
            };
          })
        );

        // Sort predictions by visit likelihood in descending order
        const rankedPredictions = predictions.sort(
          (a, b) => b.visit_likelihood - a.visit_likelihood
        );

        return { rankings: rankedPredictions };
      } catch (error) {
        console.error("Prediction error:", error);
        return {
          rankings: [],
          error:
            error instanceof Error ? error.message : "Unknown prediction error",
        };
      }
    },
    [model, publicData]
  );

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
    setPublicData,
  };
};
