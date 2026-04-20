import { UMB_ENTITY_HAS_CHILDREN_CONDITION_ALIAS as e } from "@umbraco-cms/backoffice/entity-action";
import { UMB_MEDIA_TREE_ALIAS as a, UMB_MEDIA_ENTITY_TYPE as o } from "@umbraco-cms/backoffice/media";
import { UMB_ENTITY_IS_NOT_TRASHED_CONDITION_ALIAS as i } from "@umbraco-cms/backoffice/recycle-bin";
import { UmbModalToken as t } from "@umbraco-cms/backoffice/modal";
const n = [
  {
    name: "Umb Media Squeeze Entrypoint",
    alias: "UmbMediaSqueeze.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-BSlTz4-p.js")
  }
], l = [
  {
    type: "localization",
    alias: "UmbMediaSqueeze.Localization.En",
    name: "UmbMediaSqueeze English Localization",
    meta: {
      culture: "en-US"
    },
    js: () => import("./en-BYb-TRS_.js")
  },
  {
    type: "localization",
    alias: "UmbMediaSqueeze.Localization.En",
    name: "UmbMediaSqueeze English Localization",
    meta: {
      culture: "en"
    },
    js: () => import("./en-BYb-TRS_.js")
  },
  {
    type: "localization",
    alias: "UmbMediaSqueeze.Localization.El",
    name: "UmbMediaSqueeze Greek Localization",
    meta: {
      culture: "el-GR"
    },
    js: () => import("./el-CizvAClQ.js")
  }
], m = [
  {
    type: "entityAction",
    kind: "default",
    alias: "Umb.EntityAction.Media.DownloadMediaFolder",
    name: "Download Media Folder Action",
    weight: 100,
    api: () => import("./download-media-folder.action-BoePfbHL.js"),
    forEntityTypes: [o],
    meta: {
      icon: "icon-download",
      label: "Download",
      treeAlias: a
    },
    conditions: [
      {
        alias: i
      },
      {
        alias: e
      }
    ]
  }
], s = new t(
  "Umb.Modal.MediaSqueeze.DownloadProgress",
  {
    modal: {
      type: "dialog",
      size: "small"
    }
  }
), d = [
  {
    type: "modal",
    alias: "Umb.Modal.MediaSqueeze.DownloadProgress",
    name: "Media Squeeze Download Progress Modal",
    element: () => import("./download-progress-modal.element-B0UKVoQs.js"),
    token: s
  }
], z = [
  ...n,
  ...l,
  ...m,
  ...d
];
export {
  s as U,
  z as m
};
//# sourceMappingURL=bundle.manifests-Dnibg1Gr.js.map
