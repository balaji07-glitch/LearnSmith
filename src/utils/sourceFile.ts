export type SourceFilePayload =
  | { name: string; type: 'pdf'; fileBase64: string }
  | { name: string; type: 'text'; rawText: string };

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('The selected file could not be read.'));
        return;
      }
      resolve(reader.result);
    };
    reader.onerror = () => reject(new Error('The selected file could not be read.'));
    reader.readAsDataURL(file);
  });
}

export async function readSourceFile(file: File): Promise<SourceFilePayload> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const signature = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const hasPdfSignature = new TextDecoder('ascii').decode(signature).includes('%PDF-');

  if (extension === 'pdf' || file.type === 'application/pdf' || hasPdfSignature) {
    const dataUrl = await readFileAsDataUrl(file);
    const base64Separator = dataUrl.indexOf(',');
    if (base64Separator < 0) throw new Error('The selected PDF could not be encoded for upload.');
    return {
      name: file.name,
      type: 'pdf',
      fileBase64: dataUrl.slice(base64Separator + 1),
    };
  }

  if (extension !== 'txt' && extension !== 'md') {
    throw new Error('Unsupported file type. Please upload a PDF, TXT, or Markdown (.md) file.');
  }

  return {
    name: file.name,
    type: 'text',
    rawText: await file.text(),
  };
}
