
import type { UmbControllerHost } from '@umbraco-cms/backoffice/controller-api';
import { UmbEntityBulkActionBase } from '@umbraco-cms/backoffice/entity-bulk-action';
import type { UmbEntityBulkActionArgs } from '@umbraco-cms/backoffice/entity-bulk-action';
import { UMB_MODAL_MANAGER_CONTEXT } from '@umbraco-cms/backoffice/modal';
import { UMB_DOWNLOAD_PROGRESS_MODAL } from '../components/modal-token';


export default class UmbDownloadMediaBulkAction extends UmbEntityBulkActionBase<never> {
  constructor(host: UmbControllerHost, args: UmbEntityBulkActionArgs<never>) {
    super(host, args);
  }

  async execute() {
    // Get the modal manager context
    const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);

    if (!modalManager) {
      console.error('Modal manager not available');
      return;
    }
  

    // Get the current entity (folder) from the collection
    // The collection context provides the entity type and unique identifier
    const selection= this.selection;
    
if(selection.length === 0){
 
  console.error('No media selected');
 

}
else{
  const modalContext = modalManager.open(this, UMB_DOWNLOAD_PROGRESS_MODAL, {
       data: {
         mediaGuids: selection
       }
     });
 
     // Handle modal result
    await modalContext?.onSubmit().then((result) => {
       if (result?.downloaded) {
         console.log('Download completed successfully');
       }
     }).catch(() => {
       // Modal was closed or rejected
       console.log('Download modal closed');
     });
  }


}

}
