
import {   UMB_MEDIA_ENTITY_TYPE } from '@umbraco-cms/backoffice/media';



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
      label: '#umbMediaSqueeze_download'
     
    },
    conditions: [
	{alias: "Umb.Condition.SectionAlias",
    match: 'Umb.Section.Media'}
    ]
  }
];