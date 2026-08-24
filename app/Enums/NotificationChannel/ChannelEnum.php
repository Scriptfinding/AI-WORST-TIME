<?php

namespace App\Enums\NotificationChannel;

enum ChannelEnum: string
{
    case TELEGRAM = 'telegram';
    case DISCORD = 'discord';
    case SLACK = 'slack';
}
