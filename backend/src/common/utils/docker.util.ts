export function safeParseChunk(chunk: string): {
  stream?: string;
  error?: any;
  errorDetail?: any;
}[] {
  chunk = `${chunk}`.trim();
  try {
    // See https://github.com/caprover/caprover/issues/570
    // This appears to be bug either in Docker or dockerone:
    // Sometimes chunk appears as two JSON objects, like
    // ```
    // {"stream":"something......"}
    // {"stream":"another line of things"}
    // ```
    const chunks = chunk.split('\n');
    const returnVal = [] as any[];
    chunks.forEach((chk) => {
      returnVal.push(JSON.parse(chk));
    });
    return returnVal;
  } catch (ignore) {
    return [
      {
        stream: `Cannot parse ${chunk}`,
      },
    ];
  }
}
