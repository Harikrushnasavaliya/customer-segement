declare module 'ml-kmeans' {
    export function kmeans(data: number[][], k: number): {
      clusters: number[];
      centroids: number[][];
    };
  }
  