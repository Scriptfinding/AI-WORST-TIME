<?php

namespace App\Providers;

use App\Models\AiModel;
use App\Models\DataTable;
use App\Models\Flow;
use App\Models\FlowAction;
use App\Models\FlowRun;
use App\Models\FlowTrigger;
use App\Models\Folder;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Models\MailboxWatcher;
use App\Models\NotificationChannel;
use App\Models\Snippet;
use App\Models\UserVariable;
use App\Models\Workspace;
use App\Models\WorkspaceTeam;
use App\Policies\AiModel\AiModelPolicy;
use App\Policies\DataTable\DataTablePolicy;
use App\Policies\Flow\FlowActionPolicy;
use App\Policies\Flow\FlowPolicy;
use App\Policies\Flow\FlowRunPolicy;
use App\Policies\Flow\FlowTriggerPolicy;
use App\Policies\Folder\FolderPolicy;
use App\Policies\Integration\IntegrationPolicy;
use App\Policies\Mailbox\MailboxPolicy;
use App\Policies\Mailbox\MailboxWatcherPolicy;
use App\Policies\NotificationChannel\NotificationChannelPolicy;
use App\Policies\Snippet\SnippetPolicy;
use App\Policies\UserVariable\UserVariablePolicy;
use App\Policies\Workspace\WorkspacePolicy;
use App\Policies\Workspace\WorkspaceTeamPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AuthorizationServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::policy(AiModel::class, AiModelPolicy::class);
        Gate::policy(DataTable::class, DataTablePolicy::class);
        Gate::policy(Flow::class, FlowPolicy::class);
        Gate::policy(FlowRun::class, FlowRunPolicy::class);
        Gate::policy(FlowAction::class, FlowActionPolicy::class);
        Gate::policy(FlowTrigger::class, FlowTriggerPolicy::class);
        Gate::policy(Mailbox::class, MailboxPolicy::class);
        Gate::policy(MailboxWatcher::class, MailboxWatcherPolicy::class);
        Gate::policy(Workspace::class, WorkspacePolicy::class);
        Gate::policy(WorkspaceTeam::class, WorkspaceTeamPolicy::class);
        Gate::policy(Folder::class, FolderPolicy::class);
        Gate::policy(Integration::class, IntegrationPolicy::class);
        Gate::policy(Snippet::class, SnippetPolicy::class);
        Gate::policy(NotificationChannel::class, NotificationChannelPolicy::class);
        Gate::policy(UserVariable::class, UserVariablePolicy::class);
    }
}
