<?php

use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\WorkspaceController as AdminWorkspaceController;
use App\Http\Controllers\AiModel\AiModelController;
use App\Http\Controllers\Api\ApiDocController;
use App\Http\Controllers\Auth\EmailAuthController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\SocialLoginController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Flow\FlowActionController;
use App\Http\Controllers\Flow\FlowBatchController;
use App\Http\Controllers\Flow\FlowContentController;
use App\Http\Controllers\Flow\FlowController;
use App\Http\Controllers\Flow\FlowDuplicationController;
use App\Http\Controllers\Flow\FlowIconController;
use App\Http\Controllers\Flow\FlowPlacementController;
use App\Http\Controllers\Flow\FlowRepositoryLinkController;
use App\Http\Controllers\Flow\FlowRunController;
use App\Http\Controllers\Flow\FlowRunsPageController;
use App\Http\Controllers\Flow\FlowTriggerController;
use App\Http\Controllers\Flow\FlowVersionController;
use App\Http\Controllers\Flow\MailboxWatcherController;
use App\Http\Controllers\Folder\FolderController;
use App\Http\Controllers\Integration\Ai\AiController;
use App\Http\Controllers\Integration\IntegrationController;
use App\Http\Controllers\Integration\Messenger\MessengerController;
use App\Http\Controllers\Integration\Other\Vendor\Mailbox\MailboxController as MailboxIntegrationController;
use App\Http\Controllers\Integration\Repository\RepositoryController;
use App\Http\Controllers\Integration\Repository\Vendor\Gitea\GiteaRepositoryController;
use App\Http\Controllers\Integration\Repository\Vendor\Github\GithubRepositoryController;
use App\Http\Controllers\Integration\Repository\Vendor\Gitlab\GitlabRepositoryController;
use App\Http\Controllers\Integration\Vault\VaultController;
use App\Http\Controllers\Library\LibraryController;
use App\Http\Controllers\Licensing\LicenseLauncherController;
use App\Http\Controllers\Mailbox\MailboxController;
use App\Http\Controllers\Mailbox\MailboxEmailController;
use App\Http\Controllers\NotificationChannel\NotificationChannelController;
use App\Http\Controllers\Snippet\SnippetController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\User\ApiKeyController;
use App\Http\Controllers\User\ProfileController;
use App\Http\Controllers\UserVariable\UserVariableController;
use App\Http\Controllers\Workspace\PrivateLibraryController;
use App\Http\Controllers\Workspace\TeamController;
use App\Http\Controllers\Workspace\WorkspaceController;
use App\Http\Controllers\Workspace\WorkspaceMcpController;
use App\Http\Controllers\Workspace\WorkspaceProxyController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$guestMiddleware = config('app.safe_mode') ? [] : ['guest'];

if (! config('license.managed_license')) {
    Route::get('license', [LicenseLauncherController::class, 'show'])->name('license.launcher');
    Route::post('license', [LicenseLauncherController::class, 'store'])->name('license.import');
    Route::post('license/community', [LicenseLauncherController::class, 'requestCommunityLicense'])
        ->middleware('throttle:5,1')
        ->name('license.community.request');
}

// Auth
Route::middleware($guestMiddleware)->group(function () {
    Route::get('login', [LoginController::class, 'show'])->name('login');
    Route::post('login', [LoginController::class, 'store'])->middleware('throttle:10,1');
    Route::get('auth/{provider}/redirect', [SocialLoginController::class, 'redirect'])->name('social.redirect');
    Route::get('auth/{provider}/callback', [SocialLoginController::class, 'callback'])->name('social.callback');
    Route::get('register', [RegisterController::class, 'show'])->name('register');
    Route::post('register', [RegisterController::class, 'store'])->middleware('throttle:5,1');
    Route::post('auth/email/challenge', [EmailAuthController::class, 'requestCode'])
        ->middleware('throttle:10,1')
        ->name('email-auth.request');
    Route::post('auth/email/verify', [EmailAuthController::class, 'verify'])
        ->middleware('throttle:20,1')
        ->name('email-auth.verify');
});

Route::get('auth/email/magic/{challenge}/{token}', [EmailAuthController::class, 'magic'])
    ->middleware('throttle:20,1')
    ->name('email-auth.magic');

