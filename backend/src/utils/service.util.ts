import { readFileSync } from 'fs';
import * as path from 'path';
import * as jwt from 'jsonwebtoken';

import { isARM } from './database.util';
import { getSecretKey } from './env.util';

const isDev = process.env.NODE_ENV !== 'production';

export function getTemplates() {
  const templatePath = isDev ? 'templates.json' : '/app/templates.json';
  try {
    const data = readFileSync(
      isDev ? path.join(process.cwd(), templatePath) : templatePath,
      { encoding: 'utf-8' },
    );
    let jsonData = JSON.parse(data);
    if (isARM()) {
      jsonData = jsonData.filter((d) => d.arch !== 'amd64');
    }

    return jsonData;
  } catch (error) {
    console.log('error', error);
    return [];
  }
}

export function fixType(type: string) {
  return type?.replaceAll(' ', '').toLowerCase() || null;
}

export async function getTags(type: string) {
  try {
    if (type) {
      const tagsPath = isDev ? 'tags.json' : '/app/tags.json';
      const data = readFileSync(
        isDev ? path.join(process.cwd(), tagsPath) : tagsPath,
        'utf8',
      );
      let tags = JSON.parse(data);
      if (tags) {
        tags = tags.find((tag: any) => tag.name.includes(type));
        tags.tags = tags.tags.sort(compareSemanticVersions).reverse();
        return tags;
      }
    }
  } catch (error) {
    return [];
  }
}

const compareSemanticVersions = (a: string, b: string) => {
  const a1 = a.split('.');
  const b1 = b.split('.');
  const len = Math.min(a1.length, b1.length);
  for (let i = 0; i < len; i++) {
    const a2 = +a1[i] || 0;
    const b2 = +b1[i] || 0;
    if (a2 !== b2) {
      return a2 > b2 ? 1 : -1;
    }
  }
  return b1.length - a1.length;
};

export function getDomain(domain: string): string {
  if (domain) {
    return domain?.replace('https://', '').replace('http://', '');
  } else {
    return '';
  }
}

export function generateToken() {
  return jwt.sign(
    {
      nbf: Math.floor(Date.now() / 1000) - 30,
    },
    getSecretKey(),
  );
}
