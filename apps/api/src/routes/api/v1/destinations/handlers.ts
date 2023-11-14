import type { FastifyRequest } from 'fastify';
import { FastifyReply } from 'fastify';
import {
	errorHandler,
	executeCommand,
	listSettings,
	prisma,
	startTraefikProxy,
	stopTraefikProxy
} from '../../../../lib/common';
import { checkContainer } from '../../../../lib/docker';

import type { OnlyId } from '../../../../types';
import type {
	CheckDestination,
	ListDestinations,
	NewDestination,
	Proxy,
	SaveDestinationSettings
} from './types';
import { removeService } from '../../../../lib/services/common';

export async function listDestinations(request: FastifyRequest<ListDestinations>) {
	try {
		const teamId = request.user.teamId;
		const { onlyVerified = false } = request.query;
		let destinations = [];
		if (teamId === '0') {
			destinations = await prisma.destinationDocker.findMany({ include: { teams: true } });
		} else {
			destinations = await prisma.destinationDocker.findMany({
				where: { teams: { some: { id: teamId } } },
				include: { teams: true }
			});
		}
		if (onlyVerified) {
			destinations = destinations.filter(
				(destination) =>
					destination.engine || (destination.remoteEngine && destination.remoteVerified)
			);
		}
		return {
			destinations
		};
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
export async function checkDestination(request: FastifyRequest<CheckDestination>) {
	try {
		const { network } = request.body;
		const found = await prisma.destinationDocker.findFirst({ where: { network } });
		if (found) {
			throw {
				message: `Network already exists: ${network}`
			};
		}
		return {};
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
export async function getDestination(request: FastifyRequest<OnlyId>) {
	try {
		const { id } = request.params;
		const teamId = request.user?.teamId;
		const destination = await prisma.destinationDocker.findFirst({
			where: { id, teams: { some: { id: teamId === '0' ? undefined : teamId } } },
			include: { sshKey: true, application: true, service: true, database: true }
		});
		if (!destination && id !== 'new') {
			throw { status: 404, message: `Destination not found.` };
		}
		const settings = await listSettings();
		const payload = {
			destination,
			settings
		};
		return {
			...payload
		};
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
export async function newDestination(request: FastifyRequest<NewDestination>, reply: FastifyReply) {
	try {
		const teamId = request.user.teamId;
		const { id } = request.params;

		let { name, network, engine, isProxyUsed, remoteIpAddress, remoteUser, remotePort } =
			request.body;
		if (id === 'new') {
			if (engine) {
				const { stdout } = await await executeCommand({
					command: `docker network ls --filter 'name=^${network}$' --format '{{json .}}'`
				});
				if (stdout === '') {
					await await executeCommand({ command: `docker network create --attachable ${network}` });
				}
				await prisma.destinationDocker.create({
					data: { name, teams: { connect: { id: teamId } }, engine, network, isProxyUsed }
				});
				const destinations = await prisma.destinationDocker.findMany({ where: { engine } });
				const destination = destinations.find((destination) => destination.network === network);
				if (destinations.length > 0) {
					const proxyConfigured = destinations.find(
						(destination) => destination.network !== network && destination.isProxyUsed === true
					);
					if (proxyConfigured) {
						isProxyUsed = !!proxyConfigured.isProxyUsed;
					}
					await prisma.destinationDocker.updateMany({
						where: { engine },
						data: { isProxyUsed }
					});
				}
				if (isProxyUsed) {
					await startTraefikProxy(destination.id);
				}
				return reply.code(201).send({ id: destination.id });
			} else {
				const destination = await prisma.destinationDocker.create({
					data: {
						name,
						teams: { connect: { id: teamId } },
						engine,
						network,
						isProxyUsed,
						remoteEngine: true,
						remoteIpAddress,
						remoteUser,
						remotePort: Number(remotePort)
					}
				});
				return reply.code(201).send({ id: destination.id });
			}
		} else {
			await prisma.destinationDocker.update({ where: { id }, data: { name, engine, network } });
			return reply.code(201).send();
		}
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
export async function forceDeleteDestination(request: FastifyRequest<OnlyId>) {
	try {
		const { id } = request.params;
		const services = await prisma.service.findMany({ where: { destinationDockerId: id } });
		for (const service of services) {
			await removeService({ id: service.id });
		}
		const applications = await prisma.application.findMany({ where: { destinationDockerId: id } });
		for (const application of applications) {
			await prisma.applicationSettings.deleteMany({
				where: { application: { id: application.id } }
			});
			await prisma.buildLog.deleteMany({ where: { applicationId: application.id } });
			await prisma.build.deleteMany({ where: { applicationId: application.id } });
			await prisma.secret.deleteMany({ where: { applicationId: application.id } });
			await prisma.applicationPersistentStorage.deleteMany({
				where: { applicationId: application.id }
			});
			await prisma.applicationConnectedDatabase.deleteMany({
				where: { applicationId: application.id }
			});
			await prisma.previewApplication.deleteMany({ where: { applicationId: application.id } });
		}
		const databases = await prisma.database.findMany({ where: { destinationDockerId: id } });
		for (const database of databases) {
			await prisma.databaseSettings.deleteMany({ where: { databaseId: database.id } });
			await prisma.databaseSecret.deleteMany({ where: { databaseId: database.id } });
			await prisma.database.delete({ where: { id: database.id } });
		}
		await prisma.destinationDocker.delete({ where: { id } });
		return {};
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
export async function deleteDestination(request: FastifyRequest<OnlyId>) {
	try {
		const { id } = request.params;
		const appFound = await prisma.application.findFirst({ where: { destinationDockerId: id } });
		const serviceFound = await prisma.service.findFirst({ where: { destinationDockerId: id } });
		const databaseFound = await prisma.database.findFirst({ where: { destinationDockerId: id } });
		if (appFound || serviceFound || databaseFound) {
			throw {
				message: `Destination is in use.<br>Remove all applications, services and databases using this destination first.`
			};
		}
		const { network, remoteVerified, engine, isProxyUsed } =
			await prisma.destinationDocker.findUnique({ where: { id } });
		if (isProxyUsed) {
			if (engine || remoteVerified) {
				const { stdout: found } = await executeCommand({
					dockerId: id,
					command: `docker ps -a --filter network=${network} --filter name=vpaas-proxy --format '{{.}}'`
				});
				if (found) {
					await executeCommand({
						dockerId: id,
						command: `docker network disconnect ${network} vpaas-proxy`
					});
					await executeCommand({ dockerId: id, command: `docker network rm ${network}` });
				}
			}
		}
		await prisma.destinationDocker.delete({ where: { id } });
		return {};
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
export async function saveDestinationSettings(request: FastifyRequest<SaveDestinationSettings>) {
	try {
		const { engine, isProxyUsed } = request.body;
		await prisma.destinationDocker.updateMany({
			where: { engine },
			data: { isProxyUsed }
		});

		return {
			status: 202
		};
		// return reply.code(201).send();
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
export async function startProxy(request: FastifyRequest<Proxy>) {
	const { id } = request.params;
	try {
		await startTraefikProxy(id);
		return {};
	} catch ({ status, message }) {
		await stopTraefikProxy(id);
		return errorHandler({ status, message });
	}
}
export async function stopProxy(request: FastifyRequest<Proxy>) {
	const { id } = request.params;
	try {
		await stopTraefikProxy(id);
		return {};
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
export async function restartProxy(request: FastifyRequest<Proxy>) {
	const { id } = request.params;
	try {
		await stopTraefikProxy(id);
		await startTraefikProxy(id);
		await prisma.destinationDocker.update({
			where: { id },
			data: { isProxyUsed: true }
		});
		return {};
	} catch ({ status, message }) {
		await prisma.destinationDocker.update({
			where: { id },
			data: { isProxyUsed: false }
		});
		return errorHandler({ status, message });
	}
}

export async function assignSSHKey(request: FastifyRequest) {
	try {
		const { id: sshKeyId } = request.body;
		const { id } = request.params;
		await prisma.destinationDocker.update({
			where: { id },
			data: { sshKey: { connect: { id: sshKeyId } } }
		});
		return {};
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
export async function verifyRemoteDockerEngineFn(id: string) {
	const { remoteIpAddress, network, isProxyUsed } = await prisma.destinationDocker.findFirst({
		where: { id }
	});
	const daemonJson = `daemon-${id}.json`;
	try {
		await executeCommand({
			sshCommand: true,
			command: `docker network inspect ${network}`,
			dockerId: id
		});
	} catch (error) {
		await executeCommand({
			command: `docker network create --attachable ${network}`,
			dockerId: id
		});
	}

	try {
		await executeCommand({
			sshCommand: true,
			command: `docker network inspect vpaas-infra`,
			dockerId: id
		});
	} catch (error) {
		await executeCommand({
			command: `docker network create --attachable vpaas-infra`,
			dockerId: id
		});
	}

	if (isProxyUsed) await startTraefikProxy(id);
	let isUpdated = false;
	let daemonJsonParsed = {
		'live-restore': true,
		features: {
			buildkit: true
		}
	};
	try {
		const { stdout: daemonJson } = await executeCommand({
			sshCommand: true,
			dockerId: id,
			command: `cat /etc/docker/daemon.json`
		});
		daemonJsonParsed = JSON.parse(daemonJson);
		if (!daemonJsonParsed['live-restore'] || daemonJsonParsed['live-restore'] !== true) {
			isUpdated = true;
			daemonJsonParsed['live-restore'] = true;
		}
		if (!daemonJsonParsed?.features?.buildkit) {
			isUpdated = true;
			daemonJsonParsed.features = {
				buildkit: true
			};
		}
	} catch (error) {
		isUpdated = true;
	}
	try {
		if (isUpdated) {
			await executeCommand({
				shell: true,
				command: `echo '${JSON.stringify(daemonJsonParsed, null, 2)}' > /tmp/${daemonJson}`
			});
			await executeCommand({
				dockerId: id,
				command: `scp /tmp/${daemonJson} ${remoteIpAddress}-remote:/etc/docker/daemon.json`
			});
			await executeCommand({ command: `rm /tmp/${daemonJson}` });
			await executeCommand({ sshCommand: true, dockerId: id, command: `systemctl restart docker` });
		}
		await prisma.destinationDocker.update({ where: { id }, data: { remoteVerified: true } });
	} catch (error) {
		console.log(error);
		throw new Error('Error while verifying remote docker engine');
	}
}
export async function verifyRemoteDockerEngine(
	request: FastifyRequest<OnlyId>,
	reply: FastifyReply
) {
	const { id } = request.params;
	try {
		await verifyRemoteDockerEngineFn(id);
		return reply.code(201).send();
	} catch ({ status, message }) {
		await prisma.destinationDocker.update({ where: { id }, data: { remoteVerified: false } });
		return errorHandler({ status, message });
	}
}

export async function getDestinationStatus(request: FastifyRequest<OnlyId>) {
	try {
		const { id } = request.params;
		const destination = await prisma.destinationDocker.findUnique({ where: { id } });
		const { found: isRunning } = await checkContainer({
			dockerId: destination.id,
			container: 'vpaas-proxy',
			remove: true
		});
		return {
			isRunning
		};
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
