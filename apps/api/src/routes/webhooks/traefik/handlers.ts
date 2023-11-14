import { FastifyRequest } from 'fastify';
import { errorHandler, executeCommand, getDomain, isDev, prisma } from '../../../lib/common';
import { getTemplates } from '../../../lib/services';
import { OnlyId } from '../../../types';
import { parseAndFindServiceTemplates } from '../../api/v1/services/handlers';
import { hashPassword } from '../../api/v1/handlers';

function generateServices(serviceId, containerId, port, isHttp2 = false, isHttps = false) {
	if (isHttp2) {
		return {
			[serviceId]: {
				loadbalancer: {
					servers: [
						{
							url: `${isHttps ? 'https' : 'http'}://${containerId}:${port}`
						}
					]
				}
			},
			[`${serviceId}-http2`]: {
				loadbalancer: {
					servers: [
						{
							url: `h2c://${containerId}:${port}`
						}
					]
				}
			}
		};
	}
	return {
		[serviceId]: {
			loadbalancer: {
				servers: [
					{
						url: `http://${containerId}:${port}`
					}
				]
			}
		}
	};
}
async function generateRouters({
	serviceId,
	domain,
	nakedDomain,
	pathPrefix,
	isHttps,
	isWWW,
	isDualCerts,
	isCustomSSL,
	isHttp2 = false,
	httpBasicAuth = null,
}) {
	const rule = `Host(\`${nakedDomain}\`)${pathPrefix ? ` && PathPrefix(\`${pathPrefix}\`)` : ''}`;
	const ruleWWW = `Host(\`www.${nakedDomain}\`)${pathPrefix ? ` && PathPrefix(\`${pathPrefix}\`)` : ''
		}`;


	const http: any = {
		entrypoints: ['web'],
		rule,
		service: `${serviceId}`,
		priority: 2,
		middlewares: []
	};
	const https: any = {
		entrypoints: ['websecure'],
		rule,
		service: `${serviceId}`,
		priority: 2,
		tls: {
			certresolver: 'letsencrypt'
		},
		middlewares: []
	};
	const httpWWW: any = {
		entrypoints: ['web'],
		rule: ruleWWW,
		service: `${serviceId}`,
		priority: 2,
		middlewares: []
	};
	const httpsWWW: any = {
		entrypoints: ['websecure'],
		rule: ruleWWW,
		service: `${serviceId}`,
		priority: 2,
		tls: {
			certresolver: 'letsencrypt'
		},
		middlewares: []
	};
	// 2. http + non-www only
	if (!isHttps && !isWWW) {
		https.middlewares.push('redirect-to-http');
		httpsWWW.middlewares.push('redirect-to-http');

		httpWWW.middlewares.push('redirect-to-non-www');
		httpsWWW.middlewares.push('redirect-to-non-www');
		delete https.tls;
		delete httpsWWW.tls;

		if (httpBasicAuth) {
			http.middlewares.push(`${serviceId}-${pathPrefix}-basic-auth`);
		}
	}

	// 3. http + www only
	if (!isHttps && isWWW) {
		https.middlewares.push('redirect-to-http');
		httpsWWW.middlewares.push('redirect-to-http');

		http.middlewares.push('redirect-to-www');
		https.middlewares.push('redirect-to-www');
		delete https.tls;
		delete httpsWWW.tls;

		if (httpBasicAuth) {
			httpWWW.middlewares.push(`${serviceId}-${pathPrefix}-basic-auth`);
		}
	}
	// 5. https + non-www only
	if (isHttps && !isWWW) {
		http.middlewares.push('redirect-to-https');
		httpWWW.middlewares.push('redirect-to-https');
		if (!isDualCerts) {
			httpWWW.middlewares.push('redirect-to-non-www');
			httpsWWW.middlewares.push('redirect-to-non-www');
		}
		if (isCustomSSL) {
			if (isDualCerts) {
				https.tls = true;
				httpsWWW.tls = true;
			} else {
				https.tls = true;
				delete httpsWWW.tls.certresolver;
				httpsWWW.tls.domains = {
					main: domain
				};
			}
		} else {
			if (!isDualCerts) {
				delete httpsWWW.tls.certresolver;
				httpsWWW.tls.domains = {
					main: domain
				};
			}
		}

		if (httpBasicAuth) {
			https.middlewares.push(`${serviceId}-${pathPrefix}-basic-auth`);
		}
	}
	// 6. https + www only
	if (isHttps && isWWW) {
		http.middlewares.push('redirect-to-https');
		httpWWW.middlewares.push('redirect-to-https');
		if (!isDualCerts) {
			http.middlewares.push('redirect-to-www');
			https.middlewares.push('redirect-to-www');
		}

		if (httpBasicAuth) {
			httpsWWW.middlewares.push(`${serviceId}-${pathPrefix}-basic-auth`);
		}

		if (isCustomSSL) {
			if (isDualCerts) {
				https.tls = true;
				httpsWWW.tls = true;
			} else {
				httpsWWW.tls = true;
				delete https.tls.certresolver;
				https.tls.domains = {
					main: domain
				};
			}
		} else {
			if (!isDualCerts) {
				delete https.tls.certresolver;
				https.tls.domains = {
					main: domain
				};
			}
		}
	}
	if (isHttp2) {
		const http2 = {
			...http,
			service: `${serviceId}-http2`,
			rule: `${rule} && HeadersRegexp(\`Content-Type\`, \`application/grpc*\`)`
		};
		const http2WWW = {
			...httpWWW,
			service: `${serviceId}-http2`,
			rule: `${rule} && HeadersRegexp(\`Content-Type\`, \`application/grpc*\`)`
		};
		const https2 = {
			...https,
			service: `${serviceId}-http2`,
			rule: `${rule} && HeadersRegexp(\`Content-Type\`, \`application/grpc*\`)`
		};

		const https2WWW = {
			...httpsWWW,
			service: `${serviceId}-http2`,
			rule: `${rule} && HeadersRegexp(\`Content-Type\`, \`application/grpc*\`)`
		};
		return {
			[`${serviceId}-${pathPrefix}`]: { ...http },
			[`${serviceId}-${pathPrefix}-http2`]: { ...http2 },
			[`${serviceId}-${pathPrefix}-secure`]: { ...https },
			[`${serviceId}-${pathPrefix}-secure-http2`]: { ...https2 },
			[`${serviceId}-${pathPrefix}-www`]: { ...httpWWW },
			[`${serviceId}-${pathPrefix}-www-http2`]: { ...http2WWW },
			[`${serviceId}-${pathPrefix}-secure-www`]: { ...httpsWWW },
			[`${serviceId}-${pathPrefix}-secure-www-http2`]: { ...https2WWW }
		};
	}

	const result = {
		[`${serviceId}-${pathPrefix}`]: { ...http },
		[`${serviceId}-${pathPrefix}-secure`]: { ...https },
		[`${serviceId}-${pathPrefix}-www`]: { ...httpWWW },
		[`${serviceId}-${pathPrefix}-secure-www`]: { ...httpsWWW }
	};

	return result;
}
export async function proxyConfiguration(request: FastifyRequest<OnlyId>, remote = false) {
	const traefik = {
		tls: {
			certificates: []
		},
		http: {
			routers: {},
			services: {},
			middlewares: {
				'redirect-to-https': {
					redirectscheme: {
						scheme: 'https'
					}
				},
				'redirect-to-http': {
					redirectscheme: {
						scheme: 'http'
					}
				},
				'redirect-to-non-www': {
					redirectregex: {
						regex: '^https?://www\\.(.+)',
						replacement: 'http://${1}'
					}
				},
				'redirect-to-www': {
					redirectregex: {
						regex: '^https?://(?:www\\.)?(.+)',
						replacement: 'http://www.${1}'
					}
				}
			}
		}
	};
	try {
		const { id = null } = request.params;
		const vpaasSettings = await prisma.setting.findFirst();
		if (vpaasSettings.isTraefikUsed && vpaasSettings.proxyDefaultRedirect) {
			traefik.http.routers['catchall-http'] = {
				entrypoints: ['web'],
				rule: 'HostRegexp(`{catchall:.*}`)',
				service: 'noop',
				priority: 1,
				middlewares: ['redirect-regexp']
			};
			traefik.http.routers['catchall-https'] = {
				entrypoints: ['websecure'],
				rule: 'HostRegexp(`{catchall:.*}`)',
				service: 'noop',
				priority: 1,
				middlewares: ['redirect-regexp']
			};
			traefik.http.middlewares['redirect-regexp'] = {
				redirectregex: {
					regex: '(.*)',
					replacement: vpaasSettings.proxyDefaultRedirect,
					permanent: false
				}
			};
			traefik.http.services['noop'] = {
				loadBalancer: {
					servers: [
						{
							url: ''
						}
					]
				}
			};
		}
		const sslpath = '/etc/traefik/acme/custom';

		let certificates = await prisma.certificate.findMany({
			where: {
				team: {
					applications: { some: { settings: { isCustomSSL: true } } },
					destinationDocker: { some: { remoteEngine: false, isProxyUsed: true } }
				}
			}
		});

		if (remote) {
			certificates = await prisma.certificate.findMany({
				where: {
					team: {
						applications: { some: { settings: { isCustomSSL: true } } },
						destinationDocker: {
							some: { id, remoteEngine: true, isProxyUsed: true, remoteVerified: true }
						}
					}
				}
			});
		}

		const parsedCertificates = [];
		for (const certificate of certificates) {
			parsedCertificates.push({
				certFile: `${sslpath}/${certificate.id}-cert.pem`,
				keyFile: `${sslpath}/${certificate.id}-key.pem`
			});
		}
		if (parsedCertificates.length > 0) {
			traefik.tls.certificates = parsedCertificates;
		}

		let applications = [];
		let services = [];
		if (id) {
			applications = await prisma.application.findMany({
				where: { destinationDocker: { id } },
				include: { destinationDocker: true, settings: true }
			});
			services = await prisma.service.findMany({
				where: { destinationDocker: { id } },
				include: {
					destinationDocker: true,
					persistentStorage: true,
					serviceSecret: true,
					serviceSetting: true
				},
				orderBy: { createdAt: 'desc' }
			});
		} else {
			applications = await prisma.application.findMany({
				where: { destinationDocker: { remoteEngine: false } },
				include: { destinationDocker: true, settings: true }
			});
			services = await prisma.service.findMany({
				where: { destinationDocker: { remoteEngine: false } },
				include: {
					destinationDocker: true,
					persistentStorage: true,
					serviceSecret: true,
					serviceSetting: true
				},
				orderBy: { createdAt: 'desc' }
			});
		}

		if (applications.length > 0) {
			const dockerIds = new Set();
			const runningContainers = {};
			applications.forEach((app) => dockerIds.add(app.destinationDocker.id));
			for (const dockerId of dockerIds) {
				const { stdout: container } = await executeCommand({
					dockerId,
					command: `docker container ls --filter 'label=vpaas.managed=true' --format '{{ .Names}}'`
				});
				if (container) {
					const containersArray = container.trim().split('\n');
					if (containersArray.length > 0) {
						runningContainers[dockerId] = containersArray;
					}
				}
			}
			for (const application of applications) {
				try {
					const {
						fqdn,
						id,
						port,
						buildPack,
						dockerComposeConfiguration,
						destinationDocker,
						destinationDockerId,
						settings,
						basicAuthUser,
						basicAuthPw,
						settings: { basicAuth: isBasicAuthEnabled }
					} = application;
					if (!destinationDockerId) {
						continue;
					}
					if (
						!runningContainers[destinationDockerId] ||
						runningContainers[destinationDockerId].length === 0 ||
						runningContainers[destinationDockerId].filter((container) => container.startsWith(id))
							.length === 0
					) {
						continue;
					}
					let httpBasicAuth = null;
					if (basicAuthUser && basicAuthPw && isBasicAuthEnabled) {
						httpBasicAuth = {
							basicAuth: {
								users: [basicAuthUser + ':' + await hashPassword(basicAuthPw, 1)]
							}
						};
					}
					if (buildPack === 'compose') {
						const services = Object.entries(JSON.parse(dockerComposeConfiguration));
						if (services.length > 0) {
							for (const service of services) {
								const [key, value] = service;
								if (key && value) {
									if (!value.fqdn || !value.port) {
										continue;
									}
									const { fqdn, port } = value;
									const containerId = `${id}-${key}`;
									const domain = getDomain(fqdn);
									const nakedDomain = domain.replace(/^www\./, '');
									const isHttps = fqdn.startsWith('https://');
									const isWWW = fqdn.includes('www.');
									const pathPrefix = '/';
									const isCustomSSL = false;
									const dualCerts = false;
									const serviceId = `${id}-${port || 'default'}`;

									traefik.http.routers = {
										...traefik.http.routers,
										...await generateRouters({
											serviceId,
											domain,
											nakedDomain,
											pathPrefix,
											isHttps,
											isWWW,
											isDualCerts: dualCerts,
											isCustomSSL,
											httpBasicAuth
										})
									};
									traefik.http.services = {
										...traefik.http.services,
										...generateServices(serviceId, containerId, port)
									};
									if (httpBasicAuth) {
										traefik.http.middlewares[`${serviceId}-${pathPrefix}-basic-auth`] = {
											...httpBasicAuth
										};
									}
								}
							}
						}
						continue;
					}
					const { previews, dualCerts, isCustomSSL, isHttp2, basicAuth } = settings;
					const { network, id: dockerId } = destinationDocker;
					if (!fqdn) {
						continue;
					}
					const domain = getDomain(fqdn);
					const nakedDomain = domain.replace(/^www\./, '');
					const isHttps = fqdn.startsWith('https://');
					const isWWW = fqdn.includes('www.');
					const pathPrefix = '/';
					const serviceId = `${id}-${port || 'default'}`;
					traefik.http.routers = {
						...traefik.http.routers,
						...await generateRouters({
							serviceId,
							domain,
							nakedDomain,
							pathPrefix,
							isHttps,
							isWWW,
							isDualCerts: dualCerts,
							isCustomSSL,
							isHttp2,
							httpBasicAuth
						})
					};
					traefik.http.services = {
						...traefik.http.services,
						...generateServices(serviceId, id, port, isHttp2, isHttps)
					};
					if (httpBasicAuth) {
						traefik.http.middlewares[`${serviceId}-${pathPrefix}-basic-auth`] = {
							...httpBasicAuth
						};
					}
					if (previews) {
						const { stdout } = await executeCommand({
							dockerId,
							command: `docker container ls --filter="status=running" --filter="network=${network}" --filter="name=${id}-" --format="{{json .Names}}"`
						});
						if (stdout) {
							const containers = stdout
								.trim()
								.split('\n')
								.filter((a) => a)
								.map((c) => c.replace(/"/g, ''));
							if (containers.length > 0) {
								for (const container of containers) {
									const previewDomain = `${container.split('-')[1]}${vpaasSettings.previewSeparator
										}${domain}`;
									const nakedDomain = previewDomain.replace(/^www\./, '');
									const pathPrefix = '/';
									const serviceId = `${container}-${port || 'default'}`;
									traefik.http.routers = {
										...traefik.http.routers,
										...await generateRouters({
											serviceId,
											domain: previewDomain,
											nakedDomain,
											pathPrefix,
											isHttps,
											isWWW,
											isDualCerts: dualCerts,
											isCustomSSL,
											isHttp2: false,
											httpBasicAuth
										})
									};
									traefik.http.services = {
										...traefik.http.services,
										...generateServices(serviceId, container, port, isHttp2)
									};
									if (httpBasicAuth) {
										traefik.http.middlewares[`${serviceId}-${pathPrefix}-basic-auth`] = {
											...httpBasicAuth
										};
									}
								}
							}
						}
					}
				} catch (error) {
					console.log(error);
				}
			}
		}
		if (services.length > 0) {
			const dockerIds = new Set();
			const runningContainers = {};
			services.forEach((app) => dockerIds.add(app.destinationDocker.id));
			for (const dockerId of dockerIds) {
				const { stdout: container } = await executeCommand({
					dockerId,
					command: `docker container ls --filter 'label=vpaas.managed=true' --format '{{ .Names}}'`
				});
				if (container) {
					const containersArray = container.trim().split('\n');
					if (containersArray.length > 0) {
						runningContainers[dockerId] = containersArray;
					}
				}
			}
			for (const service of services) {
				try {
					let { fqdn, id, type, destinationDockerId, dualCerts, serviceSetting } = service;
					if (!fqdn) {
						continue;
					}
					if (!destinationDockerId) {
						continue;
					}
					if (
						!runningContainers[destinationDockerId] ||
						runningContainers[destinationDockerId].length === 0 ||
						!runningContainers[destinationDockerId].includes(id)
					) {
						continue;
					}
					const templates = await getTemplates();
					let found = templates.find((a) => a.type === type);
					if (!found) {
						continue;
					}
					found = JSON.parse(JSON.stringify(found).replaceAll('$$id', id));
					for (const oneService of Object.keys(found.services)) {
						const isDomainAndProxyConfiguration =
							found?.services[oneService]?.proxy?.filter((p) => p.port) ?? [];
						if (isDomainAndProxyConfiguration.length > 0) {
							const template: any = await parseAndFindServiceTemplates(service, null, true);
							const { proxy } = template.services[oneService] || found.services[oneService];
							for (const configuration of proxy) {
								if (configuration.hostPort) {
									continue;
								}
								if (configuration.domain) {
									const setting = serviceSetting.find(
										(a) => a.variableName === configuration.domain
									);
									if (setting) {
										configuration.domain = configuration.domain.replace(
											configuration.domain,
											setting.value
										);
									}
								}
								const foundPortVariable = serviceSetting.find(
									(a) => a.name.toLowerCase() === 'port'
								);
								if (foundPortVariable) {
									configuration.port = foundPortVariable.value;
								}
								let port, pathPrefix, customDomain;
								if (configuration) {
									port = configuration?.port;
									pathPrefix = configuration?.pathPrefix || '/';
									customDomain = configuration?.domain;
								}
								if (customDomain) {
									fqdn = customDomain;
								} else {
									fqdn = service.fqdn;
								}
								const domain = getDomain(fqdn);
								const nakedDomain = domain.replace(/^www\./, '');
								const isHttps = fqdn.startsWith('https://');
								const isWWW = fqdn.includes('www.');
								const isCustomSSL = false;
								const serviceId = `${oneService}-${port || 'default'}`;
								traefik.http.routers = {
									...traefik.http.routers,
									...await generateRouters({
										serviceId,
										domain,
										nakedDomain,
										pathPrefix,
										isHttps,
										isWWW,
										isDualCerts: dualCerts,
										isCustomSSL,
									})
								};
								traefik.http.services = {
									...traefik.http.services,
									...generateServices(serviceId, oneService, port)
								};
							}
						} else {
							if (found.services[oneService].ports && found.services[oneService].ports.length > 0) {
								for (let [index, port] of found.services[oneService].ports.entries()) {
									if (port == 22) continue;
									if (index === 0) {
										const foundPortVariable = serviceSetting.find(
											(a) => a.name.toLowerCase() === 'port'
										);
										if (foundPortVariable) {
											port = foundPortVariable.value;
										}
									}
									const domain = getDomain(fqdn);
									const nakedDomain = domain.replace(/^www\./, '');
									const isHttps = fqdn.startsWith('https://');
									const isWWW = fqdn.includes('www.');
									const pathPrefix = '/';
									const isCustomSSL = false;
									const serviceId = `${oneService}-${port || 'default'}`;
									traefik.http.routers = {
										...traefik.http.routers,
										...await generateRouters({
											serviceId,
											domain,
											nakedDomain,
											pathPrefix,
											isHttps,
											isWWW,
											isDualCerts: dualCerts,
											isCustomSSL
										})
									};
									traefik.http.services = {
										...traefik.http.services,
										...generateServices(serviceId, id, port)
									};
								}
							}
						}
					}
				} catch (error) {
					console.log(error);
				}
			}
		}
		if (!remote) {
			const { fqdn, dualCerts } = await prisma.setting.findFirst();
			if (!fqdn) {
				return;
			}
			const domain = getDomain(fqdn);
			const nakedDomain = domain.replace(/^www\./, '');
			const isHttps = fqdn.startsWith('https://');
			const isWWW = fqdn.includes('www.');
			const id = isDev ? 'host.docker.internal' : 'vpaas';
			const container = isDev ? 'host.docker.internal' : 'vpaas';
			const port = 3000;
			const pathPrefix = '/';
			const isCustomSSL = false;
			const serviceId = `${id}-${port || 'default'}`;
			traefik.http.routers = {
				...traefik.http.routers,
				...await generateRouters({
					serviceId,
					domain,
					nakedDomain,
					pathPrefix,
					isHttps,
					isWWW,
					isDualCerts: dualCerts,
					isCustomSSL
				})
			};
			traefik.http.services = {
				...traefik.http.services,
				...generateServices(serviceId, container, port)
			};
		}
	} catch (error) {
		console.log(error);
	} finally {
		if (Object.keys(traefik.http.routers).length === 0) {
			traefik.http.routers = null;
		}
		if (Object.keys(traefik.http.services).length === 0) {
			traefik.http.services = null;
		}
		return traefik;
	}
}

export async function otherProxyConfiguration(request: FastifyRequest<TraefikOtherConfiguration>) {
	try {
		const { id } = request.query;
		if (id) {
			const { privatePort, publicPort, type, address = id } = request.query;
			let traefik = {};
			if (publicPort && type && privatePort) {
				if (type === 'tcp') {
					traefik = {
						[type]: {
							routers: {
								[id]: {
									entrypoints: [type],
									rule: `HostSNI(\`*\`)`,
									service: id
								}
							},
							services: {
								[id]: {
									loadbalancer: {
										servers: [{ address: `${address}:${privatePort}` }]
									}
								}
							}
						}
					};
				} else if (type === 'http') {
					const service = await prisma.service.findFirst({
						where: { id }
					});
					if (service && service?.fqdn) {
						const domain = getDomain(service.fqdn);
						const isHttps = service.fqdn.startsWith('https://');
						traefik = {
							[type]: {
								routers: {
									[id]: {
										entrypoints: [type],
										rule: `Host(\`${domain}:${privatePort}\`)`,
										service: id
									}
								},
								services: {
									[id]: {
										loadbalancer: {
											servers: [{ url: `http://${id}:${privatePort}` }]
										}
									}
								}
							}
						};
						if (isHttps) {
							if (isDev) {
								traefik[type].routers[id].tls = {
									domains: {
										main: `${domain}`
									}
								};
							} else {
								traefik[type].routers[id].tls = {
									certresolver: 'letsencrypt'
								};
							}
						}
					} else {
						throw { status: 500 };
					}
				}
			} else {
				throw { status: 500 };
			}
			return {
				...traefik
			};
		}
		throw { status: 500 };
	} catch ({ status, message }) {
		return errorHandler({ status, message });
	}
}
