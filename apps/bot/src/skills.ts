import { DynamicStructuredTool } from "langchain/tools";
import { z } from "zod";
import * as tf from '@tensorflow/tfjs';

export const tools = [
  new DynamicStructuredTool({
    name: "get_places",
    description: "Get the unique id of all the places. Accepts an array of places as input. Returns an array of placeids.",
    schema: z.object({
      places: z.array(z.string()).describe("An array of places to get the id for"),
    }),
    func: async ({ places }) => {
      const ids: string[] = [];
      console.log(`Getting ids for ${places.join(", ")}`);
      for (const place of places) {
        const response = await fetch(
          `https://api.geocode.earth/v1/search?api_key=ge-f18721c480b9aafe&text=${encodeURIComponent(place)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        const data: any = await response.json();
        ids.push(data.features[0].properties.id);
        console.log(`${place} id: ${data.features[0].properties.id}`);
      }
      return ids;
    },
  }),
  new DynamicStructuredTool({
    name: "rank_places",
    description: "Rank the places based on the user's preferences. Accepts an array of place ids as input.",
    schema: z.object({
      ids: z.array(z.string()).describe("The ids of the places to rank"),
    }),
    func: async ({ ids }) => {
      console.log(`Ranking places: ${ids.join(", ")}`);
      const model = await tf.loadLayersModel('file://data/model.json');
      const predictions = await model.predict(tf.tensor2d(ids));
      return predictions;
    },
  }),
];
