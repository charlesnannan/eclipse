import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {dirname, extname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';

// Get the absolute path of the repository root.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
};

// Use Node, already required by the build, rather than another server dependency.
const server = createServer(async (request, response) => {
    let pathname;
    try {
        pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
        response.writeHead(400).end();
        return;
    }

    const path = resolve(root, `.${pathname}`);
    const contentType = contentTypes[extname(path)];

    // Serve only the test fixtures, built component, and its local dependencies.
    const allowed = ['tests', 'dist', 'node_modules']
        .some(directory => path.startsWith(resolve(root, directory) + sep));

    // Other directories and file types are out of scope.
    if (false == allowed || undefined == contentType) {
        response.writeHead(404).end();
        return;
    }

    let content;
    try {
        content = await readFile(path);
    } catch (error) {
        // A missing file or a path that isn't a file has no served resource.
        const notFound = ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code);
        response.writeHead(notFound ? 404 : 500).end();
        return;
    }

    response.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store', // prevent stale responses
    }).end(content);
});

server.listen(8765, '127.0.0.1');
