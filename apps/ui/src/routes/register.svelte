<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	export const load: Load = async ({ stuff }) => {
		return {
			props: { ...stuff }
		};
	};
</script>

<script lang="ts">
	export let userCount: number;
	import { goto } from '$app/navigation';
	import { post } from '$lib/api';
	import { errorNotification } from '$lib/common';
	import { appSession, loginEmail } from '$lib/store';
	import { t } from '$lib/translations';
	import { onMount } from 'svelte';
	import Cookies from 'js-cookie';
	if (!$appSession.isRegistrationEnabled) {
		window.location.assign('/');
	}
	let loading = false;
	let emailEl: HTMLInputElement;
	let passwordEl: HTMLInputElement;
	let email: string | undefined, password: string, passwordCheck: string;

	onMount(async () => {
		email = $loginEmail;
		if (email) {
			passwordEl.focus();
		} else {
			emailEl.focus();
		}

		const HSTogglePassword = (await import('preline')).HSTogglePassword;
		const inputs: HTMLElement[] = Array.from(
			document.querySelectorAll('[data-hs-toggle-password]')
		);
		inputs.forEach((element: HTMLElement) => {
			new HSTogglePassword(element);
		});
	});
	async function handleSubmit() {
		// Prevent double submission
		if (loading) return;

		if (password !== passwordCheck) {
			return errorNotification($t('forms.passwords_not_match'));
		}
		loading = true;
		try {
			const { token, payload } = await post(`/login`, {
				email: email?.toLowerCase(),
				password,
				isLogin: false
			});
			Cookies.set('token', token, {
				path: '/'
			});
			$appSession.teamId = payload.teamId;
			$appSession.userId = payload.userId;
			$appSession.permission = payload.permission;
			$appSession.isAdmin = payload.isAdmin;
			return await goto('/');
		} catch (error) {
			return errorNotification(error);
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex lg:flex-row flex-col h-screen">
	<div class="bg-neutral-focus h-screen lg:flex hidden flex-col justify-end p-20 flex-1">
		<h1 class="title lg:text-6xl mb-5">Vpaas</h1>
		<h3 class="title">Made self-hosting simple.</h3>
	</div>
	<div class="flex flex-1 flex-col lg:max-w-2xl">
		<div class="flex flex-row p-8 items-center space-x-3 justify-between bg-base-200">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<div class="icons cursor-pointer" on:click={() => goto('/')}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					fill="none"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path stroke="none" d="M0 0h24v24H0z" fill="none" />
					<line x1="5" y1="12" x2="19" y2="12" />
					<line x1="5" y1="12" x2="11" y2="18" />
					<line x1="5" y1="12" x2="11" y2="6" />
				</svg>
			</div>
			<div class="flex flex-row items-center space-x-3">
				{#if $appSession.whiteLabeledDetails.icon}
					<div class="avatar" style="width: 40px; height: 40px">
						<img
							src={$appSession.whiteLabeledDetails.icon}
							alt="Icon for white labeled version of Vpaas"
						/>
					</div>
				{:else}
					<div>
						<div class="avatar" style="width: 40px; height: 40px">
							<img src="favicon.png" alt="Vpaas icon" />
						</div>
					</div>
					<div class="prose">
						<h4>Vpaas</h4>
					</div>
				{/if}
			</div>
		</div>
		<div
			class="w-full md:px-20 lg:px-10 xl:px-20 p-6 flex flex-col h-full justify-center items-center bg-base-200"
		>
			<div class="mb-5 w-full prose prose-neutral">
				<h1 class="m-0 white">Get started</h1>
				<h5>Enter the required fields to complete the registration.</h5>
			</div>
			<form on:submit|preventDefault={handleSubmit} class="flex flex-col py-4 space-y-3 w-full">
				<input
					type="email"
					id="input-label"
					class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
					placeholder={$t('forms.email')}
					bind:this={emailEl}
					bind:value={email}
				/>
				<!-- Form Group -->
				<div class="relative">
					<input
						id="hs-toggle-password"
						type="password"
						class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
						placeholder={$t('forms.password')}
						bind:this={passwordEl}
						bind:value={password}
					/>
					<button
						type="button"
						data-hs-toggle-password={`{
        "target": "#hs-toggle-password"
      }`}
						class="absolute top-0 end-0 p-3.5 rounded-e-md dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
					>
						<svg
							class="flex-shrink-0 w-3.5 h-3.5 text-gray-400 dark:text-neutral-600"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path class="hs-password-active:hidden" d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
							<path
								class="hs-password-active:hidden"
								d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
							/>
							<path
								class="hs-password-active:hidden"
								d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
							/>
							<line class="hs-password-active:hidden" x1="2" x2="22" y1="2" y2="22" />
							<path
								class="hidden hs-password-active:block"
								d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
							/>
							<circle class="hidden hs-password-active:block" cx="12" cy="12" r="3" />
						</svg>
					</button>
				</div>

				<div class="relative">
					<input
						id="hs-toggle-password"
						type="password"
						class="py-3 px-4 block w-full border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-700 dark:text-gray-400 dark:focus:ring-gray-600"
						placeholder={$t('forms.password_again')}
						bind:value={passwordCheck}
					/>
					<button
						type="button"
						data-hs-toggle-password={`{
        "target": "#hs-toggle-password"
      }`}
						class="absolute top-0 end-0 p-3.5 rounded-e-md dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
					>
						<svg
							class="flex-shrink-0 w-3.5 h-3.5 text-gray-400 dark:text-neutral-600"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path class="hs-password-active:hidden" d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
							<path
								class="hs-password-active:hidden"
								d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"
							/>
							<path
								class="hs-password-active:hidden"
								d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
							/>
							<line class="hs-password-active:hidden" x1="2" x2="22" y1="2" y2="22" />
							<path
								class="hidden hs-password-active:block"
								d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
							/>
							<circle class="hidden hs-password-active:block" cx="12" cy="12" r="3" />
						</svg>
					</button>
				</div>

				<input type="password" name="passwordCheck" required class="w-full input input-bordered" />

				<div class="flex space-y-3 flex-col pt-3">
					<button
						type="submit"
						class="w-full py-3 px-4 inline-flex justify-center items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-gray-600"
						class:disabled={loading}
					>
						{#if loading}
							<span
								class="animate-spin inline-block w-4 h-4 border-[3px] border-current border-t-transparent text-white rounded-full"
								role="status"
								aria-label="loading"
							>
								<span class="sr-only">Loading...</span>
							</span>
						{/if}
						{loading ? $t('register.registering') : $t('register.register')}
					</button>
				</div>
			</form>
			{#if userCount === 0}
				<div class="pt-5">
					{$t('register.first_user')}
				</div>
			{/if}
		</div>
	</div>
</div>