Route::post('logout', [LoginController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

Route::get('uploads/{path}', UploadController::class)
    ->where('path', '.*')
    ->name('uploads.show');

Route::post('leave-impersonate', [UserController::class, 'leaveImpersonate'])
    ->middleware('auth')
    ->name('impersonate.leave');

// Two-Factor Authentication (guest: challenge after login)
Route::middleware($guestMiddleware)->group(function () {
    Route::get('two-factor/challenge', [TwoFactorController::class, 'challenge'])->name('two-factor.challenge');
    Route::post('two-factor/challenge', [TwoFactorController::class, 'verify'])
        ->middleware('throttle:10,1');
});

// Two-Factor Authentication (auth: setup/enable/disable)
Route::middleware('auth')->group(function () {
    Route::get('two-factor/setup', [TwoFactorController::class, 'setup'])->name('two-factor.setup');
    Route::post('two-factor/enable', [TwoFactorController::class, 'enable'])->name('two-factor.enable');
    Route::delete('two-factor/disable', [TwoFactorController::class, 'disable'])->name('two-factor.disable');
});

// Authenticated + Workspace
Route::middleware(['auth', \App\Http\Middleware\EnsureWorkspaceAccess::class])->group(function () {

    Route::get('/', DashboardController::class)->name('dashboard');

    // Flows
    Route::get('library/items', [LibraryController::class, 'index'])->name('library.items');
    Route::post('library/blueprints/{namespace}/import', [LibraryController::class, 'import'])->name('library.blueprints.import');
    Route::post('library/blueprints/{namespace}/upvote', [LibraryController::class, 'upvote'])->name('library.blueprints.upvote');
    Route::post('flows/batch-delete', [FlowBatchController::class, 'destroy'])->name('flows.destroyBatch');
    Route::get('flows/runs', FlowRunsPageController::class)->name('flows.runs.page');
    Route::delete('flows/runs/batch-delete', [FlowRunsPageController::class, 'destroyBatch'])->name('flows.runs.page.destroyBatch');
    Route::resource('flows', FlowController::class)->except(['edit']);
    Route::get('flows/{flow}/version', [FlowContentController::class, 'version'])->name('flows.version');
    Route::get('flows/{flow}/export-inputs', [FlowContentController::class, 'exportInputs'])->name('flows.exportInputs');
    Route::put('flows/{flow}/code', [FlowContentController::class, 'updateCode'])->name('flows.code.update');
    Route::post('flows/{flow}/publish', [FlowContentController::class, 'publish'])->name('flows.publish');
    Route::post('flows/{flow}/unpublish', [FlowContentController::class, 'unpublish'])->name('flows.unpublish');
    Route::get('flows/{flow}/versions', [FlowVersionController::class, 'index'])->name('flows.versions.index');
    Route::get('flows/{flow}/versions/{flowVersion}', [FlowVersionController::class, 'show'])->name('flows.versions.show');
    Route::post('flows/{flow}/versions/{flowVersion}/restore', [FlowVersionController::class, 'restore'])->name('flows.versions.restore');
    Route::post('flows/{flow}/versions/{flowVersion}/publish', [FlowVersionController::class, 'publish'])->name('flows.versions.publish');
    Route::put('flows/{flow}/input', [FlowContentController::class, 'saveInput'])->name('flows.input.save');
    Route::patch('flows/{flow}/move', [FlowPlacementController::class, 'move'])->name('flows.move');
    Route::post('flows/{flow}/duplicate', FlowDuplicationController::class)->name('flows.duplicate');
    Route::post('flows/{flow}/icon', [FlowIconController::class, 'store'])->name('flows.icon');
    Route::delete('flows/{flow}/icon', [FlowIconController::class, 'destroy'])->name('flows.icon.destroy');
    Route::delete('flows/{flow}/cookies', [FlowContentController::class, 'clearCookies'])->name('flows.cookies.clear');
    Route::put('flows/{flow}/visibility', [FlowPlacementController::class, 'updateVisibility'])->name('flows.visibility');
    Route::post('flows/{flow}/library-check-update', [FlowContentController::class, 'checkLibrary'])->name('flows.library.checkUpdate');
    Route::post('flows/{flow}/library-update', [FlowContentController::class, 'updateLibrary'])->name('flows.library.update');

    // Flow runs
    Route::post('flows/{flow}/run', [FlowRunController::class, 'store'])->name('flows.run');
    Route::get('flows/{flow}/runs', [FlowRunController::class, 'index'])->name('flows.runs.index');
    Route::get('flows/{flow}/runs/{run}', [FlowRunController::class, 'show'])->name('flows.runs.show');
    Route::get('flows/{flow}/runs/{run}/artifacts/{type}', [FlowRunController::class, 'artifacts'])->name('flows.runs.artifacts');
    Route::get('flows/{flow}/runs/{run}/artifacts/{type}/{filename}', [FlowRunController::class, 'downloadArtifact'])->where('filename', '.*')->name('flows.runs.artifacts.download');
    Route::get('flows/{flow}/runs/{run}/recording', [FlowRunController::class, 'recording'])->name('flows.runs.recording');
    Route::get('flows/{flow}/runs/{run}/recording/lastshot', [FlowRunController::class, 'recordingLastshot'])->name('flows.runs.recording.lastshot');
    Route::get('flows/{flow}/runs/{run}/recording/player', [FlowRunController::class, 'recordingPlayer'])->name('flows.runs.recording.player');
    Route::get('runs/{run}/recording/player', [FlowRunController::class, 'recordingPlayerShort'])->name('runs.recording.player');
    Route::post('flows/{flow}/runs/{run}/kill', [FlowRunController::class, 'kill'])->name('flows.runs.kill');
    Route::post('flows/{flow}/runs/{run}/continue', [FlowRunController::class, 'continueRun'])->name('flows.runs.continue');
    Route::get('flows/{flow}/runs/{run}/wait-status', [FlowRunController::class, 'waitStatus'])->name('flows.runs.waitStatus');
    Route::get('flows/{flow}/runs/{run}/stream-token', [FlowRunController::class, 'streamToken'])->name('flows.runs.streamToken');
    Route::delete('flows/{flow}/runs/{run}', [FlowRunController::class, 'destroy'])->name('flows.runs.destroy');
    Route::post('flows/{flow}/runs/batch-delete', [FlowRunController::class, 'destroyBatch'])->name('flows.runs.destroyBatch');
    Route::delete('flows/{flow}/runs', [FlowRunController::class, 'destroyAll'])->name('flows.runs.destroyAll');

    // Triggers
    Route::post('flows/{flow}/triggers', [FlowTriggerController::class, 'store'])->name('triggers.store');
    Route::delete('flows/{flow}/triggers/bulk-delete', [FlowTriggerController::class, 'destroyBatch'])->name('triggers.bulk-delete');
    Route::put('triggers/{trigger}', [FlowTriggerController::class, 'update'])->name('triggers.update');
    Route::delete('triggers/{trigger}', [FlowTriggerController::class, 'destroy'])->name('triggers.destroy');

    // Actions
    Route::post('flows/{flow}/actions', [FlowActionController::class, 'store'])->name('actions.store');
    Route::delete('flows/{flow}/actions/bulk-delete', [FlowActionController::class, 'destroyBatch'])->name('actions.bulk-delete');
    Route::put('actions/{action}', [FlowActionController::class, 'update'])->name('actions.update');
    Route::delete('actions/{action}', [FlowActionController::class, 'destroy'])->name('actions.destroy');

    // Mailbox Watchers
    Route::get('flows/{flow}/mailbox-watchers', [MailboxWatcherController::class, 'index'])->name('mailbox-watchers.index');
    Route::post('flows/{flow}/mailbox-watchers', [MailboxWatcherController::class, 'store'])->name('mailbox-watchers.store');
    Route::get('flows/{flow}/mailbox-watchers/suggestions', [MailboxWatcherController::class, 'suggestions'])->name('mailbox-watchers.suggestions');
    Route::get('flows/{flow}/mailbox-watchers/setup-status', [MailboxWatcherController::class, 'setupStatus'])->name('mailbox-watchers.setup-status');
    Route::delete('flows/{flow}/mailbox-watchers/bulk-delete', [MailboxWatcherController::class, 'destroyBatch'])->name('mailbox-watchers.bulk-delete');
    Route::put('flows/{flow}/mailbox-watchers/{watcher}', [MailboxWatcherController::class, 'update'])->name('mailbox-watchers.update');
    Route::delete('flows/{flow}/mailbox-watchers/{watcher}', [MailboxWatcherController::class, 'destroy'])->name('mailbox-watchers.destroy');

    // Variables
    Route::get('variables', [UserVariableController::class, 'index'])->name('variables.index');
    Route::post('variables', [UserVariableController::class, 'store'])->name('variables.store');
    Route::post('variables/import', [UserVariableController::class, 'import'])->name('variables.import');
    Route::delete('variables/bulk-delete', [UserVariableController::class, 'destroyBatch'])->name('variables.bulk-delete');
    Route::put('variables/{variable}', [UserVariableController::class, 'update'])->name('variables.update');
    Route::get('variables/{variable}/usages', [UserVariableController::class, 'usages'])->name('variables.usages');
    Route::delete('variables/{variable}', [UserVariableController::class, 'destroy'])->name('variables.destroy');
    Route::get('variables/suggestions', [UserVariableController::class, 'suggestions'])->name('variables.suggestions');

    // AI Models
    Route::get('ai-models', [AiModelController::class, 'index'])->name('ai-models.index');
    Route::get('ai-models/suggestions', [AiModelController::class, 'suggestions'])->name('ai-models.suggestions');
    Route::get('ai-models/setup-status', [AiModelController::class, 'setupStatus'])->name('ai-models.setup-status');
    Route::get('ai-models/discover', [AiModelController::class, 'discover'])
        ->middleware('throttle:30,1')
        ->name('ai-models.discover');
    Route::post('ai-models', [AiModelController::class, 'store'])->name('ai-models.store');
    Route::delete('ai-models/bulk-delete', [AiModelController::class, 'destroyBatch'])->name('ai-models.bulk-delete');
    Route::put('ai-models/{aiModel}', [AiModelController::class, 'update'])->name('ai-models.update');
    Route::delete('ai-models/{aiModel}', [AiModelController::class, 'destroy'])->name('ai-models.destroy');
    Route::get('ai-models/{aiModel}/usages', [AiModelController::class, 'usages'])->name('ai-models.usages');

    // Folders
    Route::post('folders', [FolderController::class, 'store'])->name('folders.store');
    Route::put('folders/{folder}', [FolderController::class, 'update'])->name('folders.update');
    Route::patch('folders/{folder}/move', [FolderController::class, 'move'])->name('folders.move');
    Route::delete('folders/{folder}', [FolderController::class, 'destroy'])->name('folders.destroy');

    // Notification Channels
    Route::get('channels', [NotificationChannelController::class, 'index'])->name('channels.index');
    Route::get('channels/suggestions', [NotificationChannelController::class, 'suggestions'])->name('channels.suggestions');
    Route::get('channels/setup-status', [NotificationChannelController::class, 'setupStatus'])->name('channels.setup-status');
    Route::post('channels', [NotificationChannelController::class, 'store'])->name('channels.store');
    Route::delete('channels/bulk-delete', [NotificationChannelController::class, 'destroyBatch'])->name('channels.bulk-delete');
    Route::put('channels/{channel}', [NotificationChannelController::class, 'update'])->name('channels.update');
    Route::delete('channels/{channel}', [NotificationChannelController::class, 'destroy'])->name('channels.destroy');
    Route::get('channels/{channel}/usages', [NotificationChannelController::class, 'usages'])->name('channels.usages');
    Route::post('channels/{channel}/test', [NotificationChannelController::class, 'test'])->name('channels.test');

    // Flow Repository Link
    Route::post('flows/{flow}/repository-link', [FlowRepositoryLinkController::class, 'store'])->name('flows.repositoryLink.save');
    Route::delete('flows/{flow}/repository-link', [FlowRepositoryLinkController::class, 'destroy'])->name('flows.repositoryLink.remove');

    // GitHub App flow (manifest)
    Route::get('integrations/github/manifest', [GithubRepositoryController::class, 'manifest'])->name('integrations.github.manifest');
    Route::post('integrations/github/store-pending-name', [GithubRepositoryController::class, 'storePendingName'])->name('integrations.github.storePendingName');
    Route::get('integrations/github/callback', [GithubRepositoryController::class, 'callback'])->name('integrations.github.callback');
    Route::get('integrations/github/setup', [GithubRepositoryController::class, 'setup'])->name('integrations.github.setup');
    Route::get('integrations/github/install-url', [GithubRepositoryController::class, 'installUrl'])->name('integrations.github.installUrl');
    Route::get('integrations/gitlab/{integration}/authorize', [GitlabRepositoryController::class, 'redirectToProvider'])->name('integrations.gitlab.authorize');
    Route::get('integrations/gitlab/callback', [GitlabRepositoryController::class, 'callback'])->name('integrations.gitlab.callback');
    Route::get('integrations/gitea/{integration}/authorize', [GiteaRepositoryController::class, 'redirectToProvider'])->name('integrations.gitea.authorize');
    Route::get('integrations/gitea/callback', [GiteaRepositoryController::class, 'callback'])->name('integrations.gitea.callback');

    // Integrations
    Route::get('integrations', [IntegrationController::class, 'index'])->name('integrations.index');
    Route::post('integrations', [IntegrationController::class, 'store'])->name('integrations.store');
    Route::put('integrations/{integration}', [IntegrationController::class, 'update'])->name('integrations.update');
    Route::delete('integrations/{integration}', [IntegrationController::class, 'destroy'])->name('integrations.destroy');
    Route::post('integrations/ai/validate', [AiController::class, 'validate'])
        ->middleware('throttle:10,1')
        ->name('integrations.ai.validate');
    Route::get('integrations/{integration}/ai-usages', [AiController::class, 'usages'])
        ->name('integrations.ai.usages');
    Route::post('integrations/repository/validate', [RepositoryController::class, 'validate'])->name('integrations.repository.validate');
    Route::get('integrations/{integration}/repositories', [RepositoryController::class, 'listRemoteRepositories'])->name('integrations.repositories.list');
    Route::get('integrations/{integration}/branches', [RepositoryController::class, 'listBranches'])->name('integrations.branches');
    Route::post('integrations/vault/validate', [VaultController::class, 'validate'])->name('integrations.vault.validate');
    Route::get('integrations/{integration}/vault-usages', [VaultController::class, 'usages'])->name('integrations.vault.usages');
    Route::get('integrations/{integration}/vaults', [VaultController::class, 'listVaults'])->name('integrations.vaults.list');
    Route::get('integrations/{integration}/vaults/{vaultId}/items', [VaultController::class, 'listVaultItems'])->name('integrations.vaults.items');
    Route::get('integrations/{integration}/vaults/{vaultId}/items/{itemId}/fields', [VaultController::class, 'listVaultItemFields'])->name('integrations.vaults.items.fields');
    Route::post('integrations/messenger/validate', [MessengerController::class, 'validate'])->name('integrations.messenger.validate');
    Route::get('integrations/{integration}/chats', [MessengerController::class, 'detectChats'])->name('integrations.messenger.chats');
    Route::post('integrations/{integration}/test-message', [MessengerController::class, 'test'])->name('integrations.messenger.test');
    Route::get('integrations/{integration}/messenger-usages', [MessengerController::class, 'usages'])->name('integrations.messenger.usages');

    // Mailbox integration - domain management
    Route::post('integrations/mailbox', [MailboxIntegrationController::class, 'createIntegration'])->name('integrations.mailbox.create');
    Route::get('integrations/mailbox/public-ip', [MailboxIntegrationController::class, 'publicIp'])->name('integrations.mailbox.publicIp');
    Route::get('integrations/{integration}/mailbox/domains', [MailboxIntegrationController::class, 'list'])->name('integrations.mailbox.domains.list');
    Route::post('integrations/{integration}/mailbox/domains', [MailboxIntegrationController::class, 'store'])->name('integrations.mailbox.domains.store');
    Route::get('integrations/{integration}/mailbox/domains/{domain}', [MailboxIntegrationController::class, 'show'])->name('integrations.mailbox.domains.show');
    Route::delete('integrations/{integration}/mailbox/domains/{domain}', [MailboxIntegrationController::class, 'destroy'])->name('integrations.mailbox.domains.destroy');
    Route::post('integrations/{integration}/mailbox/domains/{domain}/verify', [MailboxIntegrationController::class, 'verify'])->name('integrations.mailbox.domains.verify');
    Route::get('integrations/{integration}/mailbox-usages', [MailboxIntegrationController::class, 'usages'])->name('integrations.mailbox.usages');
    Route::get('integrations/{integration}/mailbox/domains/{domain}/usages', [MailboxIntegrationController::class, 'domainUsages'])->name('integrations.mailbox.domains.usages');

    // Mailboxes
    Route::get('mailboxes', [MailboxController::class, 'index'])->name('mailboxes.index');
    Route::post('mailboxes', [MailboxController::class, 'store'])->name('mailboxes.store');
    Route::delete('mailboxes/bulk-delete', [MailboxController::class, 'destroyBatch'])->name('mailboxes.bulk-delete');
    Route::put('mailboxes/{mailbox}', [MailboxController::class, 'update'])->name('mailboxes.update');
    Route::delete('mailboxes/{mailbox}', [MailboxController::class, 'destroy'])->name('mailboxes.destroy');
    Route::get('mailboxes/{mailbox}/watcher-usages', [MailboxController::class, 'watcherUsages'])->name('mailboxes.watcherUsages');

    // Mailbox emails (JSON API)
    Route::get('mailboxes/{mailbox}/emails', [MailboxEmailController::class, 'index'])->name('mailbox.emails.index');
    Route::get('mailbox-emails/{email}', [MailboxEmailController::class, 'show'])->name('mailbox.emails.show');
    Route::post('mailbox-emails/{email}/read', [MailboxEmailController::class, 'markRead'])->name('mailbox.emails.read');
    Route::post('mailbox-emails/{email}/unread', [MailboxEmailController::class, 'markUnread'])->name('mailbox.emails.unread');
    Route::delete('mailbox-emails/{email}', [MailboxEmailController::class, 'destroy'])->name('mailbox.emails.destroy');

    // Snippets
    Route::get('snippets', [SnippetController::class, 'index'])->name('snippets.index');
    Route::get('snippets/suggestions', [SnippetController::class, 'suggestions'])->name('snippets.suggestions');
    Route::post('snippets/export', [SnippetController::class, 'export'])->name('snippets.export');
    Route::post('snippets', [SnippetController::class, 'store'])->name('snippets.store');
    Route::delete('snippets/bulk-delete', [SnippetController::class, 'destroyBatch'])->name('snippets.bulk-delete');
    Route::put('snippets/{snippet}', [SnippetController::class, 'update'])->name('snippets.update');
    Route::delete('snippets/{snippet}', [SnippetController::class, 'destroy'])->name('snippets.destroy');
    Route::get('snippets/{snippet}/usages', [SnippetController::class, 'usages'])->name('snippets.usages');
    Route::post('snippets/{snippet}/library-check-update', [SnippetController::class, 'checkLibrarySourceUpdate'])->name('snippets.library.checkUpdate');
    Route::post('snippets/{snippet}/library-update', [SnippetController::class, 'updateLibrarySource'])->name('snippets.library.update');

    // Workspace
    Route::get('workspace/create', [WorkspaceController::class, 'create'])->name('workspace.create');
    Route::post('workspace', [WorkspaceController::class, 'store'])->name('workspace.store');
    Route::post('workspace/{workspace}/switch', [WorkspaceController::class, 'switch'])->name('workspace.switch');
    Route::put('workspace/transfer-ownership', [WorkspaceController::class, 'transferOwnership'])->name('workspace.transfer-ownership');
    Route::get('workspace/settings', [WorkspaceController::class, 'settings'])->name('workspace.settings');
    Route::get('workspace/members', [WorkspaceController::class, 'members'])->name('workspace.members');
    Route::get('workspace/users-search', [WorkspaceController::class, 'usersSearch'])->name('workspace.users-search');
    Route::put('workspace', [WorkspaceController::class, 'update'])->name('workspace.update');
    Route::put('workspace/mcp', [WorkspaceMcpController::class, 'update'])->name('workspace.mcp.update');
    Route::post('workspace/mcp/tokens', [WorkspaceMcpController::class, 'storeToken'])->name('workspace.mcp.tokens.store');
    Route::delete('workspace/mcp/tokens/{token}', [WorkspaceMcpController::class, 'revokeToken'])->name('workspace.mcp.tokens.revoke');
    Route::post('workspace/mcp/oauth-clients', [WorkspaceMcpController::class, 'storeOauthClient'])->name('workspace.mcp.oauthClients.store');
    Route::delete('workspace/mcp/oauth-clients/{client}', [WorkspaceMcpController::class, 'revokeOauthClient'])->name('workspace.mcp.oauthClients.revoke');
    Route::delete('workspace/mcp/oauth-connections/{connection}', [WorkspaceMcpController::class, 'revokeOauthConnection'])->name('workspace.mcp.oauthConnections.revoke');
    Route::put('workspace/mcp/flows/{flow}', [WorkspaceMcpController::class, 'updateFlow'])->name('workspace.mcp.flows.update');
    Route::put('workspace/mcp/flows', [WorkspaceMcpController::class, 'bulkUpdateFlows'])->name('workspace.mcp.flows.bulk');
    Route::post('workspace/private-libraries', [PrivateLibraryController::class, 'store'])->name('workspace.private-libraries.store');
    Route::put('workspace/private-libraries/{privateLibrary}', [PrivateLibraryController::class, 'update'])->name('workspace.private-libraries.update');
    Route::post('workspace/private-libraries/{privateLibrary}/refresh', [PrivateLibraryController::class, 'refresh'])->name('workspace.private-libraries.refresh');
    Route::delete('workspace/private-libraries/{privateLibrary}', [PrivateLibraryController::class, 'destroy'])->name('workspace.private-libraries.destroy');
    Route::post('workspace/proxies', [WorkspaceProxyController::class, 'store'])->name('workspace.proxies.store');
    Route::put('workspace/proxies/{workspaceProxy}', [WorkspaceProxyController::class, 'update'])->name('workspace.proxies.update');
    Route::delete('workspace/proxies/{workspaceProxy}', [WorkspaceProxyController::class, 'destroy'])->name('workspace.proxies.destroy');
    Route::post('workspace/icon', [WorkspaceController::class, 'updateIcon'])->name('workspace.icon');
    Route::delete('workspace', [WorkspaceController::class, 'destroy'])->name('workspace.destroy');
    Route::delete('workspace/icon', [WorkspaceController::class, 'destroyIcon'])->name('workspace.icon.destroy');
    Route::post('workspace/members', [WorkspaceController::class, 'addMember'])->name('workspace.members.add');
    Route::delete('workspace/members/bulk-delete', [WorkspaceController::class, 'removeMembers'])->name('workspace.members.bulk-delete');
    Route::put('workspace/members/{userId}', [WorkspaceController::class, 'updateMember'])->name('workspace.members.update');
    Route::delete('workspace/members/{userId}', [WorkspaceController::class, 'removeMember'])->name('workspace.members.remove');
    Route::post('workspace/invitations/{invitationId}/resend', [WorkspaceController::class, 'resendInvitation'])->name('workspace.invitations.resend');
    Route::post('workspace/invitations/{invitationId}/validate', [WorkspaceController::class, 'validateInvitation'])->name('workspace.invitations.validate');
    Route::delete('workspace/invitations/{invitationId}', [WorkspaceController::class, 'cancelInvitation'])->name('workspace.invitations.cancel');
    Route::post('workspace/registration-requests/{registrationRequestId}/approve', [WorkspaceController::class, 'approveRegistrationRequest'])
        ->name('workspace.registration-requests.approve');
    Route::delete('workspace/registration-requests/{registrationRequestId}', [WorkspaceController::class, 'rejectRegistrationRequest'])
        ->name('workspace.registration-requests.reject');

    // Teams
    Route::get('workspace/teams-search', [TeamController::class, 'search'])->name('workspace.teams-search');
    Route::post('workspace/teams', [TeamController::class, 'store'])->name('workspace.teams.store');
    Route::delete('workspace/teams/bulk-delete', [TeamController::class, 'destroyBatch'])->name('workspace.teams.bulk-delete');
    Route::put('workspace/teams/{teamId}', [TeamController::class, 'update'])->name('workspace.teams.update');
    Route::delete('workspace/teams/{teamId}', [TeamController::class, 'destroy'])->name('workspace.teams.destroy');
    Route::post('workspace/teams/{teamId}/invitations', [TeamController::class, 'inviteMember'])->name('workspace.teams.invitations.store');
    Route::post('workspace/teams/{teamId}/members', [TeamController::class, 'addMember'])->name('workspace.teams.members.add');
    Route::delete('workspace/teams/{teamId}/members/{userId}', [TeamController::class, 'removeMember'])->name('workspace.teams.members.remove');

    // Profile
    Route::get('profile', [ProfileController::class, 'show'])->name('profile');
    Route::put('profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::patch('profile/preference', [ProfileController::class, 'updatePreference'])->name('profile.preference');
    Route::patch('profile/onboarding', [ProfileController::class, 'updateOnboarding'])->name('profile.onboarding');
    Route::delete('profile/onboarding', [ProfileController::class, 'resetOnboarding'])->name('profile.onboarding.reset');
    Route::put('profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::put('profile/icon', [ProfileController::class, 'updateIcon'])->name('profile.icon');
    Route::post('profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::delete('profile/avatar', [ProfileController::class, 'destroyAvatar'])->name('profile.avatar.destroy');

    // API Keys
    Route::post('api-keys', [ApiKeyController::class, 'store'])->name('api-keys.store');
    Route::delete('api-keys/{apiKey}', [ApiKeyController::class, 'destroy'])->name('api-keys.destroy');

    // API Documentation
    Route::get('api/docs', [ApiDocController::class, 'ui'])->name('api.docs');
    Route::get('api/docs/openapi.json', [ApiDocController::class, 'spec'])->name('api.docs.spec');

    // Admin
    Route::middleware(\App\Http\Middleware\EnsureAdmin::class)
        ->prefix('admin')
        ->name('admin.')
        ->group(function () {
            Route::delete('users/bulk-delete', [UserController::class, 'destroyBatch'])->name('users.bulk-delete');
            Route::resource('users', UserController::class)->only(['index', 'store', 'update', 'destroy']);
            Route::post('registration-requests/{registrationRequest}/approve', [UserController::class, 'approveRegistrationRequest'])
                ->name('registration-requests.approve');
            Route::delete('registration-requests/{registrationRequest}', [UserController::class, 'rejectRegistrationRequest'])
                ->name('registration-requests.reject');
            Route::post('users/{user}/impersonate', [UserController::class, 'impersonate'])->name('users.impersonate');
            Route::get('users-search', [UserController::class, 'search'])->name('users.search');
            Route::get('workspaces', [AdminWorkspaceController::class, 'index'])->name('workspaces');
            Route::post('workspaces', [AdminWorkspaceController::class, 'store'])->name('workspaces.store');
            Route::put('workspaces/{workspace}', [AdminWorkspaceController::class, 'update'])->name('workspaces.update');
            Route::delete('workspaces/{workspace}', [AdminWorkspaceController::class, 'destroy'])->name('workspaces.destroy');
            Route::put('workspaces/{workspace}/transfer-ownership', [AdminWorkspaceController::class, 'transferOwnership'])->name('workspaces.transfer-ownership');
            Route::get('server', [SettingsController::class, 'index'])->name('server');
            Route::put('server', [SettingsController::class, 'update'])->name('server.update');
            Route::post('server/magic-link/challenge', [SettingsController::class, 'requestMagicLinkChallenge'])
                ->middleware('throttle:10,1')
                ->name('server.magic-link.challenge');
            Route::put('server/magic-link', [SettingsController::class, 'confirmMagicLinkChallenge'])
                ->middleware('throttle:20,1')
                ->name('server.magic-link.confirm');
            if (! config('license.managed_license')) {
                Route::post('server/license', [SettingsController::class, 'uploadLicense'])->name('server.license.upload');
                Route::get('server/license/download', [SettingsController::class, 'downloadLicense'])->name('server.license.download');
                Route::delete('server/license', [SettingsController::class, 'deleteLicense'])->name('server.license.delete');
            }
            Route::post('server/license/ping', [SettingsController::class, 'pingLicense'])->name('server.license.ping');
        });
});

Route::fallback(function (Request $request) {
    return Inertia::render('Dashboard/ErrorPage', ['status' => 404])
        ->toResponse($request)
        ->setStatusCode(404);
});
