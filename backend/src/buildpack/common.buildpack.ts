export const scanningTemplates = {
  '@sveltejs/kit': {
    buildPack: 'nodejs',
  },
  astro: {
    buildPack: 'astro',
  },
  '@11ty/eleventy': {
    buildPack: 'eleventy',
  },
  svelte: {
    buildPack: 'svelte',
  },
  '@nestjs/core': {
    buildPack: 'nestjs',
  },
  next: {
    buildPack: 'nextjs',
  },
  nuxt: {
    buildPack: 'nuxtjs',
  },
  'react-scripts': {
    buildPack: 'react',
  },
  'parcel-bundler': {
    buildPack: 'static',
  },
  '@vue/cli-service': {
    buildPack: 'vuejs',
  },
  vuejs: {
    buildPack: 'vuejs',
  },
  gatsby: {
    buildPack: 'gatsby',
  },
  'preact-cli': {
    buildPack: 'react',
  },
};

export const setDefaultConfiguration = async (data: any) => {
  let {
    // eslint-disable-next-line prefer-const
    buildPack,
    port,
    installCommand,
    startCommand,
    buildCommand,
    publishDirectory,
    baseDirectory,
    dockerFileLocation,
    dockerComposeFileLocation,
    denoMainFile,
  } = data;
  const template = scanningTemplates[buildPack];
  if (!port) {
    port = template?.port || 3000;

    if (buildPack === 'static') port = 80;
    else if (buildPack === 'node') port = 3000;
    else if (buildPack === 'php') port = 80;
    else if (buildPack === 'python') port = 8000;
  }
  if (!installCommand && buildPack !== 'static' && buildPack !== 'laravel')
    installCommand = template?.installCommand || 'yarn install';
  if (!startCommand && buildPack !== 'static' && buildPack !== 'laravel')
    startCommand = template?.startCommand || 'yarn start';
  if (!buildCommand && buildPack !== 'static' && buildPack !== 'laravel')
    buildCommand = template?.buildCommand || null;
  if (!publishDirectory) {
    publishDirectory = template?.publishDirectory || null;
  } else {
    if (!publishDirectory.startsWith('/'))
      publishDirectory = `/${publishDirectory}`;
    if (publishDirectory.endsWith('/'))
      publishDirectory = publishDirectory.slice(0, -1);
  }
  if (baseDirectory) {
    if (!baseDirectory.startsWith('/')) baseDirectory = `/${baseDirectory}`;
    if (baseDirectory.endsWith('/') && baseDirectory !== '/')
      baseDirectory = baseDirectory.slice(0, -1);
  }
  if (dockerFileLocation) {
    if (!dockerFileLocation.startsWith('/'))
      dockerFileLocation = `/${dockerFileLocation}`;
    if (dockerFileLocation.endsWith('/'))
      dockerFileLocation = dockerFileLocation.slice(0, -1);
  } else {
    dockerFileLocation = '/Dockerfile';
  }
  if (dockerComposeFileLocation) {
    if (!dockerComposeFileLocation.startsWith('/'))
      dockerComposeFileLocation = `/${dockerComposeFileLocation}`;
    if (dockerComposeFileLocation.endsWith('/'))
      dockerComposeFileLocation = dockerComposeFileLocation.slice(0, -1);
  } else {
    dockerComposeFileLocation = '/Dockerfile';
  }
  if (!denoMainFile) {
    denoMainFile = 'main.ts';
  }

  return {
    buildPack,
    port,
    installCommand,
    startCommand,
    buildCommand,
    publishDirectory,
    baseDirectory,
    dockerFileLocation,
    dockerComposeFileLocation,
    denoMainFile,
  };
};
