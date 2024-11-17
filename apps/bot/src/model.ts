declare global {
  interface Window {
    localStorage: Storage;
  }
}

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

export class FederatedLearningModel {
  private model: tf.LayersModel | null = null;
  private localData: NormalizedTrainingPoint[] = [];
  private modelState: ModelState = {
    isTraining: false,
    modelVersion: 0,
    error: null,
    lastTrainingTime: null,
  };
  private publicData: Record<number, PublicPoiData>;

  constructor(initialPublicData: Record<number, PublicPoiData> = {}) {
    this.publicData = initialPublicData;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.model = this.createModel();
    await this.loadLocalData();
  }

  private createModel(): tf.LayersModel {
    const model = tf.sequential();

    model.add(
      tf.layers.dense({
        units: 64,
        activation: "relu",
        inputShape: [20],
      })
    );

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(
      tf.layers.dense({
        units: 32,
        activation: "relu",
      })
    );

    model.add(
      tf.layers.dense({
        units: 5,
        activation: "sigmoid",
      })
    );

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["accuracy"],
    });

    return model;
  }

  private normalizeBudget(budget: number): number {
    return budget / 1000;
  }

  private async saveLocalData(data: NormalizedTrainingPoint[]): Promise<void> {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem("userTrainingData", JSON.stringify(data));
    }
  }

  private async loadLocalData(): Promise<NormalizedTrainingPoint[]> {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem("userTrainingData");
      this.localData = stored ? (JSON.parse(stored) as NormalizedTrainingPoint[]) : [];
    }
    return this.localData;
  }

  public async addTrainingPoint(poiData: TrainingPoint): Promise<void> {
    const normalizedPoint: NormalizedTrainingPoint = {
      poi_id: poiData.poi_id,
      transport_mode: poiData.transport_mode,
      visit_time: poiData.visit_time,
      duration: poiData.duration / 60,
      budget: this.normalizeBudget(poiData.budget),
      timestamp: Date.now(),
    };

    this.localData = [...this.localData, normalizedPoint];
    await this.saveLocalData(this.localData);
  }

  private prepareTrainingData(data: NormalizedTrainingPoint[]): {
    xs: tf.Tensor2D;
    ys: tf.Tensor2D;
  } {
    const features: number[][] = [];
    const labels: number[][] = [];

    for (const point of data) {
      const poiPublicData = this.publicData[point.poi_id] || {
        rating: 0,
        tag: PoiTag.Historical,
      };

      const combinedFeatures = [
        ...encodeTransportMode(point.transport_mode),
        ...encodeVisitTime(point.visit_time),
        ...encodeTag(poiPublicData.tag),
        poiPublicData.rating || 0,
      ];

      features.push(combinedFeatures);
      labels.push([
        1,
        Object.values(VisitTime).indexOf(point.visit_time) / 3,
        point.duration,
        point.budget,
        0.8,
      ]);
    }

    return {
      xs: tf.tensor2d(features),
      ys: tf.tensor2d(labels),
    };
  }

  public async trainModel(): Promise<tf.History | null> {
    if (!this.model || this.localData.length < 1) {
      this.modelState = {
        ...this.modelState,
        error: "Insufficient data or model not ready",
      };
      return null;
    }

    this.modelState = { ...this.modelState, isTraining: true, error: null };

    try {
      const trainData = this.prepareTrainingData(this.localData);
      const history = await this.model.fit(trainData.xs, trainData.ys, {
        epochs: 10,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
      });

      this.modelState = {
        ...this.modelState,
        isTraining: false,
        modelVersion: this.modelState.modelVersion + 1,
        lastTrainingTime: Date.now(),
      };

      return history;
    } catch (error) {
      this.modelState = {
        ...this.modelState,
        isTraining: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
      return null;
    }
  }

  public async getModelWeights(): Promise<tf.Tensor[]> {
    if (!this.model) return [];
    return this.model.getWeights();
  }

  public async updateModelWeights(newWeights: number[][][]): Promise<void> {
    if (!this.model) return;
    const weightTensors = newWeights.map((w) => tf.tensor(w));
    await this.model.setWeights(weightTensors);
    this.modelState = {
      ...this.modelState,
      modelVersion: this.modelState.modelVersion + 1,
    };
  }

  public async predict(
    poiIds: number[],
    userContext: Omit<TrainingPoint, "poi_id">
  ): Promise<RankedPredictions> {
    if (!this.model) {
      return {
        rankings: [],
        error: "Model not initialized",
      };
    }

    try {
      const predictions = await Promise.all(
        poiIds.map(async (poi_id) => {
          const poiPublicData = this.publicData[poi_id] || {
            rating: 0,
            tag: PoiTag.Historical,
          };

          const features = [
            ...encodeTransportMode(userContext.transport_mode),
            ...encodeVisitTime(userContext.visit_time),
            ...encodeTag(poiPublicData.tag),
            poiPublicData.rating || 0,
          ];

          const inputTensor = tf.tensor2d([features]);
          const predictionTensor = this.model!.predict(inputTensor) as tf.Tensor;
          const prediction = (await predictionTensor.array()) as number[];

          inputTensor.dispose();
          predictionTensor.dispose();

          const timeIndex = Math.round(prediction[1] * 3);
          const visitTimes = Object.values(VisitTime);
          const bestTime = visitTimes[
            Math.min(timeIndex, visitTimes.length - 1)
          ] as VisitTime;

          return {
            poi_id,
            visit_likelihood: prediction[0],
            best_time: bestTime,
            recommended_duration: Math.round(prediction[2] * 60),
            recommended_budget: Math.round(prediction[3] * 1000),
            confidence_score: prediction[4],
          };
        })
      );

      return {
        rankings: predictions.sort((a, b) => b.visit_likelihood - a.visit_likelihood),
      };
    } catch (error) {
      console.error("Prediction error:", error);
      return {
        rankings: [],
        error: error instanceof Error ? error.message : "Unknown prediction error",
      };
    }
  }

  public dispose(): void {
    if (this.model) {
      this.model.dispose();
    }
  }

  public getModelState(): ModelState {
    return this.modelState;
  }

  public getLocalData(): NormalizedTrainingPoint[] {
    return this.localData;
  }

  public setPublicData(data: Record<number, PublicPoiData>): void {
    this.publicData = data;
  }
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