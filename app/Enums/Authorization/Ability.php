<?php

namespace App\Enums\Authorization;

enum Ability: string
{
    case VIEW_ANY = 'viewAny';
    case VIEW = 'view';
    case CREATE = 'create';
    case UPDATE = 'update';
    case DELETE = 'delete';
    case MANAGE = 'manage';
    case MANAGE_SCOPE = 'manageScope';
    case TRANSFER_OWNERSHIP = 'transferOwnership';
    case EXECUTE = 'execute';
    case EXECUTE_AUTOMATED = 'executeAutomated';
    case USE = 'use';
    case VIEW_RUNS = 'viewRuns';
    case KILL_RUN = 'killRun';
    case CONTINUE_RUN = 'continueRun';
    case MANAGE_MEMBERS = 'manageMembers';
}
