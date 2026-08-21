import { createNoteFreeApiClient } from '@/lib/noteFree/apiClient';

const client = createNoteFreeApiClient('/api/ps');

export const analyzePdfRequest = client.analyzePdfRequest;
export const generateRepliesRequest = client.generateRepliesRequest;
export const clearPdfSessionRequest = client.clearPdfSessionRequest;
