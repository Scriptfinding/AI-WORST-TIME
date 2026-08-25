// This file is read as a string by run.js and injected into the eval context.
// It is NOT a Node.js module. Do NOT require() this file.
// The guard activates only when SANDBOX_USER_ROOT env var is set.

(function _runGuard() {
    var _userRoot = process.env.SANDBOX_USER_ROOT;
    if (!_userRoot) return;

    var _path = require("path");
    var _fileURLToPath = require("url").fileURLToPath;
    var _nativeFs = require("fs");
    var _nativeRealpath = (_nativeFs.realpathSync.native || _nativeFs.realpathSync).bind(_nativeFs.realpathSync);
    var _sep = _path.sep;
    var _resolvedUserRoot = _path.resolve(_userRoot);
    var _resolvedNodeModules = process.env.SANDBOX_NODE_MODULES_PATH
        ? _path.resolve(process.env.SANDBOX_NODE_MODULES_PATH)
        : null;
    var _resolvedChromeProfile = process.env.SANDBOX_CHROME_PROFILE_PATH
        ? _path.resolve(process.env.SANDBOX_CHROME_PROFILE_PATH)
        : null;
    delete process.env.SANDBOX_CHROME_PROFILE_PATH;

    function _isInside(targetPath, rootPath) {
        return targetPath === rootPath || targetPath.startsWith(rootPath + _sep);
    }

    function _realTarget(targetPath, isWrite) {
        var normalized = targetPath && typeof targetPath === "object" && targetPath.protocol === "file:"
            ? _fileURLToPath(targetPath)
            : String(targetPath);
        var resolved = _path.resolve(normalized);
        try {
            return _nativeRealpath(resolved);
        } catch (_) {
            if (!isWrite) return resolved;
        }

        var parent = _path.dirname(resolved);
        while (parent !== _path.dirname(parent)) {
            try {
                return _path.join(_nativeRealpath(parent), _path.relative(parent, resolved));
            } catch (_) {
                parent = _path.dirname(parent);
            }
        }
        return resolved;
    }

    function _isAllowed(targetPath, isWrite) {
        if (targetPath == null) return true;
        var resolved = _realTarget(targetPath, isWrite);
        var userRoot = _realTarget(_resolvedUserRoot, false);
        if (_isInside(resolved, userRoot)) return true;
        if (isWrite && _resolvedChromeProfile
            && _isInside(resolved, _realTarget(_resolvedChromeProfile, false))) {
            return true;
        }
        if (!isWrite && _resolvedNodeModules) {
            if (_isInside(resolved, _realTarget(_resolvedNodeModules, false))) return true;
        }
        return false;
    }

    function _deny(operation, targetPath) {
        throw new Error("Sandbox violation (" + operation + "): access denied - " + _path.resolve(String(targetPath)));
    }

    // Patch require("fs")

    var _fs = _nativeFs;

    function _patchSingle(obj, name, isWrite) {
        if (typeof obj[name] !== "function") return;
        var _orig = obj[name];
        obj[name] = function() {
            if (!_isAllowed(arguments[0], isWrite)) _deny(name, arguments[0]);
            return _orig.apply(obj, arguments);
        };
    }

    function _patchDual(obj, name) {
        if (typeof obj[name] !== "function") return;
        var _orig = obj[name];
        obj[name] = function() {
            if (!_isAllowed(arguments[0], false)) _deny(name + ":src", arguments[0]);
            if (!_isAllowed(arguments[1], true)) _deny(name + ":dst", arguments[1]);
            return _orig.apply(obj, arguments);
        };
    }

    var _readOps = [
        "readFileSync", "readFile",
        "existsSync",
        "statSync", "stat",
        "readdirSync", "readdir",
        "accessSync", "access",
        "lstatSync", "lstat",
        "realpathSync", "realpath",
        "openSync", "open",
        "createReadStream",
        "readlinkSync", "readlink",
        "watch", "watchFile",
        "opendirSync", "opendir",
        "statfsSync", "statfs",
        "globSync", "glob",
        "openAsBlob"
    ];

    var _writeOps = [
        "writeFileSync", "writeFile",
        "appendFileSync", "appendFile",
        "mkdirSync", "mkdir",
        "unlinkSync", "unlink",
        "rmdirSync", "rmdir",
        "rmSync", "rm",
        "chmodSync", "chmod",
        "chownSync", "chown",
        "createWriteStream",
        "truncateSync", "truncate",
        "utimesSync", "utimes",
        "lutimesSync", "lutimes",
        "mkdtempSync", "mkdtemp"
    ];

    var _dualOps = [
        "renameSync", "rename",
        "copyFileSync", "copyFile",
        "cpSync", "cp",
        "linkSync", "link",
        "symlinkSync", "symlink"
    ];

    _readOps.forEach(function(m) { _patchSingle(_fs, m, false); });
    _writeOps.forEach(function(m) { _patchSingle(_fs, m, true); });
    _dualOps.forEach(function(m) { _patchDual(_fs, m); });

    if (_fs.promises) {
        ["readFile", "stat", "readdir", "access", "lstat", "realpath", "open", "opendir", "statfs", "glob"]
            .forEach(function(m) { _patchSingle(_fs.promises, m, false); });
        ["writeFile", "appendFile", "mkdir", "unlink", "rmdir", "rm", "chmod", "chown", "truncate", "utimes", "lutimes", "mkdtemp"]
            .forEach(function(m) { _patchSingle(_fs.promises, m, true); });
        ["rename", "copyFile", "cp", "link", "symlink"]
            .forEach(function(m) { _patchDual(_fs.promises, m); });
    }

    // Patch require("child_process")

    var _cp = require("child_process");
    function _extractBin(cmd) {
        var s = String(cmd).trim();
        var spaceIdx = s.indexOf(" ");
        var binPath = spaceIdx === -1 ? s : s.substring(0, spaceIdx);
        var slashIdx = binPath.lastIndexOf("/");
        return slashIdx === -1 ? binPath : binPath.substring(slashIdx + 1);
    }

    ["exec", "execSync"].forEach(function(m) {
        _cp[m] = function() { throw new Error("Sandbox: " + m + " not allowed"); };
    });

    var _origSpawn = _cp.spawn;
    _cp.spawn = function(cmd, args, options) {
        var bin = _extractBin(cmd);
        var validUnzip = bin === "unzip"
            && Array.isArray(args)
            && args.length === 4
            && args[0] === "-o"
            && args[2] === "-d"
            && _isAllowed(args[1], false)
            && _isAllowed(args[3], true)
            && (!options || (options.shell !== true && options.detached !== true));
        if (!validUnzip) throw new Error("Sandbox: spawn not allowed");
        return _origSpawn.apply(_cp, arguments);
    };
    _cp.spawnSync = function() { throw new Error("Sandbox: spawnSync not allowed"); };

    _cp.fork = function() { throw new Error("Sandbox: fork not allowed"); };
    _cp.execFile = function() { throw new Error("Sandbox: execFile not allowed"); };
    _cp.execFileSync = function() { throw new Error("Sandbox: execFileSync not allowed"); };

    // Restrict process escape hatches

    var _origChdir = process.chdir.bind(process);
    process.chdir = function(dir) {
        var resolved = _path.resolve(dir);
        if (resolved === _resolvedUserRoot || resolved.startsWith(_resolvedUserRoot + _sep)) {
            return _origChdir(dir);
        }
        throw new Error("Sandbox: chdir denied to " + resolved);
    };

    var _origBinding = process.binding;
    process.binding = function(name) {
        if (name === "fs" || name === "spawn_sync") {
            throw new Error("Sandbox: process.binding(" + name + ") blocked");
        }
        return _origBinding.apply(process, arguments);
    };
    process.dlopen = function() { throw new Error("Sandbox: native modules are blocked"); };
    process.kill = function() { throw new Error("Sandbox: process signals are blocked"); };

    var _Module = require("module");
    var _origModuleLoad = _Module._load;
    var _blockedModules = {
        "cluster": 1,
        "node:cluster": 1,
        "inspector": 1,
        "node:inspector": 1,
        "worker_threads": 1,
        "node:worker_threads": 1
    };
    _Module._load = function(request) {
        if (_blockedModules[String(request)]) {
            throw new Error("Sandbox: module not allowed: " + request);
        }
        return _origModuleLoad.apply(this, arguments);
    };

    //console.debug("Sandbox guard active: " + _resolvedUserRoot);
})();
