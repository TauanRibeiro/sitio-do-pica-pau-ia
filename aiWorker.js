// AI Web Worker for TensorFlow.js inference
let tf = null;
let model = null;

self.onmessage = async function(e) {
  const { type, imageData, templateIndex, templates } = e.data;
  
  switch (type) {
    case 'INIT_AI':
      try {
        // Dynamic import of TensorFlow.js modules
        tf = await import('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js');
        const mobilenet = await import('https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@latest/dist/mobilenet.min.js');
        
        model = await mobilenet.load();
        
        self.postMessage({ type: 'AI_READY' });
      } catch (error) {
        self.postMessage({ type: 'AI_ERROR', error: error.message });
      }
      break;
      
    case 'EXTRACT_EMBEDDING':
      try {
        if (!model || !tf) {
          throw new Error('AI not initialized');
        }
        
        // Create tensor from ImageData
        const tensor = tf.browser.fromPixels(imageData);
        const resized = tf.image.resizeBilinear(tensor, [224, 224]);
        const normalized = resized.toFloat().div(127).sub(1);
        
        // Extract embedding
        const embedding = model.infer(normalized, 'conv_preds');
        const embeddingData = await embedding.data();
        
        // Calculate norm for cosine similarity
        let norm = 0;
        for (let i = 0; i < embeddingData.length; i++) {
          norm += embeddingData[i] * embeddingData[i];
        }
        norm = Math.sqrt(norm);
        
        // Cleanup tensors
        tensor.dispose();
        resized.dispose();
        normalized.dispose();
        embedding.dispose();
        
        self.postMessage({
          type: 'EMBEDDING_READY',
          embedding: Array.from(embeddingData),
          norm: norm,
          templateIndex: templateIndex
        });
        
      } catch (error) {
        self.postMessage({ type: 'EMBEDDING_ERROR', error: error.message });
      }
      break;

    case 'COMPARE_SIMILARITY':
      try {
        if (!model || !tf) {
          throw new Error('AI not initialized');
        }

        // Extract embedding from current frame
        const tensor = tf.browser.fromPixels(imageData);
        const resized = tf.image.resizeBilinear(tensor, [224, 224]);
        const normalized = resized.toFloat().div(127).sub(1);
        
        const embedding = model.infer(normalized, 'conv_preds');
        const currentEmbedding = await embedding.data();
        
        // Calculate current embedding norm
        let currentNorm = 0;
        for (let i = 0; i < currentEmbedding.length; i++) {
          currentNorm += currentEmbedding[i] * currentEmbedding[i];
        }
        currentNorm = Math.sqrt(currentNorm);

        // Compare with all templates
        const matches = [];
        templates.forEach((template, idx) => {
          if (!template.embedding || !template.embeddingNorm) return;
          
          let dotProduct = 0;
          for (let i = 0; i < currentEmbedding.length; i++) {
            dotProduct += currentEmbedding[i] * template.embedding[i];
          }
          
          const similarity = dotProduct / (currentNorm * template.embeddingNorm);
          
          if (similarity > 0.92) {
            matches.push({ index: idx, similarity });
          }
        });

        // Cleanup tensors
        tensor.dispose();
        resized.dispose();
        normalized.dispose();
        embedding.dispose();
        
        self.postMessage({
          type: 'SIMILARITY_READY',
          matches: matches
        });
        
      } catch (error) {
        self.postMessage({ type: 'SIMILARITY_ERROR', error: error.message });
      }
      break;
      
    case 'CALCULATE_SIMILARITY':
      try {
        const { data } = e.data;
        const { embedding1, norm1, embedding2, norm2 } = data;
        
        let dotProduct = 0;
        for (let i = 0; i < embedding1.length; i++) {
          dotProduct += embedding1[i] * embedding2[i];
        }
        
        const similarity = dotProduct / (norm1 * norm2);
        
        self.postMessage({
          type: 'SIMILARITY_READY',
          similarity: similarity
        });
        
      } catch (error) {
        self.postMessage({ type: 'SIMILARITY_ERROR', error: error.message });
      }
      break;
      
    default:
      self.postMessage({ type: 'UNKNOWN_MESSAGE', receivedType: type });
  }
};
