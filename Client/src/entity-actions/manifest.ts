import { UMB_ENTITY_HAS_CHILDREN_CONDITION_ALIAS } from '@umbraco-cms/backoffice/entity-action';
import { UMB_MEDIA_ENTITY_TYPE, UMB_MEDIA_TREE_ALIAS } from '@umbraco-cms/backoffice/media';
import { UMB_ENTITY_IS_NOT_TRASHED_CONDITION_ALIAS } from '@umbraco-cms/backoffice/recycle-bin';

export const manifests:Array<UmbExtensionManifest>  = [
  {
    type: 'entityAction',
    kind: 'default',
    alias: 'Umb.EntityAction.Media.DownloadMediaFolder',
    name: 'Download Media Folder Action',
    weight: 100,
    api: () => import ('./download-media-folder.action.js'),
    forEntityTypes:[UMB_MEDIA_ENTITY_TYPE],
    meta: {
      icon: 'icon-download',
      label: 'Download'      ,
      treeAlias: UMB_MEDIA_TREE_ALIAS,
    },
    conditions: [
			{
        alias: UMB_ENTITY_IS_NOT_TRASHED_CONDITION_ALIAS        
			},
      {
        alias:UMB_ENTITY_HAS_CHILDREN_CONDITION_ALIAS     
      }
    ]
  },
];