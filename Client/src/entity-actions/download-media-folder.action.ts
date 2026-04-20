import { UmbEntityActionBase } from '@umbraco-cms/backoffice/entity-action';
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { UMB_DOWNLOAD_PROGRESS_MODAL } from '../components/modal-token.js';

export default class UmbDownloadMediaFolderEntityAction extends UmbEntityActionBase<never> {
  
  constructor(host: UmbControllerHost, args: any) {
    super(host, args);
  }

  async execute() {
    // Get the modal manager context
    const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
    
    if (!modalManager) {
      console.error('Modal manager not available');
      return;
    }

    // Get the unique identifier of the selected media
    const unique = this.args.unique;
    if (!unique) {
      console.error('No media selected');
      return;
    }

   
    const modalContext = modalManager.open(this, UMB_DOWNLOAD_PROGRESS_MODAL, {
      data: {
        mediaGuid: unique
      }
    });

    // Handle modal result
    modalContext?.onSubmit().then((result) => {
      if (result?.downloaded) {
        console.log('Download completed successfully');
      }
    }).catch(() => {
      // Modal was closed or rejected
      console.log('Download modal closed');
    });
  }
}
