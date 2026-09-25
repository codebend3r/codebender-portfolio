// Side projects carry a source-repo link; client engagements don't. This
// single rule splits the showcase between the Codebender section (side
// projects) and the client-work grid.
export const isSideProjectShowcase = (item: Showcase): boolean => !!item.repo
