import { ManifestEntityBulkAction } from '@umbraco-cms/backoffice/extension-registry';


import { UMB_MEDIA_ENTITY_TYPE } from '@umbraco-cms/backoffice/media';


export const manifests: Array<ManifestEntityBulkAction> = [
  {
    type: 'entityBulkAction',
    alias: 'Umb.CollectionAction.Media.DownloadMediaBulk',
    name: 'Download Media Collection Action',
    weight: 100,
    api: () => import ('./download-media-collection.action.js'),
    meta: {
      label: '#umbMediaSqueeze_download',
    },
    conditions: [
      {
        alias: 'Umb.Condition.CollectionAlias',
        match: 'Umb.Collection.Media',
      },
    ],
    forEntityTypes: [UMB_MEDIA_ENTITY_TYPE]
  },
];
