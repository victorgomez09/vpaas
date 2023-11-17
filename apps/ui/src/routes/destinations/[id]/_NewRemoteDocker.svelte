<script lang="ts">
	export let payload: any;

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { post } from '$lib/api';
	import { errorNotification } from '$lib/common';
	import SimpleExplainer from '$lib/components/SimpleExplainer.svelte';
	import Setting from '$lib/components/Setting.svelte';
	import { t } from '$lib/translations';

	const from = $page.url.searchParams.get('from');
	let loading = false;

	async function handleSubmit() {
		if (loading) return;
		try {
			loading = true;
			await post(`/destinations/check`, { network: payload.network });
			const { id } = await post(`/destinations/new`, {
				...payload
			});
			return await goto(from || `/destinations/${id}`);
		} catch (error) {
			return errorNotification(error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="text-center flex justify-center">
	<SimpleExplainer
		customClass="max-w-[32rem]"
		text="Remote Docker Engines are using <span class='text-base-content font-bold'>SSH</span> to communicate with the remote docker engine. 
        You need to setup an <span class='text-base-content font-bold'>SSH key</span> in advance on the server and install Docker. 
        <br>See <a class='text-base-content' href='https://docs.coollabs.io-v3/coolify/destinations#remote-docker-engine' target='blank'>docs</a> for more details."
	/>
</div>
<div class="flex justify-center px-6 pb-8">
	<form on:submit|preventDefault={handleSubmit} class="grid grid-flow-row gap-2 py-4">
		<div
			class="flex items-start lg:items-center space-x-0 lg:space-x-4 pb-5 flex-col lg:flex-row space-y-4 lg:space-y-0"
		>
			<div class="title font-bold">{$t('forms.configuration')}</div>
			
		</div>
		<div class="mt-2 grid grid-cols-2 items-center lg:pl-10">
			<label for="name" class="text-base font-bold text-base-content">{$t('forms.name')}</label>
			<input required name="name" placeholder={$t('forms.name')} class="input input-bordered" bind:value={payload.name} />
		</div>

		<div class="grid grid-cols-2 items-center lg:pl-10">
			<label for="remoteIpAddress" class="text-base font-bold text-base-content"
				>{$t('forms.ip_address')}</label
			>
			<input
				required
				name="remoteIpAddress"
				placeholder="{$t('forms.eg')}: 192.168..."
				class="input input-bordered"
				bind:value={payload.remoteIpAddress}
			/>
		</div>

		<div class="grid grid-cols-2 items-center lg:pl-10">
			<label for="remoteUser" class="text-base font-bold text-base-content">{$t('forms.user')}</label>
			<input
				required
				name="remoteUser"
				placeholder="{$t('forms.eg')}: root"
				class="input input-bordered"
				bind:value={payload.remoteUser}
			/>
		</div>

		<div class="grid grid-cols-2 items-center lg:pl-10">
			<label for="remotePort" class="text-base font-bold text-base-content">{$t('forms.port')}</label>
			<input
				required
				name="remotePort"
				placeholder="{$t('forms.eg')}: 22"
				class="input input-bordered"
				bind:value={payload.remotePort}
			/>
		</div>
		<div class="grid grid-cols-2 items-center lg:pl-10">
			<label for="network" class="text-base font-bold text-base-content">{$t('forms.network')}</label>
			<input
				required
				name="network"
				placeholder="{$t('forms.default')}: coolify"
				class="input input-bordered"
				bind:value={payload.network}
			/>
		</div>
		<div class="grid grid-cols-2 items-center lg:pl-10">
			<Setting
				id="isProxyUsed"
				bind:setting={payload.isProxyUsed}
				on:click={() => (payload.isProxyUsed = !payload.isProxyUsed)}
				title={$t('destination.use_coolify_proxy')}
				description={'This will install a proxy on the destination to allow you to access your applications and services without any manual configuration.'}
			/>
		</div>

		<button
				type="submit"
				class="btn btn-sm btn-info w-full lg:w-fit"
				disabled={loading}
				>
				{#if loading}
					<span class="loading loading-spinner"></span>
				{/if}
				{loading
					? payload.isProxyUsed
						? $t('destination.new.saving_and_configuring_proxy')
						: $t('forms.saving')
					: $t('forms.save')}
			</button>
	</form>
</div>
