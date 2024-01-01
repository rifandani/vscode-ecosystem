export const regionRegex = /#(?:region|Region)|#pragma region|#endregion|#pragma endregion|#End Region/g
export const includedFiles = '**/*.{coffee,fish,pl,perl,ps1,py,sh,yml,yaml,ahk,cshtml,bat,astro,cs,dart,fs,go,java,js,jsx,json,php,rs,svelte,ts,tsx,vue,c,cpp,html,md,xml,vb,css,less,sass,scss}'
export const excludedFiles = '**/{node_modules,bower_components,dev-dist,dist,build,html,coverage,out,.vscode,.vscode-test,.github,_output,.next}/**'

export const commandIds = {
  mark: 'veco.region.mark',
  delete: 'veco.region.delete',
  deleteAll: 'veco.region.deleteAll',
} as const
