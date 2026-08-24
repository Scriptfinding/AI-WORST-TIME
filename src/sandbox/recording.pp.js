/*
 * This file implements the paid Puppetflow video replay (recording) feature
 * and is licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  const buffer = Buffer.alloc(1024 * 1024);
  const fd = fs.openSync(filePath, 'r');

  try {
    let bytesRead;
    do {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(fd);
  }

  return hash.digest('hex');
}

function isPlausibleMp4(filePath) {
  let fd = null;

  try {
    const fileSize = fs.statSync(filePath).size;
    if (fileSize <= 1024) return false;

    fd = fs.openSync(filePath, 'r');
    const types = new Set();
    let offset = 0;
    let boxes = 0;

    while (offset + 8 <= fileSize && boxes < 10000) {
      const header = Buffer.alloc(16);
      if (fs.readSync(fd, header, 0, 8, offset) !== 8) return false;

      const size32 = header.readUInt32BE(0);
      const type = header.toString('ascii', 4, 8);
      let headerSize = 8;
      let boxSize = size32;

      if (size32 === 1) {
        if (fs.readSync(fd, header, 8, 8, offset + 8) !== 8) return false;
        const extendedSize = header.readBigUInt64BE(8);
        if (extendedSize > BigInt(Number.MAX_SAFE_INTEGER)) return false;
        boxSize = Number(extendedSize);
        headerSize = 16;
      } else if (size32 === 0) {
        boxSize = fileSize - offset;
      }

      if (boxSize < headerSize || offset + boxSize > fileSize) return false;
      if (offset === 0 && type !== 'ftyp') return false;

      types.add(type);
      offset += boxSize;
      boxes++;
    }

    return offset === fileSize
      && types.has('ftyp')
      && types.has('moov')
      && types.has('mdat');
  } catch (_) {
    return false;
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd); } catch (_) {}
    }
  }
}

/**
 * Spawns the ffmpeg encoder that turns CDP screencast frames into an mp4
 * replay. Returns a recorder handle, or null when ffmpeg could not start;
 * every method degrades to a no-op once the underlying process dies.
 */
