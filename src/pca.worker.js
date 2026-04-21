import { PCA } from 'ml-pca';

self.onmessage = ({ data }) => {
  const { rawData, standardize, selectedCols } = data;

  try {
    if (rawData.length === 0 || selectedCols.length < 2) return null;

    // only keep selected columns
    let X_raw = rawData.map(row => selectedCols.map(col => row[col] || 0));
    const pca = new PCA(X_raw, { scale: standardize });
   
    self.postMessage({
      eigenvalues: pca.getEigenvalues(),
      loadings: pca.getEigenvectors().to2DArray(),
      scores: pca.predict(X_raw).to2DArray(),
      explainedVar: pca.getExplainedVariance(),
      pcNames: pca.getEigenvalues().map((_, i) => `PC${i + 1}`)
    });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};