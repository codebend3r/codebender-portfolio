// Optional: tiny helper to ensure webfonts/images are ready
export async function waitForAssets(root: HTMLElement): Promise<void> {
  // Wait for web fonts (Font Loading API); optional chaining keeps it safe where unsupported
  await (document as Document & { fonts?: FontFaceSet }).fonts?.ready

  // Wait for images inside the capture root
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"))
  await Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((res) => {
            const done = () => res()
            img.addEventListener("load", done, { once: true })
            img.addEventListener("error", done, { once: true })
          })
    )
  )
}
