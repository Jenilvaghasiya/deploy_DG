// hooks/useNSFWDetection.js
import { useState, useEffect, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as nsfwjs from 'nsfwjs';
import api from '@/api/axios';

export const useNSFWDetection = () => {
  const [model, setModel] = useState(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [modelError, setModelError] = useState(null);
  const [thresholds, setThresholds] = useState({
    Porn: 0.15,
    Hentai: 0.15,
    Sexy: 0.25,
    Combined: 0.4
  });
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);
        await tf.ready();
        const loadedModel = await nsfwjs.load();
        setModel(loadedModel);
        console.log('NSFW model loaded successfully');
      } catch (error) {
        console.error('Failed to load NSFW model:', error);
        setModelError(error.message);
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();

    return () => {
      if (model) {
        tf.dispose();
      }
    };
  }, []);

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const res = await api.get('/nsfw-settings/get'); 

        const data = res.data;
        setThresholds({
          Porn: data.pornThreshold ?? 0.15,
          Hentai: data.hentaiThreshold ?? 0.15,
          Sexy: data.sexyThreshold ?? 0.25,
          Combined: data.combinedThreshold ?? 0.4
        });
      } catch (error) {
        console.error('Failed to fetch thresholds, using defaults:', error);
      }
    };

    fetchThresholds();
  }, []);

  const checkImage = useCallback(async (file) => {
    if (!model) {
      throw new Error('NSFW model not loaded');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = async () => {
        try {
          const predictions = await model.classify(img);
          URL.revokeObjectURL(url);

          let isNSFW = false;
          let reason = null;
          let score = 0;

          for (const pred of predictions) {
            if (thresholds[pred.className] !== undefined && pred.probability > thresholds[pred.className]) {
              isNSFW = true;
              reason = pred.className;
              score = pred.probability;
              break;
            }
          }

          // Combined NSFW score check
          const combinedNSFW = predictions
            .filter(p => ['Porn', 'Hentai', 'Sexy'].includes(p.className))
            .reduce((sum, p) => sum + p.probability, 0);

          if (thresholds.Combined !== undefined && combinedNSFW > thresholds.Combined && !isNSFW) {
            isNSFW = true;
            reason = 'Combined NSFW indicators';
            score = combinedNSFW;
          }

          resolve({
            file,
            isNSFW,
            reason,
            score,
            predictions,
            topCategory: predictions[0],
            combinedNSFW
          });
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.crossOrigin = 'anonymous';
      img.src = url;
    });
  }, [model]);

  return {
    checkImage,
    isModelLoading,
    modelError,
    isReady: !isModelLoading && !modelError && model !== null,
    thresholds
  };
};