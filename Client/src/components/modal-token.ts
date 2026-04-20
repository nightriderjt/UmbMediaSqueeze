import { UmbModalToken } from '@umbraco-cms/backoffice/modal';

export interface DownloadProgressModalData {
  mediaGuid: string;
}

export interface DownloadProgressModalValue {
  downloaded: boolean;
}

export const UMB_DOWNLOAD_PROGRESS_MODAL = new UmbModalToken<DownloadProgressModalData, DownloadProgressModalValue>(
  'Umb.Modal.MediaSqueeze.DownloadProgress',
  {
    modal: {
      type: 'dialog',
      size: 'small'
    }
  }
);