<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	import { page } from '$app/stores';
	import LoadingLogs from './_Loading.svelte';
	import { get } from '$lib/api';
	import { t } from '$lib/translations';
	import { errorNotification } from '$lib/common';
	import Tooltip from '$lib/components/Tooltip.svelte';

	const { id } = $page.params;

	let loadLogsInterval: any = null;
	let logs: any = [];
	let lastLog: any = null;
	let followingInterval: any;
	let followingLogs: any;
	let logsEl: any;
	let position = 0;
	let loadingLogs = false;
	let database = {
		name: null
	};

	onMount(async () => {
		const response = await get(`/databases/${id}`);
		database = response.database;
		const { logs: firstLogs } = await get(`/databases/${id}/logs`);
		logs = firstLogs;
		loadAllLogs();
		loadLogsInterval = setInterval(() => {
			loadLogs();
		}, 1000);
	});
	onDestroy(() => {
		clearInterval(loadLogsInterval);
		clearInterval(followingInterval);
	});
	async function loadAllLogs() {
		try {
			loadingLogs = true;
			const data: any = await get(`/databases/${id}/logs`);
			if (data?.logs) {
				lastLog = data.logs[data.logs.length - 1];
				logs = data.logs;
			}
		} catch (error) {
			return errorNotification(error);
		} finally {
			loadingLogs = false;
		}
	}
	async function loadLogs() {
		if (loadingLogs) return;
		try {
			loadingLogs = true;
			const newLogs: any = await get(`/databases/${id}/logs?since=${lastLog?.split(' ')[0] || 0}`);

			if (newLogs?.logs && newLogs.logs[newLogs.logs.length - 1] !== logs[logs.length - 1]) {
				logs = logs.concat(newLogs.logs);
				lastLog = newLogs.logs[newLogs.logs.length - 1];
			}
		} catch (error) {
			return errorNotification(error);
		} finally {
			loadingLogs = false;
		}
	}
	function detect() {
		if (position < logsEl.scrollTop) {
			position = logsEl.scrollTop;
		} else {
			if (followingLogs) {
				clearInterval(followingInterval);
				followingLogs = false;
			}
			position = logsEl.scrollTop;
		}
	}

	function followBuild() {
		followingLogs = !followingLogs;
		if (followingLogs) {
			followingInterval = setInterval(() => {
				logsEl.scrollTop = logsEl.scrollHeight;
				window.scrollTo(0, document.body.scrollHeight);
			}, 1000);
		} else {
			clearInterval(followingInterval);
		}
	}
</script>

<div class="flex flex-1 flex-row justify-center space-x-2 mt-4">
	{#if logs.length === 0}
		<div class="text-xl font-bold tracking-tighter">{$t('application.build.waiting_logs')}</div>
	{:else}
		<div class="relative">
			<div class="text-right" />
			<!-- {#if loadLogsInterval}
				<LoadingLogs />
			{/if} -->
			<div class="flex flex-1">
				<div class="card bg-base-300">
					<div
					class="card-body relative max-h-[61vh] max-w-[95vw] p-2 font-mono text-[10px] overflow-x-auto overflox-y-auto"
					>
						<button
							id="follow"
							on:click={followBuild}
							class="bg-transparent btn btn-sm btn-link fixed right-10"
							class:text-success={followingLogs}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="w-6 h-6"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								fill="none"
								stroke-linecap="round"
								stroke-linejoin="round"
							>
								<path stroke="none" d="M0 0h24v24H0z" fill="none" />
								<circle cx="12" cy="12" r="9" />
								<line x1="8" y1="12" x2="12" y2="16" />
								<line x1="12" y1="8" x2="12" y2="16" />
								<line x1="16" y1="12" x2="12" y2="16" />
							</svg>
						</button>
						<Tooltip triggeredBy="#follow">Follow Logs</Tooltip>
						{#each logs as log}
							<p class="whitespace-nowrap">{log + '\n'}</p>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
