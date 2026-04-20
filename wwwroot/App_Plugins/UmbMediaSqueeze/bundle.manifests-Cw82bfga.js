import { UMB_MEDIA_ENTITY_TYPE as e } from "@umbraco-cms/backoffice/media";
import { UmbModalToken as a } from "@umbraco-cms/backoffice/modal";
const i = [
  {
    name: "Umb Media Squeeze Entrypoint",
    alias: "UmbMediaSqueeze.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-BSlTz4-p.js")
  }
], o = [
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
    alias: "UmbMediaSqueeze.Localization.Uk",
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
], t = [
  {
    type: "entityAction",
    kind: "default",
    alias: "Umb.EntityAction.Media.DownloadMediaFolder",
    name: "Download Media Folder Action",
    weight: 100,
    api: () => import("./download-media-folder.action-4VFTNTQn.js"),
    forEntityTypes: [e],
    meta: {
      icon: "icon-download",
      label: "Download"
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "Umb.Section.Media"
      }
    ]
  }
], n = new a(
  "Umb.Modal.MediaSqueeze.DownloadProgress",
  {
    modal: {
      type: "dialog",
      size: "small"
    }
  }
), l = [
  {
    type: "modal",
    alias: "Umb.Modal.MediaSqueeze.DownloadProgress",
    name: "Media Squeeze Download Progress Modal",
    element: () => import("./download-progress-modal.element-DSCUlEdZ.js"),
    token: n
  }
], d = [
  ...i,
  ...o,
  ...t,
  ...l
];
export {
  n as U,
  d as m
};
//# sourceMappingURL=bundle.manifests-Cw82bfga.js.map
