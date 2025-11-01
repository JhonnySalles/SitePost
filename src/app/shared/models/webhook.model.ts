import { PlatformType } from './social-platforms.model';

export interface WebhookProgressDTO {
  type: 'progress';
  postId: number;
  platform: PlatformType;
  status: 'success' | 'failed';
  error: string | null;
}

export interface WebhookSummaryFailedPlatformDTO {
  platform: PlatformType;
  reason: string;
}

export interface WebhookSummaryDTO {
  type: 'summary';
  postId: number;
  status: 'completed';
  summary: {
    successful: PlatformType[];
    failed: WebhookSummaryFailedPlatformDTO[];
  };
}

export type WebhookPayloadDTO = WebhookProgressDTO | WebhookSummaryDTO;

// -----------------------------------------------------------------------------------
export enum PostUpdateStatus {
  Success = 'SUCCESS',
  Failed = 'FAILED',
  Completed = 'COMPLETED',
}

export interface PostProgressUpdate {
  type: 'progress';
  postId: number;
  platform: PlatformType;
  status: PostUpdateStatus.Success | PostUpdateStatus.Failed;
  error?: string | null;
}

export interface FailedPlatformDetail {
  platform: PlatformType;
  reason: string;
}

export interface PostSummaryUpdate {
  type: 'summary';
  postId: number;
  status: PostUpdateStatus.Completed;
  successfulPlatforms: PlatformType[];
  failedPlatforms: FailedPlatformDetail[];
}

export type PostUpdate = PostProgressUpdate | PostSummaryUpdate;

export function toUpdate(payload: WebhookPayloadDTO): PostProgressUpdate | PostSummaryUpdate {
  if (payload.type === 'progress') {
    return {
      type: 'progress',
      postId: payload.postId,
      platform: payload.platform,
      status: payload.status === 'success' ? PostUpdateStatus.Success : PostUpdateStatus.Failed,
      error: payload.error,
    };
  } else {
    return {
      type: 'summary',
      postId: payload.postId,
      status: PostUpdateStatus.Completed,
      successfulPlatforms: payload.summary.successful,
      failedPlatforms: payload.summary.failed.map((f) => ({
        platform: f.platform,
        reason: f.reason,
      })),
    };
  }
}
