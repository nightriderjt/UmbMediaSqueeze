import { UmbEntityActionBase as a } from "@umbraco-cms/backoffice/entity-action";
import { UMB_MODAL_MANAGER_CONTEXT as n } from "@umbraco-cms/backoffice/modal";
import { U as l } from "./bundle.manifests-Dnibg1Gr.js";
class m extends a {
  constructor(o, e) {
    super(o, e);
  }
  async execute() {
    const o = await this.getContext(n);
    if (!o) {
      console.error("Modal manager not available");
      return;
    }
    const e = this.args.unique;
    if (!e) {
      console.error("No media selected");
      return;
    }
    o.open(this, l, {
      data: {
        mediaGuid: e
      }
    })?.onSubmit().then((t) => {
      t?.downloaded && console.log("Download completed successfully");
    }).catch(() => {
      console.log("Download modal closed");
    });
  }
}
export {
  m as default
};
//# sourceMappingURL=download-media-folder.action-BoePfbHL.js.map
