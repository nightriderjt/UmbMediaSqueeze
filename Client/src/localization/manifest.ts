export const manifests : Array<UmbExtensionManifest>= [
  {
    type: "localization",
    alias: "UmbMediaSqueeze.Localization.En",
    name: "UmbMediaSqueeze English Localization",
    meta: {
      culture: "en-US"  
    }, 
    js: () => import("./en.js"),
  },
  {
    type: "localization",
    alias: "UmbMediaSqueeze.Localization.En",
    name: "UmbMediaSqueeze English Localization",
    meta: {
      culture: "en"  
    }, 
    js: () => import("./en.js"),
  },
  {
    type: "localization",
    alias: "UmbMediaSqueeze.Localization.El",
    name: "UmbMediaSqueeze Greek Localization",
    meta: {
      culture: "el-GR"    
    },
    js: () => import("./el.js"),
  },
];
