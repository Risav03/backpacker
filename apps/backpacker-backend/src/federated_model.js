/**
 * @typedef {Array<Array<number[]|number[][]>>} ModelWeights - List[List[np.ndarray]]
 */

export class FederatedServer {
    constructor() {
        /** @type {ModelWeights|null} */
        this.globalWeights = null;
        /** @type {number} */
        this.modelVersion = 0;
        /** @type {number} */
        this.minClients = 3; // Minimum number of clients for aggregation
        /** @type {ModelWeights[]} */
        this.clientWeights = [];
    }

    /**
     * Implements Federated Averaging (FedAvg) algorithm
     * @param {ModelWeights[]} weightsList - List of client weights to aggregate
     * @returns {ModelWeights} Aggregated weights
     */
    aggregateWeights(weightsList) {
        if (!weightsList.length) {
            throw new Error("No weights to aggregate");
        }

        const nClients = weightsList.length;
        const firstClientWeights = weightsList[0][0]; // Access the inner list of arrays

        // Initialize aggregated weights with same structure as first client
        const aggregatedInner = firstClientWeights.map(layer => {
            // Handle both 1D and 2D arrays
            if (layer[0] instanceof Array) {
                // 2D array
                return layer.map(row => 
                    row.map(() => 0)
                );
            } else {
                // 1D array
                return layer.map(() => 0);
            }
        });

        // Sum all weights
        for (const clientWeight of weightsList) {
            const layers = clientWeight[0]; // Access the inner list
            layers.forEach((layer, layerIdx) => {
                if (layer[0] instanceof Array) {
                    // 2D array
                    layer.forEach((row, rowIdx) => {
                        row.forEach((value, colIdx) => {
                            aggregatedInner[layerIdx][rowIdx][colIdx] += value;
                        });
                    });
                } else {
                    // 1D array
                    layer.forEach((value, idx) => {
                        aggregatedInner[layerIdx][idx] += value;
                    });
                }
            });
        }

        // Average the weights
        aggregatedInner.forEach((layer, layerIdx) => {
            if (layer[0] instanceof Array) {
                // 2D array
                layer.forEach((row, rowIdx) => {
                    row.forEach((value, colIdx) => {
                        aggregatedInner[layerIdx][rowIdx][colIdx] /= nClients;
                    });
                });
            } else {
                // 1D array
                layer.forEach((value, idx) => {
                    aggregatedInner[layerIdx][idx] /= nClients;
                });
            }
        });

        // Return in the expected format: List[List[np.ndarray]]
        return [aggregatedInner];
    }

    /**
     * Update global weights if enough clients have contributed
     * @returns {boolean} Whether the update was performed
     */
    updateGlobalWeights() {
        if (this.clientWeights.length >= this.minClients) {
            this.globalWeights = this.aggregateWeights(this.clientWeights);
            this.modelVersion += 1;
            this.clientWeights = []; // Reset for next round
            return true;
        }
        return false;
    }
}