function startRecording({ recordingPath, completionMarkerPath, width, height }) {
  let ffmpeg = null;
  let closeResult = null;
  let spawnError = null;
  let lastWrittenFrame = null;
  let lastWriteTs = 0;
  let heartbeatTimer = null;
  // CDP screencast only emits frames when the page visually changes, so
  // idle periods (sleeps, waits) would otherwise be missing from the
  // replay: ffmpeg timestamps frames as they arrive on the pipe, and the
  // video would end at the last visual change. Re-feeding the last frame
  // keeps wallclock time flowing so the replay matches the real duration.
  const HEARTBEAT_INTERVAL_MS = 500;
  completionMarkerPath = completionMarkerPath
    || path.join(path.dirname(path.dirname(recordingPath)), '.recording-complete');
  const temporaryPath = recordingPath + '.part';
  const markerTemporaryPath = completionMarkerPath + '.part-' + process.pid;
  let resolveClose;
  const closePromise = new Promise(resolve => {
    resolveClose = resolve;
  });

  try {
    const recDir = path.dirname(recordingPath);
    if (!fs.existsSync(recDir)) {
      fs.mkdirSync(recDir, { recursive: true });
    }
    for (const stalePath of [temporaryPath, recordingPath, completionMarkerPath, markerTemporaryPath]) {
      try { fs.rmSync(stalePath, { force: true }); } catch (_) {}
    }

    // libx264 requires even dimensions.
    const recW = width % 2 === 0 ? width : width - 1;
    const recH = height % 2 === 0 ? height : height - 1;
    const recFilter = 'scale=' + recW + ':' + recH + ':force_original_aspect_ratio=decrease,pad=' + recW + ':' + recH + ':(ow-iw)/2:(oh-ih)/2,setsar=1';
    const ffmpegProc = spawn('ffmpeg', [
      '-y',
      '-use_wallclock_as_timestamps', '1',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-i', '-',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'ultrafast',
      '-vf', recFilter,
      '-movflags', '+faststart',
      '-f', 'mp4',
      temporaryPath,
    ], { stdio: ['pipe', 'ignore', 'pipe'] });
    ffmpegProc.on('error', (err) => {
      console.debug('ffmpeg error: ' + err.message);
      spawnError = err;
    });
    ffmpegProc.on('exit', (code) => {
      if (code && code !== 0) {
        console.debug('ffmpeg exited with code ' + code);
      }
    });
    ffmpegProc.on('close', (code, signal) => {
      closeResult = { code, signal };
      resolveClose(closeResult);
    });
    ffmpegProc.stderr.on('data', () => {});
    ffmpeg = ffmpegProc;

    heartbeatTimer = setInterval(() => {
      if (!lastWrittenFrame || closeResult !== null || spawnError !== null) return;
      if (Date.now() - lastWriteTs < HEARTBEAT_INTERVAL_MS) return;
      if (ffmpegProc.stdin.writable) {
        try {
          ffmpegProc.stdin.write(lastWrittenFrame);
          lastWriteTs = Date.now();
        } catch (_) {}
      }
    }, HEARTBEAT_INTERVAL_MS);
    heartbeatTimer.unref();

    console.debug('Recording enabled: ' + recordingPath);
  } catch (recErr) {
    console.debug('Recording skipped: ' + recErr.message);
    return null;
  }

  return {
    active() {
      return !!ffmpeg && closeResult === null && spawnError === null;
    },

    write(frameBuffer) {
      if (ffmpeg && ffmpeg.stdin.writable) {
        try {
          const isFirstFrame = lastWrittenFrame === null;
          ffmpeg.stdin.write(frameBuffer);
          // ffmpeg's mjpeg parser only emits a frame once the next one
          // arrives, and wallclock timestamps are taken at that moment.
          // Writing the first frame twice anchors the recording start at
          // the correct time instead of the second frame's arrival.
          if (isFirstFrame) {
            ffmpeg.stdin.write(frameBuffer);
          }
          lastWrittenFrame = frameBuffer;
          lastWriteTs = Date.now();
        } catch (_) {}
      }
    },

    /**
     * When no screencast frame was ever captured, grabs a fallback
     * screenshot so the replay is not empty, then lets ffmpeg drain the
     * remaining frames. Returns the last frame to use for the lastshot.
     */
    async captureFallback(page, lastFrame) {
      if (!ffmpeg) return lastFrame;

      if (!lastFrame) {
        try {
          const fallbackShot = await page.screenshot({ type: 'jpeg', quality: 60 });
          lastFrame = fallbackShot;
          this.write(fallbackShot);
          console.debug('Recording fallback frame captured');
        } catch (e) {
          console.debug('Recording fallback frame skipped: ' + e.message);
        }
      }
      await new Promise(r => setTimeout(r, 3000));

      return lastFrame;
    },

    async stop() {
      if (!ffmpeg) return false;

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }

      let finalized = false;
      try {
        if (ffmpeg.stdin.writable) {
          // Emit the last frame one final time so the replay duration
          // extends to the actual end of the run, even if the page was
          // static since the previous frame.
          if (lastWrittenFrame) {
            try { ffmpeg.stdin.write(lastWrittenFrame); } catch (_) {}
          }
          ffmpeg.stdin.end();
        }
        await Promise.race([
          closePromise,
          new Promise(resolve => setTimeout(resolve, 10000)),
        ]);
        if (closeResult === null) {
          try { ffmpeg.kill('SIGKILL'); } catch (_) {}
          await Promise.race([
            closePromise,
            new Promise(resolve => setTimeout(resolve, 1000)),
          ]);
        }

        if (
          closeResult === null
          || closeResult.code !== 0
          || spawnError !== null
          || !isPlausibleMp4(temporaryPath)
        ) {
          throw new Error('ffmpeg did not produce a complete MP4 recording');
        }

        fs.renameSync(temporaryPath, recordingPath);
        const recordingSize = fs.statSync(recordingPath).size;
        fs.writeFileSync(markerTemporaryPath, JSON.stringify({
          size: recordingSize,
          sha256: sha256File(recordingPath),
          completed_at: new Date().toISOString(),
        }));
        fs.renameSync(markerTemporaryPath, completionMarkerPath);
        finalized = true;
      } catch (e) {
        console.warn('Recording finalize error: ' + e.message);
      } finally {
        try { fs.rmSync(temporaryPath, { force: true }); } catch (_) {}
        try { fs.rmSync(markerTemporaryPath, { force: true }); } catch (_) {}
        if (!finalized) {
          try { fs.rmSync(recordingPath, { force: true }); } catch (_) {}
          try { fs.rmSync(completionMarkerPath, { force: true }); } catch (_) {}
        }
      }
      try {
        const recSize = recordingPath && fs.existsSync(recordingPath) ? fs.statSync(recordingPath).size : 0;
        console.debug('Recording finalized: ' + (recSize > 0 ? (recSize + ' bytes') : 'no file'));
      } catch (e) {
        console.debug('Recording finalize check skipped: ' + e.message);
      }

      return finalized;
    },
  };
}

module.exports = { startRecording };
