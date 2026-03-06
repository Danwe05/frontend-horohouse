import apiClient from '../api';
import { CreatePropertyDto } from '../propertyApi';

export async function createPropertyWithMedia(
  payload: CreatePropertyDto,
  imageFiles: File[] = [],
  videoFiles: File[] = [],
  onImageUploadProgress?: (progressEvent: any) => void,
  onVideoUploadProgress?: (progressEvent: any) => void,
) {
  // Create property first
  const created = await apiClient.createProperty(payload as any);
  const propertyId = (created && (created.id || created._id)) || (created?.property && (created.property.id || created.property._id));
  if (!propertyId) {
    throw new Error('Failed to resolve created property ID');
  }

  // Upload images
  if (imageFiles && imageFiles.length > 0) {
    await apiClient.uploadPropertyImages(propertyId, imageFiles, onImageUploadProgress);
  }

  // Upload videos
  if (videoFiles && videoFiles.length > 0) {
    await apiClient.uploadPropertyVideos(propertyId, videoFiles, onVideoUploadProgress);
  }

  // Return the freshest property state
  const updated = await apiClient.getProperty(propertyId);
  return updated;
}


