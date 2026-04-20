![UmbMediaSqueeze Logo](Client/public/assets/umbMediaSqueezeLogo.png)

# UmbMediaSqueeze

A lightweight Umbraco extension that allows backoffice users to select media folder and download it's contents as a single, compressed ZIP file.

## Basic Functionality

UmbMediaSqueeze provides a simple  way to download entire media folders from the Umbraco backoffice. The extension adds a "Download Folder" action to media folders in the media tree, enabling users to compress and download folder contents with ease.

### Key Features

1. **Folder Compression**: Select any media folder in the Umbraco media tree and download its entire contents as a ZIP file
2. **Hierarchy Preservation**: Maintains the folder structure within the ZIP archive - all files are placed inside the top-level folder with subfolders preserved
3. **Compression Statistics**: Includes a `compression-info.txt` file in each download with:
   - Total number of files compressed
   - Total uncompressed size (initial file sizes)
   - Total compressed size (ZIP file size)
   - Compression date and time
   - Compression ratio
4. **Progress Tracking**: Real-time progress indication during compression with status updates
5. **Background Processing**: Compression happens asynchronously in the background, allowing users to continue working while files are being prepared

### How It Works

1. **Initiate**: Select the "Download Folder" action from the context menu
2. **Compress**: A modal appears showing compression progress
3. **Download**: Once complete, download the ZIP file containing all folder contents

### Technical Details

- **File Collection**: Recursively traverses media folders to collect all files
- **Temp File Management**: Creates temporary files in Umbraco's temp directory for processing
- **Security**: Requires backoffice authentication and media tree access permissions

### File Structure in ZIP Archives

When you download a media folder named "MyMediaFolder", the resulting ZIP file will contain:
```
MyMediaFolder/
├── compression-info.txt
├── file1.jpg
├── file2.png
├── Subfolder1/
│   ├── file3.pdf
│   └── file4.docx
└── Subfolder2/
    └── file5.txt
```

### Requirements

- Umbraco CMS 17+ (or compatible version)
- Backoffice access with media tree permissions
- Sufficient disk space for temporary file processing

### Installation

1. Install the package via NuGet or manual installation
2. Restart your Umbraco application
3. The "Download Folder" action will automatically appear in media folder context menus

### Use Cases

- **Content Migration**: Quickly download media assets for migration to another environment
- **Backup**: Create backups of specific media folders
- **Sharing**: Compress and share media collections with team members or clients
- **Archiving**: Archive old media content while preserving folder structure