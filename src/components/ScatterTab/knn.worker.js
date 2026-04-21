import KNN from 'ml-knn';

self.onmessage = ({ data }) => {
  const { rawData, selectedCols, pcaResults, pcaK, classCol } = data;

  try {
    const labels = rawData.map(d => String(d[classCol]));
    const rawFeatures = rawData.map(row => selectedCols.map(col => Number(row[col]) || 0));
    const pcaFeatures = pcaResults.scores.map(row => row.slice(0, pcaK || 2));

    // --- STRATIFIED 5-FOLD SPLIT ---
    const kFolds = 5;
    const groups = {};
    labels.forEach((label, index) => {
      if (!groups[label]) groups[label] = [];
      groups[label].push(index);
    });

    // distribute indices evenly into 5 bins
    const folds = Array.from({ length: kFolds }, () => []);
    Object.values(groups).forEach(indices => {
      indices.sort(() => Math.random() - 0.5);
      
      indices.forEach((idx, i) => {
        folds[i % kFolds].push(idx);
      });
    });

    // calculate cross validation
    const calculateCV = (features) => {
      let totalAccuracy = 0;

      for (let i = 0; i < kFolds; i++) {
        // Fold i for testing, other folds for training
        const testIdx = folds[i];
        const trainIdx = folds.filter((_, idx) => idx !== i).flat();

        if (testIdx.length === 0 || trainIdx.length === 0) continue;

        const trainX = trainIdx.map(idx => features[idx]);
        const trainY = trainIdx.map(idx => labels[idx]);
        const testX = testIdx.map(idx => features[idx]);
        const testY = testIdx.map(idx => labels[idx]);

        const knn = new KNN(trainX, trainY, { k: 3 });
        const predictions = knn.predict(testX);
        
        const correct = predictions.filter((p, j) => p === testY[j]).length;
        totalAccuracy += (correct / testY.length);
      }

      return (totalAccuracy / kFolds) * 100;
    };

    const rawAcc = calculateCV(rawFeatures);
    const pcaAcc = calculateCV(pcaFeatures);

    self.postMessage({
      rawAccuracy: rawAcc,
      pcaAccuracy: pcaAcc,
      kFolds: kFolds,
    });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};