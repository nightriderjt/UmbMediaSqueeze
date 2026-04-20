import { UmbModalBaseElement as _ } from "@umbraco-cms/backoffice/modal";
import { UMB_NOTIFICATION_CONTEXT as g } from "@umbraco-cms/backoffice/notification";
import { html as r, css as b, state as u, customElement as v } from "@umbraco-cms/backoffice/external/lit";
import { UMB_AUTH_CONTEXT as w } from "@umbraco-cms/backoffice/auth";
var z = Object.defineProperty, f = Object.getOwnPropertyDescriptor, m = (e) => {
  throw TypeError(e);
}, l = (e, s, t, o) => {
  for (var i = o > 1 ? void 0 : o ? f(s, t) : s, d = e.length - 1, c; d >= 0; d--)
    (c = e[d]) && (i = (o ? c(s, t, i) : c(i)) || i);
  return o && i && z(s, t, i), i;
}, p = (e, s, t) => s.has(e) || m("Cannot " + t), h = (e, s, t) => (p(e, s, "read from private field"), t ? t.call(e) : s.get(e)), y = (e, s, t) => s.has(e) ? m("Cannot add the same private member more than once") : s instanceof WeakSet ? s.add(e) : s.set(e, t), x = (e, s, t, o) => (p(e, s, "write to private field"), s.set(e, t), t), n;
let a = class extends _ {
  constructor() {
    super(), this._status = {
      jobId: "",
      status: "queued",
      progress: 0,
      message: "",
      currentFile: ""
    }, this._isDownloading = !1, y(this, n), this.consumeContext(g, (e) => {
      this._notificationContext = e;
    }), this.consumeContext(w, (e) => {
      x(this, n, e);
    });
  }
  connectedCallback() {
    super.connectedCallback(), this._startCompression();
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._stopPolling();
  }
  async _startCompression() {
    if (!this.data?.mediaGuid) {
      this._showError("No media selected");
      return;
    }
    try {
      const e = await h(this, n)?.getLatestToken(), s = { MediaGuid: this.data.mediaGuid }, t = await fetch("/umbraco/management/api/v1/umbmediasqueeze/squeeze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${e}`
        },
        body: JSON.stringify(s)
      });
      if (!t.ok)
        throw new Error(`HTTP error! status: ${t.status}`);
      const o = await t.json();
      this._jobId = o.jobId, this._status = {
        jobId: o.jobId,
        status: "queued",
        progress: 0,
        message: this.localize.term("umbMediaSqueeze_queued")
      }, this._startPolling();
    } catch (e) {
      this._showError(e.message || "Failed to start compression");
    }
  }
  _startPolling() {
    this._stopPolling(), this._pollingInterval = window.setInterval(() => this._checkStatus(), 100);
  }
  _stopPolling() {
    this._pollingInterval && (window.clearInterval(this._pollingInterval), this._pollingInterval = void 0);
  }
  async _checkStatus() {
    if (this._jobId)
      try {
        const e = await h(this, n)?.getLatestToken(), s = await fetch(`/umbraco/management/api/v1/umbmediasqueeze/${this._jobId}/status`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${e}`
          }
        });
        if (!s.ok)
          throw new Error(`HTTP error! status: ${s.status}`);
        const t = await s.json();
        this._status = {
          jobId: t.jobId,
          status: t.status,
          progress: t.progress || 0,
          message: t.message || "",
          downloadUrl: t.downloadUrl,
          error: t.error,
          currentFile: t.currentFile || ""
        }, (t.status === "completed" || t.status === "failed") && this._stopPolling();
      } catch (e) {
        console.error("Error checking status:", e);
      }
  }
  async _downloadFile() {
    if (!(!this._status.downloadUrl || this._isDownloading)) {
      this._isDownloading = !0;
      try {
        const e = document.createElement("a");
        e.target = "_blank", e.href = this._status.downloadUrl, e.download = `media-${this.data?.mediaGuid}.zip`, e.style.display = "none", document.body.appendChild(e), e.click(), document.body.removeChild(e), this._notificationContext?.peek("positive", {
          data: {
            headline: this.localize.term("umbMediaSqueeze_downloadReady"),
            message: ""
          }
        }), this.updateValue({ downloaded: !0 }), setTimeout(() => this.modalContext?.submit(), 1e3);
      } catch (e) {
        console.error("Download failed:", e), this._showError("Download failed");
      } finally {
        this._isDownloading = !1;
      }
    }
  }
  _showError(e) {
    const s = this.localize.term("umbMediaSqueeze_error_failed", e);
    this._notificationContext?.peek("danger", {
      data: {
        headline: s,
        message: ""
      }
    }), this.modalContext?.submit();
  }
  _cancelCompression() {
    this._stopPolling(), this.modalContext?.submit();
  }
  render() {
    const e = Math.min(100, Math.max(0, this._status.progress)), s = this._status.status === "completed", t = this._status.status === "failed", o = this._status.status === "processing" || this._status.status === "queued";
    return r`
      <umb-body-layout headline=${this.localize.term("umbMediaSqueeze_title")}>
      <uui-box>
        <div id="main">          
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${e}%"></div>
            </div>
            ${o ? r`
            <div class="progress-text">
              ${this.localize.term("umbMediaSqueeze_progress", e.toString())}              
            </div>` : r`              
            `}
          </div>
          
          <div class="status-message">
            ${this._status.message}
          </div>

          ${t && this._status.error ? r`
            <div class="error-message">
              ${this.localize.term("umbMediaSqueeze_error_failed", this._status.error)}
            </div>
          ` : ""}
        </div>

     
        </uui-box>   <div slot="actions">
          ${o ? r`
            <uui-button
              label=${this.localize.term("umbMediaSqueeze_button_cancel")}
              @click=${this._cancelCompression}
              look="secondary">
              ${this.localize.term("umbMediaSqueeze_button_cancel")}
            </uui-button>
          ` : ""}
          
          ${s ? r`
            <uui-button
              label=${this.localize.term("umbMediaSqueeze_button_download")}
              @click=${this._downloadFile}
              look="primary"
              ?disabled=${this._isDownloading}>
              ${this._isDownloading ? "Downloading..." : this.localize.term("umbMediaSqueeze_button_download")}
            </uui-button>
            <uui-button
              label=${this.localize.term("umbMediaSqueeze_button_close")}
              @click=${() => this.modalContext?.submit()}
              look="secondary">
              ${this.localize.term("umbMediaSqueeze_button_close")}
            </uui-button>
          ` : ""}
          
          ${t ? r`
            <uui-button
              label=${this.localize.term("umbMediaSqueeze_button_close")}
              @click=${() => this.modalContext?.submit()}
              look="secondary">
              ${this.localize.term("umbMediaSqueeze_button_close")}
            </uui-button>
          ` : ""}
        </div>
      </umb-body-layout>    
    `;
  }
};
n = /* @__PURE__ */ new WeakMap();
a.styles = [
  b`
      :host {
        display: block;
        width: 500px;
        max-width: 90vw;
      }

      #main {
        padding: var(--uui-size-space-5);
      }

      .logo-container {
        display: flex;
        justify-content: center;
        margin-bottom: var(--uui-size-space-5);
      }

      .logo {
        max-width: 200px;
        max-height: 80px;
        object-fit: contain;
      }

      .progress-container {
        margin-bottom: var(--uui-size-space-5);
      }

      .progress-bar {
        height: 20px;
        background-color: var(--uui-color-surface-alt);
        border-radius: var(--uui-border-radius);
        overflow: hidden;
        margin-bottom: var(--uui-size-space-2);
      }

      .progress-fill {
        height: 100%;
        background-color: var(--uui-color-positive);
        transition: width 0.3s ease;
      }

      .progress-text {
        text-align: center;
        font-size: var(--uui-size-4);
        color: var(--uui-color-text-alt);
      }

      .status-message {
        text-align: center;
        font-size: var(--uui-size-5);
        margin: var(--uui-size-space-4) 0;
        color: var(--uui-color-text);
      }

      .error-message {
        text-align: center;
        font-size: var(--uui-size-5);
        margin: var(--uui-size-space-4) 0;
        color: white;
        background-color: var(--uui-color-danger-standalone);
        padding: var(--uui-size-space-3);
        border-radius: var(--uui-border-radius);
      }
    `
];
l([
  u()
], a.prototype, "_jobId", 2);
l([
  u()
], a.prototype, "_status", 2);
l([
  u()
], a.prototype, "_pollingInterval", 2);
l([
  u()
], a.prototype, "_isDownloading", 2);
a = l([
  v("umb-media-squeeze-download-progress-modal")
], a);
const q = a;
export {
  a as UmbMediaSqueezeDownloadProgressModalElement,
  q as default
};
//# sourceMappingURL=download-progress-modal.element-DSCUlEdZ.js.map
