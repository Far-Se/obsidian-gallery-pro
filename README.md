*(made entirely by Claude, even the README)*

# Media Gallery Pro Plugin for Obsidian

A powerful media gallery plugin for Obsidian that displays images and videos from specified folders in an interactive grid layout with a full-featured lightbox viewer.
## Example Gallery

<table>
  <tr>
    <td style="width:50%; text-align:center;">
      <img src="https://github.com/user-attachments/assets/ebbd5468-0d15-4115-8f3d-d63b0e5dd3de" alt="Image 1" style="max-width:100%; height:auto;" />
    </td>
    <td style="width:50%; text-align:center;">
      <img src="https://github.com/user-attachments/assets/f464e0f1-a5c2-4ba2-b42a-696f2e4ea048" alt="Image 2" style="max-width:100%; height:auto;" />
    </td>
  </tr>
</table>


## Features

- **Grid Gallery View**: Displays media files in a responsive grid layout with hover effects
- **Full-Screen Lightbox**: Opens media in an immersive full-screen viewer with navigation controls
- **Advanced Zoom & Pan**: Left-click to zoom in, right-click to zoom out, with intuitive mouse-based panning that slows down at higher zoom levels
- **Multiple Navigation Methods**: 
  - Arrow buttons for sequential browsing
  - Keyboard shortcuts (Arrow Left/Right, Escape)
  - Mouse wheel scrolling to change images
  - Clickable thumbnail strip at the bottom
- **Random Mode**: Toggle random image selection for varied viewing
- **Auto Slideshow**: Configurable automatic slideshow with customizable interval (1-60 seconds)
- **Multi-Format Support**: Handles images (JPG, PNG, GIF, BMP, SVG, WebP) and videos (MP4, WebM, OGV, MOV)
- **Flexible File Sources**: Load media from single folders, multiple paths, or entire vault
- **Sorting Options**: Sort by date (ascending/descending), name, or random order

## Usage

Add a code block with the `gallery-pro` identifier in any Obsidian note:

### Basic Syntax
```gallery-pro
path/to/folder
```
or:

```gallery-pro
paths: path/to/folder,path/to/other/folder,another/folder
sort: date-desc
```

### Options

#### `paths:`
Specifies which folders to load media from:
- **Single folder**: `paths: Images/Vacation`
- **Multiple folders**: `paths: Photos/2024, Videos/Travel, Screenshots`
- **Entire vault**: `paths: ./` (loads all media recursively from root)

#### `sort:`
Determines the display order of media files:
- `date-desc` - Newest first (default)
- `date-asc` - Oldest first
- `name-asc` - Alphabetical order
- `random` - Randomized order

### Examples

**Display all images from a specific folder:**
```gallery-pro
paths: Assets/Photos
sort: name-asc
```

**Multiple folders with random sorting:**
```gallery-pro
paths: Travel/Europe, Travel/Asia, Travel/America
sort: random
```

**All media in vault, newest first:**
```gallery-pro
paths: ./
sort: date-desc
```

## Lightbox Controls

### Zoom & Pan
- **Mouse Wheel**: Zoom in or out if you hover the image
- **Left Click**: Zoom in (+1 zoom level)
- **Right Click**: Zoom out (-1 zoom level)
- **Mouse Movement** (when zoomed): Pan the image by moving the mouse - the image follows cursor position with adaptive sensitivity that slows at higher zoom levels

### Navigation
- **Arrow Buttons**: Previous/next media
- **Keyboard**: ← and → arrow keys, Escape to close
- **Mouse Wheel**: Scroll up/down to change images if you do not hover a image
- **Thumbnails**: Click any thumbnail in the bottom strip

### Special Features
- **Random Button**: Toggle random selection mode (button turns blue when active)
- **Slideshow**: Set interval in seconds (1-60) and click "Slideshow" to start automatic playback
- **File Link**: Click the filename to reveal the file in system explorer

## Installation

### Manual Installation

This plugin is not yet available in the Obsidian Community Plugin store and requires manual installation.

1. **Download the Plugin**
   - Go to the GitHub repository for this plugin
   - Click the green **"Code"** button at the top of the repository
   - Select **"Download ZIP"** from the dropdown menu
   - Save the ZIP file to your computer

2. **Locate Your Vault's Plugin Folder**
   - Navigate to your vault's root directory on your file system
   - Open the `.obsidian` folder (if hidden files aren't visible, enable them in your system settings, **or type in Address `/.obsidian/`**)
   - If a `plugins` folder doesn't exist inside `.obsidian`, create it

3. **Extract the Plugin**
   - Extract the downloaded ZIP file
   - **IMPORTANT**: Check the extracted folder structure. Sometimes ZIP files create a double folder structure like `obsidian-gallery-pro/obsidian-gallery-pro/main.js`
   - If this happens, you need to move the inner folder (the one containing `main.js` and `manifest.json`) to avoid the double nesting

4. **Install the Plugin Folder**
   - Move or copy the plugin folder (containing `main.js` and `manifest.json`) into `<your-vault>/.obsidian/plugins/`
   - Rename the folder to `media-gallery-pro` if it has a different name
   
   Your final directory structure should look like this:
   ```
   YourVault/
   └── .obsidian/
       └── plugins/
           └── media-gallery-pro/
               ├── main.js
               ├── manifest.json
               └── (other plugin files)
    ```
   
   **NOT** like this (double folder):
   ```
   YourVault/
   └── .obsidian/
       └── plugins/
           └── media-gallery-pro/
               └── media-gallery-pro/
                   ├── main.js
                   └── manifest.json
    ```

5. **Enable the Plugin**
   - Open Obsidian and go to **Settings** → **Community plugins**
   - Disable **Restricted mode** if it's enabled (click "Turn on community plugins")
   - Find "Media Gallery Pro" in the **Installed plugins** list
   - Toggle the switch to enable the plugin
  
6. **Reload Obsidian** (if necessary)
   - If the plugin doesn't appear, click the refresh icon (🔄) next to "Installed plugins"
   - Or press `Ctrl/Cmd + R` or restart Obsidian to ensure the plugin loads properly
 

## Supported File Formats

**Images**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.svg`, `.webp`

**Videos**: `.mp4`, `.webm`, `.ogv`, `.mov`

## Notes

- Video files display with standard HTML5 controls (play, pause, volume) in the lightbox
- The plugin recursively searches subdirectories when using `./` as the path
- Zoom and pan work only on images, not videos
- The thumbnail strip automatically scrolls to keep the active image centered

## Troubleshooting

**Gallery not displaying:**
- Verify the folder path exists in your vault
- Check that media files have supported extensions
- Ensure the code block uses exactly `gallery-pro` as the identifier

**Plugin not appearing in settings:**
- Confirm files are in the correct directory structure
- Check that both `main.js` and `manifest.json` are present
- Try restarting Obsidian completely

**Images won't zoom:**
- Zoom only works in the lightbox viewer, not the grid view
- Ensure images are fully loaded before attempting to zoom

## License

This project is licensed under the [MIT License](./LICENSE).

## Support

For bugs, feature requests, or questions, please open an issue on the GitHub repository.
