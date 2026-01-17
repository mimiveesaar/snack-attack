export async function copyToClipboard(text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    }
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }

  // Fallback: create temporary textarea for manual copy
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
