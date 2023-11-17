<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	export const load: Load = async ({ fetch, params, url, stuff }) => {
		try {
			const { database } = stuff;
			if (database?.version && !url.searchParams.get('from')) {
				return {
					status: 302,
					redirect: `/database/${params.id}`
				};
			}
			const response = await get(`/databases/${params.id}/configuration/version`);
			return {
				props: {
					...response
				}
			};
		} catch (error) {
			return {
				status: 500,
				error: new Error(`Could not load ${url}`)
			};
		}
	};
</script>

<script lang="ts">
	export let versions: any;

	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { get, post } from '$lib/api';
	import { errorNotification } from '$lib/common';

	const { id } = $page.params;
	const from = $page.url.searchParams.get('from');

	async function handleSubmit(version: any) {
		try {
			await post(`/databases/${id}/configuration/version`, { version });
			return await goto(from || `/databases/${id}/configuration/destination`);
		} catch (error) {
			return errorNotification(error);
		}
	}
</script>

<div class="flex flex-1 flex-col mt-4">
	{#if from}
		<div class="pb-10 text-center">
			Warning: you are about to change the version of this database.<br />This could cause problem
			after you restart the database,
			<span class="font-bold text-error">like losing your data, incompatibility issues, etc</span
			>.<br />Only do if you know what you are doing!
		</div>
	{/if}
	<div class="flex flex-wrap justify-center">
		{#each versions as version}
			<div class="m-4">
				<form on:submit|preventDefault={() => handleSubmit(version)}>
					<button type="submit" class="box-selection text-xl font-bold bg-base-200 hover:bg-base-300 hover:text-secondary hover:scale-105"
						>{version}</button
					>
				</form>
			</div>
		{/each}
	</div>
</div>