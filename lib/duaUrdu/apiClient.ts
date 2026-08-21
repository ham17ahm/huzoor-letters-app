import { createNoteFreeApiClient } from '@/lib/noteFree/apiClient';

const client = createNoteFreeApiClient('/api/dua-urdu');

export const analyzePdfRequest = client.analyzePdfRequest;
export const generateRepliesRequest = client.generateRepliesRequest;
export const clearPdfSessionRequest = client.clearPdfSessionRequest;
