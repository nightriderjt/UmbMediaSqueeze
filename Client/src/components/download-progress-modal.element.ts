import { UmbModalBaseElement } from '@umbraco-cms/backoffice/modal';
import { UMB_NOTIFICATION_CONTEXT } from '@umbraco-cms/backoffice/notification';
import { css, html, customElement, state } from '@umbraco-cms/backoffice/external/lit';
import type { DownloadProgressModalData, DownloadProgressModalValue } from './modal-token.js';
import { UMB_AUTH_CONTEXT, UmbAuthContext } from '@umbraco-cms/backoffice/auth';

interface CompressionStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  downloadUrl?: string;
  error?: string;
  currentFile?:string;
}

interface CompressionLevelOption {
  value: string;
  label: string;
}

@customElement('umb-media-squeeze-download-progress-modal')
export class UmbMediaSqueezeDownloadProgressModalElement extends UmbModalBaseElement<DownloadProgressModalData, DownloadProgressModalValue> {
  @state()
  private _jobId?: string;

  @state()
  private _status: CompressionStatus = {
    jobId: '',
    status: 'queued',
    progress: 0,
    message: '',
    currentFile: ''
  };

  @state()
  private _pollingInterval?: number;

  @state()
  private _isDownloading = false;

  @state()
  private _selectedCompressionLevel = '3'; // CompressionLevel.SmallestSize

  @state()
  private _hasStarted = false;

  private _notificationContext?: any;
  #authContext?: UmbAuthContext;

  // System.IO.Compression.CompressionLevel enum values:
  // Optimal = 0, Fastest = 1, NoCompression = 2, SmallestSize = 3
  private _compressionLevels: CompressionLevelOption[] = [
    { value: '3', label: this.localize.term('umbMediaSqueeze_compression_level_smallest') },
    { value: '0', label: this.localize.term('umbMediaSqueeze_compression_level_optimal') },
    { value: '1', label: this.localize.term('umbMediaSqueeze_compression_level_fastest') },
    { value: '2', label: this.localize.term('umbMediaSqueeze_compression_level_none') }
  ];

