interface ZipTextFile {
    path: string;
    content: string;
}

const encoder = new TextEncoder();

const crcTable = (() => {
    const table = new Uint32Array(256);

    for (let i = 0; i < 256; i += 1) {
        let value = i;

        for (let j = 0; j < 8; j += 1) {
            value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
        }

        table[i] = value >>> 0;
    }

    return table;
})();

const crc32 = (bytes: Uint8Array) => {
    let crc = 0xffffffff;

    for (let i = 0; i < bytes.length; i += 1) {
        crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }

    return (crc ^ 0xffffffff) >>> 0;
};

const writeUint16 = (bytes: number[], value: number) => {
    bytes.push(value & 0xff, (value >>> 8) & 0xff);
};

const writeUint32 = (bytes: number[], value: number) => {
    bytes.push(
        value & 0xff,
        (value >>> 8) & 0xff,
        (value >>> 16) & 0xff,
        (value >>> 24) & 0xff,
    );
};

const appendBytes = (target: number[], bytes: Uint8Array) => {
    for (let i = 0; i < bytes.length; i += 1) {
        target.push(bytes[i]);
    }
};

export const createZipBlob = (files: ZipTextFile[]) => {
    const output: number[] = [];
    const centralDirectory: number[] = [];

    files.forEach(file => {
        const filenameBytes = encoder.encode(file.path);
        const contentBytes = encoder.encode(file.content);
        const checksum = crc32(contentBytes);
        const localHeaderOffset = output.length;

        writeUint32(output, 0x04034b50);
        writeUint16(output, 20);
        writeUint16(output, 0x0800);
        writeUint16(output, 0);
        writeUint16(output, 0);
        writeUint16(output, 0);
        writeUint32(output, checksum);
        writeUint32(output, contentBytes.length);
        writeUint32(output, contentBytes.length);
        writeUint16(output, filenameBytes.length);
        writeUint16(output, 0);
        appendBytes(output, filenameBytes);
        appendBytes(output, contentBytes);

        writeUint32(centralDirectory, 0x02014b50);
        writeUint16(centralDirectory, 20);
        writeUint16(centralDirectory, 20);
        writeUint16(centralDirectory, 0x0800);
        writeUint16(centralDirectory, 0);
        writeUint16(centralDirectory, 0);
        writeUint16(centralDirectory, 0);
        writeUint32(centralDirectory, checksum);
        writeUint32(centralDirectory, contentBytes.length);
        writeUint32(centralDirectory, contentBytes.length);
        writeUint16(centralDirectory, filenameBytes.length);
        writeUint16(centralDirectory, 0);
        writeUint16(centralDirectory, 0);
        writeUint16(centralDirectory, 0);
        writeUint16(centralDirectory, 0);
        writeUint32(centralDirectory, 0);
        writeUint32(centralDirectory, localHeaderOffset);
        appendBytes(centralDirectory, filenameBytes);
    });

    const centralDirectoryOffset = output.length;
    output.push(...centralDirectory);

    writeUint32(output, 0x06054b50);
    writeUint16(output, 0);
    writeUint16(output, 0);
    writeUint16(output, files.length);
    writeUint16(output, files.length);
    writeUint32(output, centralDirectory.length);
    writeUint32(output, centralDirectoryOffset);
    writeUint16(output, 0);

    return new Blob([new Uint8Array(output)], { type: 'application/zip' });
};
