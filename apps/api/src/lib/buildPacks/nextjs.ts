import { promises as fs } from 'fs';
import { generateSecrets } from '../common';
import { buildCacheImageWithNode, buildImage, checkPnpm } from './common';

const createDockerfile = async (data, image): Promise<void> => {
	const {
		applicationId,
		buildId,
		tag,
		workdir,
		publishDirectory,
		port,
		installCommand,
		buildCommand,
		startCommand,
		baseDirectory,
		secrets,
		pullmergeRequestId,
		deploymentType,
		baseImage
	} = data;
	const Dockerfile: Array<string> = [];
	const isPnpm = checkPnpm(installCommand, buildCommand, startCommand);
	Dockerfile.push(`FROM ${image}`);
	Dockerfile.push('WORKDIR /app');
	Dockerfile.push(`LABEL vpaas.buildId=${buildId}`);
	if (secrets.length > 0) {
		generateSecrets(secrets, pullmergeRequestId, true).forEach((env) => {
			Dockerfile.push(env);
		});
	}
	if (isPnpm) {
		Dockerfile.push('RUN curl -f https://get.pnpm.io/v6.16.js | node - add --global pnpm@7');
	}
	if (deploymentType === 'node') {
		Dockerfile.push(`COPY .${baseDirectory || ''} ./`);
		Dockerfile.push(`RUN ${installCommand}`);
		Dockerfile.push(`RUN ${buildCommand}`);
		Dockerfile.push('RUN rm -fr .git');
		Dockerfile.push(`EXPOSE ${port}`);
		Dockerfile.push(`CMD ${startCommand}`);
	} else if (deploymentType === 'static') {
		if (baseImage?.includes('nginx')) {
			Dockerfile.push(`COPY /nginx.conf /etc/nginx/nginx.conf`);
		}
		Dockerfile.push(`COPY --from=${applicationId}:${tag}-cache /app${publishDirectory} ./`);
		Dockerfile.push('RUN rm -fr .git');
		Dockerfile.push(`EXPOSE 80`);
	}

	await fs.writeFile(`${workdir}/Dockerfile`, Dockerfile.join('\n'));
};

export default async function (data) {
	try {
		const { baseImage, baseBuildImage, deploymentType, buildCommand } = data;
		if (deploymentType === 'node') {
			await createDockerfile(data, baseImage);
			await buildImage(data);
		} else if (deploymentType === 'static') {
			if (buildCommand) await buildCacheImageWithNode(data, baseBuildImage);
			await createDockerfile(data, baseImage);
			await buildImage(data);
		}
	} catch (error) {
		throw error;
	}
}
