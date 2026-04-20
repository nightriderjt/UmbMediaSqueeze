export const manifests: Array<UmbExtensionManifest> = [
  {
    name: "Umb Media Squeeze Entrypoint",
    alias: "UmbMediaSqueeze.Entrypoint",
    type: "backofficeEntryPoint",
    js: () => import("./entrypoint.js"),
  },
];
