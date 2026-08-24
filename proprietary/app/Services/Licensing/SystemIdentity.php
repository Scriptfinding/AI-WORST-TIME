<?php

namespace App\Services\Licensing;

use Illuminate\Support\Facades\Cache;

/**
 * Machine identity reported to the license server: system name, hardware UUID
 * and network id, all hashed.
 */
class SystemIdentity
{
    private const CACHE_KEY = 'license.system_identity';
    private const CACHE_TTL_SECONDS = 3600;

    /**
     * @return array{system_name: string, system_id: ?string, network_id: ?string}
     */
    public function toArray(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL_SECONDS, fn () => [
            'system_name' => $this->systemName(),
            'system_id' => $this->systemId(),
            'network_id' => $this->networkId(),
        ]);
    }

    public function systemName(): string
    {
        if ($this->isDocker()) {
            return 'docker';
        }

        return match (PHP_OS_FAMILY) {
            'Darwin' => 'darwin',
            'Linux' => 'linux',
            'Windows' => 'windows',
            default => 'unknown',
        };
    }

    public function systemId(): ?string
    {
        $uuid = match ($this->systemName()) {
            'docker' => $this->dockerContainerId(),
            'darwin' => $this->darwinUuid(),
            'linux' => $this->linuxUuid(),
            'windows' => $this->windowsUuid(),
            default => null,
        };

        $uuid = is_string($uuid) ? strtolower(trim($uuid)) : null;

        return $uuid !== null && $uuid !== '' ? hash('sha256', $uuid) : null;
    }

    public function networkId(): ?string
    {
        $interfaces = $this->networkInterfaces();
        if ($interfaces === []) {
            return null;
        }

        ksort($interfaces, SORT_STRING);

        $parts = [];
        foreach ($interfaces as $name => $mac) {
            $parts[] = $name . $mac;
        }

        return hash('sha256', implode(';', $parts));
    }

    private function isDocker(): bool
    {
        if (file_exists('/.dockerenv')) {
            return true;
        }

        $cgroup = @file_get_contents('/proc/1/cgroup');

        return is_string($cgroup) && str_contains($cgroup, 'docker');
    }

    private function dockerContainerId(): ?string
    {
        $mountinfo = @file_get_contents('/proc/self/mountinfo');
        if (is_string($mountinfo) && str_contains($mountinfo, '/docker/containers/')) {
            $id = explode('/', explode('/docker/containers/', $mountinfo, 2)[1], 2)[0];
            if ($id !== '') {
                return 'mountinfo:' . $id;
            }
        }

        $cgroup = @file_get_contents('/proc/self/cgroup');
        if (is_string($cgroup)) {
            foreach (explode("\n", $cgroup) as $line) {
                if (str_contains($line, 'docker')) {
                    $id = basename(trim($line));
                    if ($id !== '') {
                        return 'cgroup:' . $id;
                    }
                }
            }
        }

        // Default Docker hostnames are the 64-character container id.
        $hostname = gethostname();
        if (is_string($hostname) && strlen($hostname) === 64) {
            return 'hostname:' . $hostname;
        }

        return is_string($hostname) && $hostname !== '' ? 'hostname:' . $hostname : null;
    }

    private function darwinUuid(): ?string
    {
        return $this->exec(
            "ioreg -rd1 -c IOPlatformExpertDevice | grep IOPlatformUUID | awk '{print $3}' | tr -d '\"'"
        );
    }

    private function linuxUuid(): ?string
    {
        $uuid = $this->exec("lsblk -no UUID $(df / | tail -1 | awk '{print $1}') 2>/dev/null");
        if ($uuid !== null) {
            return $uuid;
        }

        foreach (['/etc/machine-id', '/var/lib/dbus/machine-id'] as $path) {
            $machineId = @file_get_contents($path);
            if (is_string($machineId) && trim($machineId) !== '') {
                return trim($machineId);
            }
        }

        return null;
    }

    private function windowsUuid(): ?string
    {
        $output = $this->exec('wmic csproduct get uuid');
        if ($output === null) {
            return null;
        }

        $lines = array_values(array_filter(array_map('trim', explode("\n", $output))));

        return $lines[1] ?? null;
    }

    /**
     * @return array<string, string> interface name => MAC address
     */
    private function networkInterfaces(): array
    {
        return match (PHP_OS_FAMILY) {
            'Windows' => $this->windowsInterfaces(),
            'Darwin' => $this->ifconfigInterfaces(),
            default => $this->sysfsInterfaces(),
        };
    }

    /**
     * @return array<string, string>
     */
    private function sysfsInterfaces(): array
    {
        $interfaces = [];

        foreach (glob('/sys/class/net/*') ?: [] as $path) {
            $name = basename($path);
            if ($name === 'lo') {
                continue;
            }

            $mac = trim((string) @file_get_contents($path . '/address'));
            if ($mac !== '' && $mac !== '00:00:00:00:00:00') {
                $interfaces[$name] = strtolower($mac);
            }
        }

        return $interfaces;
    }

    /**
     * @return array<string, string>
     */
    private function ifconfigInterfaces(): array
    {
        $output = $this->exec('ifconfig -a');
        if ($output === null) {
            return [];
        }

        $interfaces = [];
        $current = null;

        foreach (explode("\n", $output) as $line) {
            if (preg_match('/^([a-zA-Z0-9]+):/', $line, $matches)) {
                $current = $matches[1];
                continue;
            }

            if ($current !== null && $current !== 'lo0' && preg_match('/ether\s+([0-9a-f:]{17})/i', $line, $matches)) {
                $interfaces[$current] = strtolower($matches[1]);
            }
        }

        return $interfaces;
    }

    /**
     * @return array<string, string>
     */
    private function windowsInterfaces(): array
    {
        $output = $this->exec('getmac /v /fo csv /nh');
        if ($output === null) {
            return [];
        }

        $interfaces = [];

        foreach (explode("\n", trim($output)) as $line) {
            $columns = str_getcsv($line);
            $name = trim((string) ($columns[0] ?? ''));
            $mac = strtolower(str_replace('-', ':', trim((string) ($columns[2] ?? ''))));

            if ($name !== '' && preg_match('/^[0-9a-f:]{17}$/', $mac)) {
                $interfaces[$name] = $mac;
            }
        }

        return $interfaces;
    }

    private function exec(string $command): ?string
    {
        try {
            $output = @shell_exec($command);
        } catch (\Throwable) {
            return null;
        }

        if (! is_string($output)) {
            return null;
        }

        $output = trim($output);

        return $output !== '' ? $output : null;
    }
}
