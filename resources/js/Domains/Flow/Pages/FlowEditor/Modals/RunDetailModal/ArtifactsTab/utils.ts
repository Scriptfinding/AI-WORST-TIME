const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];

export function encodeArtifactPath(name: string): string {
    return name.split('/').map(encodeURIComponent).join('/');
}

export function getArtifactUrl(baseUrl: string, name: string): string {
    return `${baseUrl}/${encodeArtifactPath(name)}`;
}

export function getBasename(path: string): string {
    const parts = path.split('/');
    return parts[parts.length - 1];
}

export function getDirname(path: string): string {
    const index = path.lastIndexOf('/');
    return index === -1 ? '' : path.substring(0, index);
}

export function isImageFile(name: string): boolean {
    const extension = name.split('.').pop()?.toLowerCase() ?? '';
    return IMAGE_EXTENSIONS.includes(extension);
}

export function getFileIcon(name: string): string {
    const extension = name.split('.').pop()?.toLowerCase() ?? '';

    if (IMAGE_EXTENSIONS.includes(extension)) return 'lucide:image';
    if (extension === 'pdf') return 'lucide:file-text';
    if (['zip', 'gz', 'tar', 'rar', '7z'].includes(extension)) return 'lucide:archive';
    if (['csv', 'xls', 'xlsx'].includes(extension)) return 'lucide:table';
    if (['json', 'xml', 'yaml', 'yml'].includes(extension)) return 'lucide:file-code';

    return 'lucide:file';
}
