import { UMB_MEDIA_ENTITY_TYPE as a } from "@umbraco-cms/backoffice/media";
import { UmbEntityBulkActionBase as i } from "@umbraco-cms/backoffice/entity-bulk-action";
import { UMB_MODAL_MANAGER_CONTEXT as t, UmbModalToken as n } from "@umbraco-cms/backoffice/modal";
const l = [
  {
    name: "Umb Media Squeeze Entrypoint",
    alias: "UmbMediaSqueeze.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint-BSlTz4-p.js")
  }
], s = [
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
], m = [
  {
    type: "entityAction",
    kind: "default",
    alias: "Umb.EntityAction.Media.DownloadMediaFolder",
    name: "Download Media Folder Action",
    weight: 100,
    api: () => import("./download-media-folder.action-B9RkxKwH.js"),
    forEntityTypes: [a],
    meta: {
      icon: "icon-download",
      label: "#umbMediaSqueeze_download"
    },
    conditions: [
      {
        alias: "Umb.Condition.SectionAlias",
        match: "Umb.Section.Media"
      }
    ]
  }
];
class d extends i {
  constructor(o, e) {
    super(o, e);
  }
  async execute() {
    if (!await this.getContext(t)) {
      console.error("Modal manager not available");
      return;
    }
    const e = this.selection;
    if (console.log("Current selection:", e), !e || e.length === 0) {
      console.warn("No folder selected for download");
      return;
    }
  }
}
const c = [
  {
    type: "entityBulkAction",
    alias: "Umb.CollectionAction.Media.DownloadMediaBulk",
    name: "Download Media Collection Action",
    weight: 100,
    api: d,
    meta: {
      label: "#umbMediaSqueeze_download"
    },
    conditions: [
      {
        alias: "Umb.Condition.CollectionAlias",
        match: "Umb.Collection.Media"
      }
    ],
    forEntityTypes: [a]
  }
], r = new n(
  "Umb.Modal.MediaSqueeze.DownloadProgress",
  {
    modal: {
      type: "dialog",
      size: "small"
    }
  }
), M = [
  {
    type: "modal",
    alias: "Umb.Modal.MediaSqueeze.DownloadProgress",
    name: "Media Squeeze Download Progress Modal",
    element: () => import("./download-progress-modal.element-DSCUlEdZ.js"),
    token: r
  }
], z = [
  ...l,
  ...s,
  ...m,
  ...c,
  ...M
];
export {
  r as U,
  z as m
};
//# sourceMappingURL=bundle.manifests-TsonQUyg.js.map