  constructor() {
    super();
    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (context) => {
      this._notificationContext = context;
    });
    this.consumeContext(UMB_AUTH_CONTEXT, (authContext) => {
      this.#authContext = authContext;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopPolling();
  }

  private async _startCompression() {
    if (!this.data?.mediaGuids) {
      this._showError('No media selected');
      return;
    }

    this._hasStarted = true;

    try {
      const token = await this.#authContext?.getLatestToken();
      const postData={ 
        MediaGuids: this.data.mediaGuids,
        CompressionLevel:Number.parseInt( this._selectedCompressionLevel, 10)
      };
      const response = await fetch('/umbraco/management/api/v1/umbmediasqueeze/squeeze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`         
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this._jobId = data.jobId;
      this._status = {
        jobId: data.jobId,
        status: 'queued',
        progress: 0,
        message: this.localize.term('umbMediaSqueeze_queued')
      };

      this._startPolling();
    } catch (error: any) {
      this._showError(error.message || 'Failed to start compression');
    }
  }

  private _startPolling() {
    this._stopPolling();
    this._pollingInterval = window.setInterval(() => this._checkStatus(), 100);
  }

  private _stopPolling() {
    if (this._pollingInterval) {
      window.clearInterval(this._pollingInterval);
      this._pollingInterval = undefined;
    }
  }

  private async _checkStatus() {
    if (!this._jobId) return;

    try {
      const token = await this.#authContext?.getLatestToken();
      const response = await fetch(`/umbraco/management/api/v1/umbmediasqueeze/${this._jobId}/status`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`   
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this._status = {
        jobId: data.jobId,
        status: data.status,
        progress: data.progress || 0,
        message: data.message || '',
        downloadUrl: data.downloadUrl,
        error: data.error,
        currentFile: data.currentFile || ''
      };

      if (data.status === 'completed' || data.status === 'failed') {
        this._stopPolling();  
      }
    } catch (error: any) {
      console.error('Error checking status:', error);
    }
  }

  private async _downloadFile() {
    if (!this._status.downloadUrl || this._isDownloading) return;

    this._isDownloading = true;
    
    try {
      // Create a hidden anchor element to trigger download
      const anchor = document.createElement('a');
      anchor.target = '_blank';
      anchor.href = this._status.downloadUrl;
      anchor.download = `media-${this.data?.mediaGuids[0]}.zip`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Show success notification
      this._notificationContext?.peek('positive', {
        data: {
          headline: this.localize.term('umbMediaSqueeze_downloadReady'),
          message: ''
        }
      });

      // Update modal value to indicate download completed
      this.updateValue({ downloaded: true });
      
      // Close modal after download starts
      setTimeout(() => this.modalContext?.submit(), 1000);
    } catch (error) {
      console.error('Download failed:', error);
      this._showError('Download failed');
    } finally {
      this._isDownloading = false;
    }
  }

  private _showError(message: string) {
    const localizedError = this.localize.term('umbMediaSqueeze_error_failed', message);
    this._notificationContext?.peek('danger', {
      data: {
        headline: localizedError,
        message: ''
      }
    });
    this.modalContext?.submit();
  }

  private _cancelCompression() {
    this._stopPolling();
    this.modalContext?.submit();
  }

  private _onCompressionLevelChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this._selectedCompressionLevel = select.value;
  }

  render() {
    const progressPercentage = Math.min(100, Math.max(0, this._status.progress));
    const isCompleted = this._status.status === 'completed';
    const isFailed = this._status.status === 'failed';
    const isProcessing = this._status.status === 'processing' || this._status.status === 'queued';

    return html`
      <umb-body-layout headline=${this.localize.term('umbMediaSqueeze_title')}>
      <uui-box>
        <div id="main">
          ${!this._hasStarted ? html`
            <!-- Compression Level Selection -->
            <div class="selection-container">
              <div class="selection-description">
                ${this.localize.term('umbMediaSqueeze_description')}
              </div>
              <div class="form-group">
                <label for="compression-level" class="form-label">
                  ${this.localize.term('umbMediaSqueeze_compression_level_label')}
                </label>
                <select
                  id="compression-level"
                  class="compression-select"
                  @change=${this._onCompressionLevelChange}
                  .value=${this._selectedCompressionLevel}>
                  ${this._compressionLevels.map(level => html`
                    <option value=${level.value} ?selected=${level.value === this._selectedCompressionLevel}>
                      ${level.label}
                    </option>
                  `)}
                </select>
              </div>
              <div class="button-container">
                <uui-button
                  label=${this.localize.term('umbMediaSqueeze_button_start')}
                  @click=${this._startCompression}
                  look="primary"
                  color="positive">
                  ${this.localize.term('umbMediaSqueeze_button_start')}
                </uui-button>
                <uui-button
                  label=${this.localize.term('umbMediaSqueeze_button_cancel')}
                  @click=${() => this.modalContext?.submit()}
                  look="secondary">
                  ${this.localize.term('umbMediaSqueeze_button_cancel')}
                </uui-button>
              </div>
            </div>
          ` : html`
            <!-- Progress Section -->
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
              </div>
              ${!isProcessing ? html`              
              ` : html`
              <div class="progress-text">
                ${this.localize.term('umbMediaSqueeze_progress', progressPercentage.toString())}              
              </div>`}
            </div>
            
            <div class="status-message">
              ${this._status.message}
            </div>

            ${isFailed && this._status.error ? html`
              <div class="error-message">
                ${this.localize.term('umbMediaSqueeze_error_failed', this._status.error)}
              </div>
            ` : ''}
          `}
        </div>

        </uui-box>   <div slot="actions">
          ${!this._hasStarted ? '' : html`
            ${isProcessing ? html`
              <uui-button
                label=${this.localize.term('umbMediaSqueeze_button_cancel')}
                @click=${this._cancelCompression}
                look="secondary">
                ${this.localize.term('umbMediaSqueeze_button_cancel')}
              </uui-button>
            ` : ''}
            
            ${isCompleted ? html`
              <uui-button
                label=${this.localize.term('umbMediaSqueeze_button_download')}
                @click=${this._downloadFile}
                look="primary"
                ?disabled=${this._isDownloading}>
                ${this._isDownloading ? 'Downloading...' : this.localize.term('umbMediaSqueeze_button_download')}
              </uui-button>
              <uui-button
                label=${this.localize.term('umbMediaSqueeze_button_close')}
                @click=${() => this.modalContext?.submit()}
                look="secondary">
                ${this.localize.term('umbMediaSqueeze_button_close')}
              </uui-button>
            ` : ''}
            
            ${isFailed ? html`
              <uui-button
                label=${this.localize.term('umbMediaSqueeze_button_close')}
                @click=${() => this.modalContext?.submit()}
                look="secondary">
                ${this.localize.term('umbMediaSqueeze_button_close')}
              </uui-button>
            ` : ''}
          `}
        </div>
      </umb-body-layout>    
    `;
  }

  static styles = [
    css`
      :host {
        display: block;
        width: 500px;
        max-width: 90vw;
      }

      #main {
        padding: var(--uui-size-space-5);
      }

      .selection-container {
        display: flex;
        flex-direction: column;
        gap: var(--uui-size-space-5);
      }

      .selection-description {
        text-align: center;
        font-size: var(--uui-size-5);
        color: var(--uui-color-text);
        margin-bottom: var(--uui-size-space-3);
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: var(--uui-size-space-2);
      }

      .form-label {
        font-size: var(--uui-size-5);
        font-weight: 600;
        color: var(--uui-color-text);
      }

      .compression-select {
        width: 100%;
        padding: var(--uui-size-space-3);
        font-size: var(--uui-size-5);
        border: 1px solid var(--uui-color-border);
        border-radius: var(--uui-border-radius);
        background-color: var(--uui-color-surface);
        color: var(--uui-color-text);
        cursor: pointer;
        appearance: auto;
      }

      .compression-select:focus {
        outline: none;
        border-color: var(--uui-color-focus);
        box-shadow: 0 0 0 2px var(--uui-color-focus-standalone);
      }

      .button-container {
        display: flex;
        justify-content: center;
        gap: var(--uui-size-space-3);
        margin-top: var(--uui-size-space-3);
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
}

declare global {
  interface HTMLElementTagNameMap {
    'umb-media-squeeze-download-progress-modal': UmbMediaSqueezeDownloadProgressModalElement;
  }
}

export default UmbMediaSqueezeDownloadProgressModalElement;
