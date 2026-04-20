import { UMB_DOWNLOAD_PROGRESS_MODAL } from './modal-token.js';

export const manifests = [
  {
    type: 'modal',
    alias: 'Umb.Modal.MediaSqueeze.DownloadProgress',
    name: 'Media Squeeze Download Progress Modal',
    element: () => import('./download-progress-modal.element.js')  ,
    token: UMB_DOWNLOAD_PROGRESS_MODAL
  }
];
